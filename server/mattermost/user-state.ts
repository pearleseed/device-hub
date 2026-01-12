/**
 * Mattermost Notification System - User State Management
 * Manages user notification state and idempotency records
 * Uses in-memory storage (can be replaced with database for persistence)
 */

import {
  UserNotificationState,
  IdempotencyRecord,
  NotificationAction,
} from "./types";
import { IDEMPOTENCY_CONFIG, generateIdempotencyKey } from "./constants";

// ============================================================================
// In-Memory Storage
// Note: In production, replace with database storage for persistence
// ============================================================================

/**
 * User notification states indexed by app user ID
 */
const userStates = new Map<number, UserNotificationState>();

/**
 * Idempotency records indexed by idempotency key
 */
const idempotencyRecords = new Map<string, IdempotencyRecord>();

// ============================================================================
// User State Operations
// ============================================================================

/**
 * Gets the notification state for a user
 * @param userId - The application user ID
 * @returns User notification state or null if not found
 */
export function getUserState(userId: number): UserNotificationState | null {
  return userStates.get(userId) || null;
}

/**
 * Gets the notification state for a user by Mattermost user ID
 * @param mattermostUserId - The Mattermost user ID
 * @returns User notification state or null if not found
 */
export function getUserStateByMattermostId(
  mattermostUserId: string,
): UserNotificationState | null {
  for (const state of userStates.values()) {
    if (state.mattermostUserId === mattermostUserId) {
      return state;
    }
  }
  return null;
}

/**
 * Creates or updates a user's notification state
 * @param userId - The application user ID
 * @param mattermostUserId - The Mattermost user ID
 * @param mattermostUsername - The Mattermost username
 * @returns Created/updated user state
 */
export function upsertUserState(
  userId: number,
  mattermostUserId: string,
  mattermostUsername: string,
): UserNotificationState {
  const existing = userStates.get(userId);
  const now = new Date();

  const state: UserNotificationState = {
    userId,
    mattermostUserId,
    mattermostUsername,
    dmReady: existing?.dmReady || false,
    dmChannelId: existing?.dmChannelId || null,
    lastNotificationId: existing?.lastNotificationId || null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  userStates.set(userId, state);
  return state;
}

/**
 * Marks a user as DM-ready (they've interacted with the bot)
 * @param userId - The application user ID
 * @param dmChannelId - The DM channel ID
 * @returns Updated user state or null if user not found
 */
export function setUserDMReady(
  userId: number,
  dmChannelId: string,
): UserNotificationState | null {
  const state = userStates.get(userId);
  if (!state) {
    return null;
  }

  state.dmReady = true;
  state.dmChannelId = dmChannelId;
  state.updatedAt = new Date();

  userStates.set(userId, state);
  return state;
}

/**
 * Marks a user as DM-ready by Mattermost user ID
 * @param mattermostUserId - The Mattermost user ID
 * @param dmChannelId - The DM channel ID
 * @returns Updated user state or null if user not found
 */
export function setUserDMReadyByMattermostId(
  mattermostUserId: string,
  dmChannelId: string,
): UserNotificationState | null {
  for (const [userId, state] of userStates.entries()) {
    if (state.mattermostUserId === mattermostUserId) {
      return setUserDMReady(userId, dmChannelId);
    }
  }
  return null;
}

/**
 * Updates the last notification ID for a user
 * @param userId - The application user ID
 * @param notificationId - The notification/post ID
 */
export function updateLastNotification(
  userId: number,
  notificationId: string,
): void {
  const state = userStates.get(userId);
  if (state) {
    state.lastNotificationId = notificationId;
    state.updatedAt = new Date();
    userStates.set(userId, state);
  }
}

/**
 * Checks if a user is DM-ready
 * @param userId - The application user ID
 * @returns True if user is DM-ready
 */
export function isUserDMReady(userId: number): boolean {
  const state = userStates.get(userId);
  return state?.dmReady || false;
}

/**
 * Gets all users who are DM-ready
 * @returns Array of user states for DM-ready users
 */
export function getDMReadyUsers(): UserNotificationState[] {
  return Array.from(userStates.values()).filter((state) => state.dmReady);
}

// ============================================================================
// Idempotency Operations
// ============================================================================

/**
 * Checks if a notification has already been sent (idempotency check)
 * @param action - The notification action type
 * @param requestId - The request ID
 * @param userId - The user ID
 * @returns True if notification was already sent
 */
export function hasNotificationBeenSent(
  action: NotificationAction,
  requestId: number,
  userId: number,
): boolean {
  const key = generateIdempotencyKey(action, requestId, userId);
  const record = idempotencyRecords.get(key);

  if (!record) {
    return false;
  }

  // Check if record has expired
  if (record.expiresAt < new Date()) {
    idempotencyRecords.delete(key);
    return false;
  }

  return true;
}

/**
 * Records that a notification has been sent (for idempotency)
 * @param action - The notification action type
 * @param requestId - The request ID
 * @param userId - The user ID
 * @returns The idempotency key
 */
export function recordNotificationSent(
  action: NotificationAction,
  requestId: number,
  userId: number,
): string {
  const key = generateIdempotencyKey(action, requestId, userId);
  const now = new Date();

  const record: IdempotencyRecord = {
    id: key,
    action,
    requestId,
    userId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + IDEMPOTENCY_CONFIG.expirationMs),
  };

  idempotencyRecords.set(key, record);
  return key;
}

/**
 * Cleans up expired idempotency records
 * Should be called periodically
 */
export function cleanupExpiredRecords(): number {
  const now = new Date();
  let cleaned = 0;

  for (const [key, record] of idempotencyRecords.entries()) {
    if (record.expiresAt < now) {
      idempotencyRecords.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// ============================================================================
// Debug/Admin Operations
// ============================================================================

/**
 * Gets all user states (for debugging/admin)
 * @returns Array of all user states
 */
export function getAllUserStates(): UserNotificationState[] {
  return Array.from(userStates.values());
}

/**
 * Gets all idempotency records (for debugging/admin)
 * @returns Array of all idempotency records
 */
export function getAllIdempotencyRecords(): IdempotencyRecord[] {
  return Array.from(idempotencyRecords.values());
}

/**
 * Clears all user states (for testing)
 */
export function clearAllUserStates(): void {
  userStates.clear();
}

/**
 * Clears all idempotency records (for testing)
 */
export function clearAllIdempotencyRecords(): void {
  idempotencyRecords.clear();
}

// ============================================================================
// Periodic Cleanup
// ============================================================================

// Run cleanup every 10 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000;

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the periodic cleanup of expired records
 */
export function startPeriodicCleanup(): void {
  if (cleanupInterval) {
    return; // Already running
  }

  cleanupInterval = setInterval(() => {
    const cleaned = cleanupExpiredRecords();
    if (cleaned > 0) {
      console.log(
        `[Mattermost] Cleaned up ${cleaned} expired idempotency records`,
      );
    }
  }, CLEANUP_INTERVAL);

  console.log("[Mattermost] Started periodic idempotency cleanup");
}

/**
 * Stops the periodic cleanup
 */
export function stopPeriodicCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log("[Mattermost] Stopped periodic idempotency cleanup");
  }
}
