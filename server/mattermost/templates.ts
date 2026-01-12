/**
 * Mattermost Notification System - Message Templates
 * Centralized message templates for all notification types
 */

import { NotificationAction, DeviceInfo } from "./types";
import { ACTION_DISPLAY_NAMES, MATTERMOST_CONFIG } from "./constants";

// ============================================================================
// Channel Mention Messages (Short)
// ============================================================================

/**
 * Channel mention message templates
 * These are short messages posted in the notification channel with @username mention
 */
const CHANNEL_MESSAGES: Record<NotificationAction, string> = {
  [NotificationAction.BORROW]:
    "Your device borrowing request has been approved",
  [NotificationAction.RETURN]: "Your device return has been confirmed",
  [NotificationAction.RENEWAL]:
    "Your device borrowing renewal has been approved",
};

/**
 * Generates a channel mention message
 * @param action - The notification action type
 * @param username - The Mattermost username to mention (without @)
 * @returns Formatted channel message with mention
 */
export function getChannelMessage(
  action: NotificationAction,
  username: string,
): string {
  const message = CHANNEL_MESSAGES[action];
  // Use @username format for mention - only this user will receive notification
  return `@${username} ${message}`;
}

// ============================================================================
// Direct Message Templates (Detailed)
// ============================================================================

/**
 * Formats a date string for display
 * @param dateStr - ISO date string or Date object
 * @returns Formatted date string (e.g., "January 10, 2026")
 */
function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generates the device details section for DM
 * @param device - Device information
 * @returns Formatted device details markdown
 */
function getDeviceDetails(device: DeviceInfo): string {
  return `
**Device Information:**
| Field | Value |
|:------|:------|
| Name | ${device.name} |
| Asset Tag | ${device.assetTag} |
| Category | ${device.category} |
| Brand | ${device.brand} |
| Model | ${device.model} |
`.trim();
}

/**
 * Generates the action link section
 * @param detailsUrl - URL to view details on the website
 * @returns Formatted link markdown
 */
function getActionLink(detailsUrl: string): string {
  return `\n\n:link: [View Details on Device Hub](${detailsUrl})`;
}

/**
 * Generates a BORROW approval direct message
 */
function getBorrowDM(params: {
  device: DeviceInfo;
  startDate: string;
  endDate: string;
  detailsUrl: string;
}): string {
  const { device, startDate, endDate, detailsUrl } = params;

  return `
## :white_check_mark: Device Borrowing Approved

Your request to borrow a device has been **approved**!

${getDeviceDetails(device)}

**Borrowing Period:**
| | |
|:------|:------|
| Start Date | ${formatDate(startDate)} |
| End Date | ${formatDate(endDate)} |

**Status:** :green_circle: Active

> Please pick up the device from the IT department and ensure to return it by the end date.
${getActionLink(detailsUrl)}
`.trim();
}

/**
 * Generates a RETURN confirmation direct message
 */
function getReturnDM(params: {
  device: DeviceInfo;
  returnDate: string;
  detailsUrl: string;
}): string {
  const { device, returnDate, detailsUrl } = params;

  return `
## :package: Device Return Confirmed

Your device return has been **confirmed** and processed.

${getDeviceDetails(device)}

**Return Details:**
| | |
|:------|:------|
| Return Date | ${formatDate(returnDate)} |

**Status:** :white_check_mark: Returned

> Thank you for returning the device. Your borrowing record has been updated.
${getActionLink(detailsUrl)}
`.trim();
}

/**
 * Generates a RENEWAL approval direct message
 */
function getRenewalDM(params: {
  device: DeviceInfo;
  previousEndDate: string;
  newEndDate: string;
  detailsUrl: string;
}): string {
  const { device, previousEndDate, newEndDate, detailsUrl } = params;

  return `
## :calendar: Borrowing Renewal Approved

Your request to renew the borrowing period has been **approved**!

${getDeviceDetails(device)}

**Renewal Details:**
| | |
|:------|:------|
| Previous End Date | ${formatDate(previousEndDate)} |
| New End Date | ${formatDate(newEndDate)} |

**Status:** :green_circle: Renewed

> Your borrowing period has been renewed. Please ensure to return the device by the new end date.
${getActionLink(detailsUrl)}
`.trim();
}

// ============================================================================
// Main Template Function
// ============================================================================

/**
 * Parameters for generating direct messages
 */
export interface DMTemplateParams {
  action: NotificationAction;
  device: DeviceInfo;
  detailsUrl: string;
  startDate?: string;
  endDate?: string;
  returnDate?: string;
  previousEndDate?: string;
  newEndDate?: string;
}

/**
 * Generates a detailed direct message based on action type
 * @param params - Template parameters
 * @returns Formatted direct message content
 * @throws Error if required parameters are missing for the action type
 */
export function getDirectMessage(params: DMTemplateParams): string {
  const { action, device, detailsUrl } = params;

  switch (action) {
    case NotificationAction.BORROW:
      if (!params.startDate || !params.endDate) {
        throw new Error("BORROW action requires startDate and endDate");
      }
      return getBorrowDM({
        device,
        startDate: params.startDate,
        endDate: params.endDate,
        detailsUrl,
      });

    case NotificationAction.RETURN:
      if (!params.returnDate) {
        throw new Error("RETURN action requires returnDate");
      }
      return getReturnDM({
        device,
        returnDate: params.returnDate,
        detailsUrl,
      });

    case NotificationAction.RENEWAL:
      if (!params.previousEndDate || !params.newEndDate) {
        throw new Error(
          "RENEWAL action requires previousEndDate and newEndDate",
        );
      }
      return getRenewalDM({
        device,
        previousEndDate: params.previousEndDate,
        newEndDate: params.newEndDate,
        detailsUrl,
      });

    default:
      throw new Error(`Unknown action type: ${action}`);
  }
}

// ============================================================================
// Welcome Message
// ============================================================================

/**
 * Generates a welcome message when user first interacts with the bot via DM
 * @returns Welcome message content
 */
export function getWelcomeMessage(): string {
  return `
## :wave: Welcome to Device Hub Notifications!

Hi there! I'm the Device Hub notification bot.

Now that we're connected, I'll send you **direct messages** for all your device borrowing notifications:

- :white_check_mark: **Borrow Approvals** - When your device requests are approved
- :package: **Return Confirmations** - When your device returns are processed
- :calendar: **Renewal Approvals** - When your borrowing renewals are approved

You'll receive detailed information about each action right here in our DM conversation.

> If you have any pending notifications, they'll be sent shortly!
`.trim();
}

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Error message templates
 */
export const ERROR_MESSAGES = {
  /** Configuration error */
  configMissing: (fields: string[]) =>
    `Mattermost configuration incomplete. Missing: ${fields.join(", ")}`,

  /** User not found */
  userNotFound: (username: string) => `Mattermost user not found: @${username}`,

  /** Channel operation failed */
  channelOperationFailed: (operation: string, error: string) =>
    `Failed to ${operation}: ${error}`,

  /** Notification already sent (idempotency) */
  duplicateNotification: (key: string) =>
    `Notification already sent (idempotency key: ${key})`,

  /** WebSocket connection error */
  wsConnectionError: (error: string) => `WebSocket connection error: ${error}`,
} as const;
