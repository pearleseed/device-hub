/**
 * Mattermost Notification System - Main Export
 * Re-exports all public APIs for the notification system
 */

// Types
export {
  NotificationAction,
  NotificationPayload,
  NotificationResult,
  DeviceInfo,
  UserNotificationState,
} from "./types";

// Constants
export {
  MATTERMOST_CONFIG,
  ACTION_DISPLAY_NAMES,
  validateConfig,
  generateIdempotencyKey,
} from "./constants";

// Templates
export {
  getChannelMessage,
  getDirectMessage,
  getWelcomeMessage,
  ERROR_MESSAGES,
} from "./templates";

// Client
export {
  getUserByUsername,
  getUserById,
  getBotUser,
  isChannelMember,
  addUserToChannel,
  createDirectChannel,
  createPost,
  postToNotificationChannel,
  sendDirectMessage,
  ensureChannelMembership,
  getDMChannelId,
  MattermostClientError,
} from "./client";

// User State
export {
  getUserState,
  getUserStateByMattermostId,
  upsertUserState,
  setUserDMReady,
  setUserDMReadyByMattermostId,
  updateLastNotification,
  isUserDMReady,
  getDMReadyUsers,
  hasNotificationBeenSent,
  recordNotificationSent,
  cleanupExpiredRecords,
  getAllUserStates,
  getAllIdempotencyRecords,
} from "./user-state";

// WebSocket
export {
  connectWebSocket,
  disconnectWebSocket,
  isWebSocketConnected,
  getWebSocketStatus,
} from "./websocket";

// Notification Service (Main API)
export {
  initializeNotificationService,
  shutdownNotificationService,
  isServiceReady,
  sendNotification,
  sendBorrowApprovalNotification,
  sendReturnConfirmationNotification,
  sendRenewalApprovalNotification,
  getServiceStatus,
} from "./notification-service";

// Route Integration Helpers
export {
  triggerBorrowNotification,
  triggerReturnNotification,
  triggerRenewalNotification,
  sendTestNotification,
} from "./integration";

// Slash Commands (re-export main APIs)
export {
  // Types
  CommandAction,
  SlashCommandRequest,
  SlashCommandResponse,
  InteractiveMessageRequest,
  // Handlers
  handleSlashCommand,
  handleInteractiveMessage,
  handleWizardTextInput,
  // Session management
  startSessionCleanup,
  stopSessionCleanup,
  getSessionStats,
} from "./slash-commands";
