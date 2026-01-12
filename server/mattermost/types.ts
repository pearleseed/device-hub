/**
 * Mattermost Notification System - Type Definitions
 * Types for Mattermost API interactions and notification management
 */

// ============================================================================
// Action Types Enum
// ============================================================================

/**
 * Notification action types for device borrowing system
 */
export enum NotificationAction {
  BORROW = "BORROW",
  RETURN = "RETURN",
  RENEWAL = "RENEWAL",
}

// ============================================================================
// Mattermost API Types
// ============================================================================

/**
 * Mattermost user object from API
 */
export interface MattermostUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  nickname: string;
  position: string;
  roles: string;
  locale: string;
  timezone: {
    useAutomaticTimezone: boolean;
    manualTimezone: string;
    automaticTimezone: string;
  };
  create_at: number;
  update_at: number;
  delete_at: number;
}

/**
 * Mattermost channel object from API
 */
export interface MattermostChannel {
  id: string;
  team_id: string;
  type: "O" | "P" | "D" | "G"; // Open, Private, Direct, Group
  display_name: string;
  name: string;
  header: string;
  purpose: string;
  creator_id: string;
  create_at: number;
  update_at: number;
  delete_at: number;
}

/**
 * Mattermost post object from API
 */
export interface MattermostPost {
  id: string;
  create_at: number;
  update_at: number;
  delete_at: number;
  edit_at: number;
  user_id: string;
  channel_id: string;
  root_id: string;
  original_id: string;
  message: string;
  type: string;
  props: Record<string, unknown>;
  hashtags: string;
  pending_post_id: string;
  reply_count: number;
  metadata: Record<string, unknown>;
}

/**
 * Mattermost channel member object from API
 */
export interface MattermostChannelMember {
  channel_id: string;
  user_id: string;
  roles: string;
  last_viewed_at: number;
  msg_count: number;
  mention_count: number;
  notify_props: Record<string, string>;
  last_update_at: number;
}

/**
 * Mattermost WebSocket event
 */
export interface MattermostWebSocketEvent {
  event: string;
  data: {
    channel_id?: string;
    channel_type?: string;
    post?: string; // JSON string of MattermostPost
    sender_name?: string;
    user_id?: string;
    [key: string]: unknown;
  };
  broadcast: {
    omit_users: Record<string, boolean> | null;
    user_id: string;
    channel_id: string;
    team_id: string;
  };
  seq: number;
}

// ============================================================================
// Notification System Types
// ============================================================================

/**
 * Device information for notifications
 */
export interface DeviceInfo {
  id: number;
  name: string;
  assetTag: string;
  category: string;
  brand: string;
  model: string;
}

/**
 * Notification payload for sending notifications
 */
export interface NotificationPayload {
  action: NotificationAction;
  userId: number;
  mattermostUsername: string;
  device: DeviceInfo;
  startDate?: string;
  endDate?: string;
  returnDate?: string;
  previousEndDate?: string;
  newEndDate?: string;
  detailsUrl: string;
  requestId: number;
}

/**
 * User notification state stored in database
 */
export interface UserNotificationState {
  userId: number;
  mattermostUserId: string;
  mattermostUsername: string;
  dmReady: boolean;
  dmChannelId: string | null;
  lastNotificationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of a notification send operation
 */
export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  channel: "dm" | "channel";
  error?: string;
}

/**
 * Idempotency record to prevent duplicate notifications
 */
export interface IdempotencyRecord {
  id: string;
  action: NotificationAction;
  requestId: number;
  userId: number;
  createdAt: Date;
  expiresAt: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic Mattermost API error response
 */
export interface MattermostApiError {
  id: string;
  message: string;
  detailed_error: string;
  request_id: string;
  status_code: number;
}

/**
 * Create post request body
 */
export interface CreatePostRequest {
  channel_id: string;
  message: string;
  root_id?: string;
  props?: Record<string, unknown>;
}

/**
 * Add channel member request body
 */
export interface AddChannelMemberRequest {
  user_id: string;
  post_root_id?: string;
}

/**
 * Create direct channel request body (array of two user IDs)
 */
export type CreateDirectChannelRequest = [string, string];
