/**
 * Mattermost Notification System - Main Notification Service
 * Orchestrates the notification flow for device borrowing actions
 */

import {
  NotificationAction,
  NotificationPayload,
  NotificationResult,
  DeviceInfo,
} from "./types";
import { MATTERMOST_CONFIG, validateConfig } from "./constants";
import {
  getChannelMessage,
  getDirectMessage,
  ERROR_MESSAGES,
} from "./templates";
import {
  getUserByUsername,
  ensureChannelMembership,
  postToNotificationChannel,
  sendDirectMessage,
  MattermostClientError,
} from "./client";
import {
  getUserState,
  upsertUserState,
  isUserDMReady,
  hasNotificationBeenSent,
  recordNotificationSent,
  updateLastNotification,
  startPeriodicCleanup,
  stopPeriodicCleanup,
} from "./user-state";
import {
  connectWebSocket,
  disconnectWebSocket,
  isWebSocketConnected,
  getWebSocketStatus,
} from "./websocket";

// ============================================================================
// Service Initialization
// ============================================================================

let isInitialized = false;

/**
 * Initializes the Mattermost notification service
 * - Validates configuration
 * - Starts WebSocket connection
 * - Starts periodic cleanup
 * @returns True if initialization successful
 */
export async function initializeNotificationService(): Promise<boolean> {
  if (isInitialized) {
    console.log("[Mattermost] Service already initialized");
    return true;
  }

  console.log("[Mattermost] Initializing notification service...");

  // Validate configuration
  const configValidation = validateConfig();
  if (!configValidation.valid) {
    console.error(
      `[Mattermost] ${ERROR_MESSAGES.configMissing(configValidation.missing)}`,
    );
    return false;
  }

  try {
    // Start WebSocket connection for DM detection
    await connectWebSocket();

    // Start periodic cleanup of idempotency records
    startPeriodicCleanup();

    isInitialized = true;
    console.log("[Mattermost] Notification service initialized successfully");
    return true;
  } catch (error) {
    console.error("[Mattermost] Failed to initialize:", error);
    return false;
  }
}

/**
 * Shuts down the notification service
 */
export function shutdownNotificationService(): void {
  console.log("[Mattermost] Shutting down notification service...");

  disconnectWebSocket();
  stopPeriodicCleanup();

  isInitialized = false;
  console.log("[Mattermost] Notification service shut down");
}

/**
 * Checks if the notification service is ready
 * @returns True if service is initialized and WebSocket is connected
 */
export function isServiceReady(): boolean {
  return isInitialized && isWebSocketConnected();
}

// ============================================================================
// Main Notification Function
// ============================================================================

/**
 * Sends a notification for a device borrowing action
 *
 * Flow:
 * 1. Check idempotency - skip if already sent
 * 2. Resolve Mattermost user from username
 * 3. If user is DM-ready → send DM directly
 * 4. If not DM-ready:
 *    a. Ensure user is in notification channel
 *    b. Post channel mention to trigger notification
 *
 * @param payload - Notification payload with action details
 * @returns Notification result
 */
export async function sendNotification(
  payload: NotificationPayload,
): Promise<NotificationResult> {
  const {
    action,
    userId,
    mattermostUsername,
    device,
    requestId,
    startDate,
    endDate,
    returnDate,
    previousEndDate,
    newEndDate,
    detailsUrl,
  } = payload;

  console.log(
    `[Mattermost] Processing ${action} notification for user ${userId} (@${mattermostUsername})`,
  );

  // Step 1: Idempotency check
  if (hasNotificationBeenSent(action, requestId, userId)) {
    console.log(
      `[Mattermost] Notification already sent (idempotency): ${action}:${requestId}:${userId}`,
    );
    return {
      success: true,
      channel: "dm", // Doesn't matter, notification was already sent
      error: ERROR_MESSAGES.duplicateNotification(
        `${action}:${requestId}:${userId}`,
      ),
    };
  }

  try {
    // Step 2: Resolve Mattermost user
    const mmUser = await getUserByUsername(mattermostUsername);
    if (!mmUser) {
      console.error(`[Mattermost] User not found: @${mattermostUsername}`);
      return {
        success: false,
        channel: "channel",
        error: ERROR_MESSAGES.userNotFound(mattermostUsername),
      };
    }

    // Ensure user state exists
    upsertUserState(userId, mmUser.id, mattermostUsername);

    // Step 3: Check if user is DM-ready
    if (isUserDMReady(userId)) {
      // Send DM directly
      return await sendDirectNotification(
        userId,
        mmUser.id,
        action,
        requestId,
        {
          device,
          detailsUrl,
          startDate,
          endDate,
          returnDate,
          previousEndDate,
          newEndDate,
        },
      );
    }

    // Step 4: User not DM-ready - use channel mention flow
    return await sendChannelNotification(
      userId,
      mmUser.id,
      mattermostUsername,
      action,
      requestId,
    );
  } catch (error) {
    console.error(`[Mattermost] Error sending notification:`, error);

    const errorMessage =
      error instanceof MattermostClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";

    return {
      success: false,
      channel: "channel",
      error: errorMessage,
    };
  }
}

// ============================================================================
// Internal Notification Functions
// ============================================================================

/**
 * Sends a direct message notification
 */
