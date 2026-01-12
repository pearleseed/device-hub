/**
 * Mattermost Notification System - REST API Client
 * Handles all HTTP interactions with Mattermost REST API
 */

import {
  MattermostUser,
  MattermostChannel,
  MattermostPost,
  MattermostChannelMember,
  MattermostApiError,
  CreatePostRequest,
  AddChannelMemberRequest,
  CreateDirectChannelRequest,
} from "./types";
import { MATTERMOST_CONFIG, API_ENDPOINTS, validateConfig } from "./constants";
import { ERROR_MESSAGES } from "./templates";

// ============================================================================
// HTTP Client
// ============================================================================

/**
 * Makes an authenticated request to the Mattermost API
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @returns Response data or throws error
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { serverUrl, botToken } = MATTERMOST_CONFIG;

  // Validate configuration
  const configValidation = validateConfig();
  if (!configValidation.valid) {
    throw new Error(ERROR_MESSAGES.configMissing(configValidation.missing));
  }

  const url = `${serverUrl}${endpoint}`;
  const headers: HeadersInit = {
    Authorization: `Bearer ${botToken}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle non-OK responses
  if (!response.ok) {
    let errorData: MattermostApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        id: "unknown",
        message: `HTTP ${response.status}: ${response.statusText}`,
        detailed_error: "",
        request_id: "",
        status_code: response.status,
      };
    }
    throw new MattermostClientError(errorData);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// Custom Error Class
// ============================================================================

/**
 * Custom error class for Mattermost API errors
 */
export class MattermostClientError extends Error {
  public readonly statusCode: number;
  public readonly errorId: string;
  public readonly detailedError: string;
  public readonly requestId: string;

  constructor(apiError: MattermostApiError) {
    super(apiError.message);
    this.name = "MattermostClientError";
    this.statusCode = apiError.status_code;
    this.errorId = apiError.id;
    this.detailedError = apiError.detailed_error;
    this.requestId = apiError.request_id;
  }

  /**
   * Check if error is a "not found" error
   */
  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Check if error is an authorization error
   */
  isUnauthorized(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }
}

// ============================================================================
// User Operations
// ============================================================================

/**
 * Gets a Mattermost user by username
 * @param username - The username (without @)
 * @returns User object or null if not found
 */
export async function getUserByUsername(
  username: string,
): Promise<MattermostUser | null> {
  try {
    return await apiRequest<MattermostUser>(
      API_ENDPOINTS.userByUsername(username),
    );
  } catch (error) {
    if (error instanceof MattermostClientError && error.isNotFound()) {
      return null;
    }
    throw error;
  }
}

/**
 * Gets a Mattermost user by ID
 * @param userId - The user ID
 * @returns User object or null if not found
 */
export async function getUserById(
  userId: string,
): Promise<MattermostUser | null> {
  try {
    return await apiRequest<MattermostUser>(API_ENDPOINTS.userById(userId));
  } catch (error) {
    if (error instanceof MattermostClientError && error.isNotFound()) {
      return null;
    }
    throw error;
  }
}

/**
 * Gets the current bot user
 * @returns Bot user object
 */
export async function getBotUser(): Promise<MattermostUser> {
  return apiRequest<MattermostUser>(API_ENDPOINTS.me);
}

// ============================================================================
// Channel Operations
// ============================================================================

/**
 * Checks if a user is a member of a channel
 * @param channelId - The channel ID
 * @param userId - The user ID
 * @returns True if user is a member, false otherwise
 */
export async function isChannelMember(
  channelId: string,
  userId: string,
): Promise<boolean> {
  try {
    await apiRequest<MattermostChannelMember>(
      API_ENDPOINTS.channelMember(channelId, userId),
    );
    return true;
  } catch (error) {
    if (error instanceof MattermostClientError && error.isNotFound()) {
      return false;
    }
    throw error;
  }
}

/**
 * Adds a user to a channel
 * @param channelId - The channel ID
 * @param userId - The user ID to add
 * @returns Channel member object
 */
export async function addUserToChannel(
  channelId: string,
  userId: string,
): Promise<MattermostChannelMember> {
  const body: AddChannelMemberRequest = {
    user_id: userId,
  };

  return apiRequest<MattermostChannelMember>(
    API_ENDPOINTS.channelMembers(channelId),
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/**
 * Creates or gets a direct message channel between two users
 * @param userId1 - First user ID (typically the bot)
 * @param userId2 - Second user ID (the target user)
 * @returns Direct channel object
 */
export async function createDirectChannel(
  userId1: string,
  userId2: string,
): Promise<MattermostChannel> {
  const body: CreateDirectChannelRequest = [userId1, userId2];

  return apiRequest<MattermostChannel>(API_ENDPOINTS.directChannel, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ============================================================================
// Post Operations
// ============================================================================

/**
 * Creates a new post in a channel
 * @param channelId - The channel ID
 * @param message - The message content
 * @param props - Optional post properties
 * @returns Created post object
 */
export async function createPost(
  channelId: string,
  message: string,
  props?: Record<string, unknown>,
): Promise<MattermostPost> {
  const body: CreatePostRequest = {
    channel_id: channelId,
    message,
    props,
  };

  return apiRequest<MattermostPost>(API_ENDPOINTS.posts, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Posts a message to the notification channel with a user mention
 * @param message - The message content (should include @username)
 * @returns Created post object
 */
export async function postToNotificationChannel(
  message: string,
): Promise<MattermostPost> {
  const { notificationChannelId } = MATTERMOST_CONFIG;

  if (!notificationChannelId) {
    throw new Error("Notification channel ID not configured");
  }

  return createPost(notificationChannelId, message);
}

/**
 * Sends a direct message to a user
 * @param userId - The target user's Mattermost ID
 * @param message - The message content
 * @returns Created post object
 */
export async function sendDirectMessage(
  userId: string,
  message: string,
): Promise<MattermostPost> {
  // Get bot user ID
  let botUserId = MATTERMOST_CONFIG.botUserId;
  if (!botUserId) {
    const botUser = await getBotUser();
    botUserId = botUser.id;
  }

  // Create or get the DM channel
  const dmChannel = await createDirectChannel(botUserId, userId);

  // Send the message
  return createPost(dmChannel.id, message);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Ensures a user is a member of the notification channel
 * Adds them if they're not already a member
 * @param userId - The Mattermost user ID
 * @returns True if user was added, false if already a member
 */
export async function ensureChannelMembership(
  userId: string,
): Promise<boolean> {
  const { notificationChannelId } = MATTERMOST_CONFIG;

  if (!notificationChannelId) {
    throw new Error("Notification channel ID not configured");
  }

  const isMember = await isChannelMember(notificationChannelId, userId);

  if (!isMember) {
    await addUserToChannel(notificationChannelId, userId);
    return true; // User was added
  }

  return false; // User was already a member
}

/**
 * Gets the DM channel ID for a user (creates if doesn't exist)
 * @param userId - The target user's Mattermost ID
 * @returns DM channel ID
 */
export async function getDMChannelId(userId: string): Promise<string> {
  let botUserId = MATTERMOST_CONFIG.botUserId;
  if (!botUserId) {
    const botUser = await getBotUser();
    botUserId = botUser.id;
  }

  const dmChannel = await createDirectChannel(botUserId, userId);
  return dmChannel.id;
}
