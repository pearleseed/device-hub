/**
 * Mattermost Notification System - Route Integration Helpers
 * Helper functions to integrate notifications with existing routes
 */

import { db } from "../db/connection";
import { NotificationAction, DeviceInfo, NotificationResult } from "./types";
import {
  sendBorrowApprovalNotification,
  sendReturnConfirmationNotification,
  sendRenewalApprovalNotification,
  isServiceReady,
} from "./notification-service";

// ============================================================================
// Database Query Types
// ============================================================================

interface UserWithMattermost {
  id: number;
  name: string;
  email: string;
  mattermost_username?: string;
}

interface DeviceDetails {
  id: number;
  name: string;
  asset_tag: string;
  category: string;
  brand: string;
  model: string;
}

interface BorrowDetails {
  id: number;
  user_id: number;
  device_id: number;
  start_date: Date;
  end_date: Date;
}

interface RenewalDetails {
  id: number;
  user_id: number;
  borrow_request_id: number;
  current_end_date: Date;
  requested_end_date: Date;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the Mattermost username for a user
 * Falls back to email prefix if mattermost_username is not set
 * @param userId - The application user ID
 * @returns Mattermost username or null if user not found
 */
async function getMattermostUsername(userId: number): Promise<string | null> {
  try {
    const users = await db<UserWithMattermost>`
      SELECT id, name, email, mattermost_username FROM users WHERE id = ${userId}
    `;

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // Use mattermost_username if set, otherwise derive from email
    if (user.mattermost_username) {
      return user.mattermost_username;
    }

    // Fallback: use email prefix (before @)
    return user.email.split("@")[0];
  } catch (error) {
    console.error("[Mattermost Integration] Error getting username:", error);
    return null;
  }
}

/**
 * Gets device information for notifications
 * @param deviceId - The device ID
 * @returns Device info or null if not found
 */
async function getDeviceInfo(deviceId: number): Promise<DeviceInfo | null> {
  try {
    const devices = await db<DeviceDetails>`
      SELECT id, name, asset_tag, category, brand, model 
      FROM devices WHERE id = ${deviceId}
    `;

    if (devices.length === 0) {
      return null;
    }

    const device = devices[0];
    return {
      id: device.id,
      name: device.name,
      assetTag: device.asset_tag,
      category: device.category,
      brand: device.brand,
      model: device.model,
    };
  } catch (error) {
    console.error("[Mattermost Integration] Error getting device:", error);
    return null;
  }
}

// ============================================================================
// Notification Trigger Functions
// ============================================================================

/**
 * Triggers a BORROW approval notification
 * Call this when a borrow request status changes to 'approved' or 'active'
 * @param borrowRequestId - The borrow request ID
 * @returns Notification result or null if notification couldn't be sent
 */
export async function triggerBorrowNotification(
  borrowRequestId: number,
): Promise<NotificationResult | null> {
  if (!isServiceReady()) {
    console.log(
      "[Mattermost Integration] Service not ready, skipping notification",
    );
    return null;
  }

  try {
    // Get borrow request details
    const borrowRequests = await db<BorrowDetails>`
      SELECT id, user_id, device_id, start_date, end_date 
      FROM borrow_requests WHERE id = ${borrowRequestId}
    `;

    if (borrowRequests.length === 0) {
      console.error(
        "[Mattermost Integration] Borrow request not found:",
        borrowRequestId,
      );
      return null;
    }

    const borrow = borrowRequests[0];

    // Get user's Mattermost username
    const mattermostUsername = await getMattermostUsername(borrow.user_id);
    if (!mattermostUsername) {
      console.error(
        "[Mattermost Integration] Could not get Mattermost username for user:",
        borrow.user_id,
      );
      return null;
    }

    // Get device info
    const device = await getDeviceInfo(borrow.device_id);
    if (!device) {
      console.error(
        "[Mattermost Integration] Could not get device info:",
        borrow.device_id,
      );
      return null;
    }

    // Send notification
    return await sendBorrowApprovalNotification({
      userId: borrow.user_id,
      mattermostUsername,
      device,
      requestId: borrowRequestId,
      startDate: borrow.start_date.toISOString().split("T")[0],
      endDate: borrow.end_date.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error(
      "[Mattermost Integration] Error triggering borrow notification:",
      error,
    );
    return null;
  }
}

/**
 * Triggers a RETURN confirmation notification
 * Call this when a return request is created
 * @param returnRequestId - The return request ID
 * @returns Notification result or null if notification couldn't be sent
 */
export async function triggerReturnNotification(
  returnRequestId: number,
): Promise<NotificationResult | null> {
  if (!isServiceReady()) {
    console.log(
      "[Mattermost Integration] Service not ready, skipping notification",
    );
    return null;
  }

  try {
    // Get return request details with borrow info
    const returnDetails = await db<{
      id: number;
      borrow_request_id: number;
      return_date: Date;
      user_id: number;
      device_id: number;
    }>`
      SELECT rr.id, rr.borrow_request_id, rr.return_date, br.user_id, br.device_id
      FROM return_requests rr
      JOIN borrow_requests br ON rr.borrow_request_id = br.id
      WHERE rr.id = ${returnRequestId}
    `;

    if (returnDetails.length === 0) {
      console.error(
        "[Mattermost Integration] Return request not found:",
        returnRequestId,
      );
      return null;
    }

    const returnReq = returnDetails[0];

    // Get user's Mattermost username
    const mattermostUsername = await getMattermostUsername(returnReq.user_id);
    if (!mattermostUsername) {
      console.error(
        "[Mattermost Integration] Could not get Mattermost username for user:",
        returnReq.user_id,
      );
      return null;
    }

    // Get device info
    const device = await getDeviceInfo(returnReq.device_id);
    if (!device) {
      console.error(
        "[Mattermost Integration] Could not get device info:",
        returnReq.device_id,
      );
      return null;
    }

    // Send notification
    return await sendReturnConfirmationNotification({
      userId: returnReq.user_id,
      mattermostUsername,
      device,
      requestId: returnRequestId,
      returnDate: returnReq.return_date.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error(
      "[Mattermost Integration] Error triggering return notification:",
      error,
    );
    return null;
  }
}

/**
 * Triggers a RENEWAL approval notification
 * Call this when a renewal request status changes to 'approved'
 * @param renewalRequestId - The renewal request ID
 * @returns Notification result or null if notification couldn't be sent
 */
export async function triggerRenewalNotification(
  renewalRequestId: number,
): Promise<NotificationResult | null> {
  if (!isServiceReady()) {
    console.log(
      "[Mattermost Integration] Service not ready, skipping notification",
    );
    return null;
  }

  try {
    // Get renewal request details
    const renewalDetails = await db<RenewalDetails & { device_id: number }>`
      SELECT rn.id, rn.user_id, rn.borrow_request_id, rn.current_end_date, rn.requested_end_date, br.device_id
      FROM renewal_requests rn
      JOIN borrow_requests br ON rn.borrow_request_id = br.id
      WHERE rn.id = ${renewalRequestId}
    `;

    if (renewalDetails.length === 0) {
      console.error(
        "[Mattermost Integration] Renewal request not found:",
        renewalRequestId,
      );
      return null;
    }

    const renewal = renewalDetails[0];

    // Get user's Mattermost username
    const mattermostUsername = await getMattermostUsername(renewal.user_id);
    if (!mattermostUsername) {
      console.error(
        "[Mattermost Integration] Could not get Mattermost username for user:",
        renewal.user_id,
      );
      return null;
    }

    // Get device info
    const device = await getDeviceInfo(renewal.device_id);
    if (!device) {
      console.error(
        "[Mattermost Integration] Could not get device info:",
        renewal.device_id,
      );
      return null;
    }

    // Send notification
    return await sendRenewalApprovalNotification({
      userId: renewal.user_id,
      mattermostUsername,
      device,
      requestId: renewalRequestId,
      previousEndDate: renewal.current_end_date.toISOString().split("T")[0],
      newEndDate: renewal.requested_end_date.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error(
      "[Mattermost Integration] Error triggering renewal notification:",
      error,
    );
    return null;
  }
}

// ============================================================================
// Batch Notification (for testing/admin)
// ============================================================================

/**
 * Sends a test notification to verify the system is working
 * @param userId - The user ID to notify
 * @param mattermostUsername - The Mattermost username
 * @returns Notification result
 */
export async function sendTestNotification(
  userId: number,
  mattermostUsername: string,
): Promise<NotificationResult | null> {
  if (!isServiceReady()) {
    console.log("[Mattermost Integration] Service not ready");
    return null;
  }

  // Create a test device
  const testDevice: DeviceInfo = {
    id: 0,
    name: "Test Device",
    assetTag: "TEST-001",
    category: "laptop",
    brand: "Test Brand",
    model: "Test Model",
  };

  return await sendBorrowApprovalNotification({
    userId,
    mattermostUsername,
    device: testDevice,
    requestId: Date.now(), // Use timestamp as unique ID for test
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });
}