async function sendDirectNotification(
  userId: number,
  mattermostUserId: string,
  action: NotificationAction,
  requestId: number,
  params: {
    device: DeviceInfo;
    detailsUrl: string;
    startDate?: string;
    endDate?: string;
    returnDate?: string;
    previousEndDate?: string;
    newEndDate?: string;
  },
): Promise<NotificationResult> {
  console.log(`[Mattermost] Sending DM to user ${userId}`);

  try {
    // Generate detailed DM content
    const message = getDirectMessage({
      action,
      device: params.device,
      detailsUrl: params.detailsUrl,
      startDate: params.startDate,
      endDate: params.endDate,
      returnDate: params.returnDate,
      previousEndDate: params.previousEndDate,
      newEndDate: params.newEndDate,
    });

    // Send the DM
    const post = await sendDirectMessage(mattermostUserId, message);

    // Record for idempotency
    recordNotificationSent(action, requestId, userId);
    updateLastNotification(userId, post.id);

    console.log(`[Mattermost] DM sent successfully: ${post.id}`);

    return {
      success: true,
      notificationId: post.id,
      channel: "dm",
    };
  } catch (error) {
    console.error(`[Mattermost] Failed to send DM:`, error);
    throw error;
  }
}

/**
 * Sends a channel mention notification
 */
async function sendChannelNotification(
  userId: number,
  mattermostUserId: string,
  mattermostUsername: string,
  action: NotificationAction,
  requestId: number,
): Promise<NotificationResult> {
  console.log(
    `[Mattermost] Sending channel mention for user ${userId} (@${mattermostUsername})`,
  );

  try {
    // Step 4a: Ensure user is in the notification channel
    // IMPORTANT: Do NOT rely on mentions to auto-add users
    const wasAdded = await ensureChannelMembership(mattermostUserId);
    if (wasAdded) {
      console.log(
        `[Mattermost] Added user @${mattermostUsername} to notification channel`,
      );
    }

    // Step 4b: Post channel message with @mention
    const message = getChannelMessage(action, mattermostUsername);
    const post = await postToNotificationChannel(message);

    // Record for idempotency
    recordNotificationSent(action, requestId, userId);
    updateLastNotification(userId, post.id);

    console.log(`[Mattermost] Channel mention posted: ${post.id}`);

    return {
      success: true,
      notificationId: post.id,
      channel: "channel",
    };
  } catch (error) {
    console.error(`[Mattermost] Failed to send channel notification:`, error);
    throw error;
  }
}

// ============================================================================
// Convenience Functions for Each Action Type
// ============================================================================

/**
 * Sends a BORROW approval notification
 */
export async function sendBorrowApprovalNotification(params: {
  userId: number;
  mattermostUsername: string;
  device: DeviceInfo;
  requestId: number;
  startDate: string;
  endDate: string;
}): Promise<NotificationResult> {
  const { appBaseUrl } = MATTERMOST_CONFIG;

  return sendNotification({
    action: NotificationAction.BORROW,
    userId: params.userId,
    mattermostUsername: params.mattermostUsername,
    device: params.device,
    requestId: params.requestId,
    startDate: params.startDate,
    endDate: params.endDate,
    detailsUrl: `${appBaseUrl}/borrow/${params.requestId}`,
  });
}

/**
 * Sends a RETURN confirmation notification
 */
export async function sendReturnConfirmationNotification(params: {
  userId: number;
  mattermostUsername: string;
  device: DeviceInfo;
  requestId: number;
  returnDate: string;
}): Promise<NotificationResult> {
  const { appBaseUrl } = MATTERMOST_CONFIG;

  return sendNotification({
    action: NotificationAction.RETURN,
    userId: params.userId,
    mattermostUsername: params.mattermostUsername,
    device: params.device,
    requestId: params.requestId,
    returnDate: params.returnDate,
    detailsUrl: `${appBaseUrl}/returns/${params.requestId}`,
  });
}

/**
 * Sends a RENEWAL approval notification
 */
export async function sendRenewalApprovalNotification(params: {
  userId: number;
  mattermostUsername: string;
  device: DeviceInfo;
  requestId: number;
  previousEndDate: string;
  newEndDate: string;
}): Promise<NotificationResult> {
  const { appBaseUrl } = MATTERMOST_CONFIG;

  return sendNotification({
    action: NotificationAction.RENEWAL,
    userId: params.userId,
    mattermostUsername: params.mattermostUsername,
    device: params.device,
    requestId: params.requestId,
    previousEndDate: params.previousEndDate,
    newEndDate: params.newEndDate,
    detailsUrl: `${appBaseUrl}/renewals/${params.requestId}`,
  });
}

// ============================================================================
// Status & Debug
// ============================================================================

/**
 * Gets the current service status
 */
export function getServiceStatus(): {
  initialized: boolean;
  websocket: ReturnType<typeof getWebSocketStatus>;
  config: {
    serverUrl: string;
    channelConfigured: boolean;
  };
} {
  return {
    initialized: isInitialized,
    websocket: getWebSocketStatus(),
    config: {
      serverUrl: MATTERMOST_CONFIG.serverUrl || "(not configured)",
      channelConfigured: !!MATTERMOST_CONFIG.notificationChannelId,
    },
  };
}
