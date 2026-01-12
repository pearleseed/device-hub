/**
 * Mattermost Notification System - Constants
 * Centralized configuration and constants
 */

import { NotificationAction } from "./types";

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Mattermost configuration from environment variables
 */
export const MATTERMOST_CONFIG = {
  /** Mattermost server URL (e.g., https://mattermost.example.com) */
  serverUrl: process.env.MATTERMOST_SERVER_URL || "",

  /** Bot access token for API authentication */
  botToken: process.env.MATTERMOST_BOT_TOKEN || "",

  /** Bot user ID (retrieved from API or configured) */
  botUserId: process.env.MATTERMOST_BOT_USER_ID || "",

  /** Notification channel ID where mentions are posted */
  notificationChannelId: process.env.MATTERMOST_NOTIFICATION_CHANNEL_ID || "",

  /** Base URL for the device hub application */
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:8080",

  /** WebSocket reconnection settings */
  wsReconnectInterval: parseInt(
    process.env.MATTERMOST_WS_RECONNECT_INTERVAL || "5000",
  ),
  wsMaxReconnectAttempts: parseInt(
    process.env.MATTERMOST_WS_MAX_RECONNECT_ATTEMPTS || "10",
  ),
} as const;

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Mattermost REST API endpoints
 */
export const API_ENDPOINTS = {
  /** Create a new post */
  posts: "/api/v4/posts",

  /** Get channel member: /api/v4/channels/{channel_id}/members/{user_id} */
  channelMember: (channelId: string, userId: string) =>
    `/api/v4/channels/${channelId}/members/${userId}`,

  /** Add member to channel: /api/v4/channels/{channel_id}/members */
  channelMembers: (channelId: string) =>
    `/api/v4/channels/${channelId}/members`,

  /** Create direct message channel */
  directChannel: "/api/v4/channels/direct",

  /** Get user by username */
  userByUsername: (username: string) => `/api/v4/users/username/${username}`,

  /** Get user by ID */
  userById: (userId: string) => `/api/v4/users/${userId}`,

  /** Get current user (bot) */
  me: "/api/v4/users/me",

  /** WebSocket endpoint */
  websocket: "/api/v4/websocket",
} as const;

// ============================================================================
// WebSocket Events
// ============================================================================

/**
 * Mattermost WebSocket event types
 */
export const WS_EVENTS = {
  /** New post created */
  POSTED: "posted",

  /** Direct message posted */
  DIRECT_ADDED: "direct_added",

  /** User typing */
  TYPING: "typing",

  /** Channel viewed */
  CHANNEL_VIEWED: "channel_viewed",

  /** Hello event (connection established) */
  HELLO: "hello",

  /** Authentication challenge */
  AUTHENTICATION_CHALLENGE: "authentication_challenge",
} as const;

// ============================================================================
// Action Display Names
// ============================================================================

/**
 * Human-readable names for notification actions
 */
export const ACTION_DISPLAY_NAMES: Record<NotificationAction, string> = {
  [NotificationAction.BORROW]: "Device Borrowing",
  [NotificationAction.RETURN]: "Device Return",
  [NotificationAction.RENEWAL]: "Borrowing Renewal",
} as const;

// ============================================================================
// Idempotency Settings
// ============================================================================

/**
 * Idempotency configuration
 */
export const IDEMPOTENCY_CONFIG = {
  /** Time in milliseconds before an idempotency key expires (1 hour) */
  expirationMs: 60 * 60 * 1000,

  /** Prefix for idempotency keys */
  keyPrefix: "notification",
} as const;

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates that all required Mattermost configuration is present
 * @returns Object with validation result and missing fields
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
  const required = [
    { key: "serverUrl", name: "MATTERMOST_SERVER_URL" },
    { key: "botToken", name: "MATTERMOST_BOT_TOKEN" },
    {
      key: "notificationChannelId",
      name: "MATTERMOST_NOTIFICATION_CHANNEL_ID",
    },
  ] as const;

  const missing: string[] = [];

  for (const { key, name } of required) {
    if (!MATTERMOST_CONFIG[key]) {
      missing.push(name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Generates an idempotency key for a notification
 * @param action - The notification action type
 * @param requestId - The request ID (borrow, return, or renewal)
 * @param userId - The user ID
 * @returns Unique idempotency key
 */
export function generateIdempotencyKey(
  action: NotificationAction,
  requestId: number,
  userId: number,
): string {
  return `${IDEMPOTENCY_CONFIG.keyPrefix}:${action}:${requestId}:${userId}`;
}
