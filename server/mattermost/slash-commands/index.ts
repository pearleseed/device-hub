/**
 * Mattermost Slash Commands - Main Export
 * Re-exports all public APIs for slash commands
 */

// Types
export {
  CommandAction,
  BorrowWizardStep,
  RenewalWizardStep,
  ReturnWizardStep,
  WizardSession,
  BorrowWizardSession,
  RenewalWizardSession,
  ReturnWizardSession,
  SlashCommandRequest,
  SlashCommandResponse,
  InteractiveMessageRequest,
  InteractiveContext,
  DeviceOption,
  BorrowedDeviceOption,
  UserMapping,
} from "./types";

// Constants
export {
  COMMAND_TRIGGER,
  VALID_ACTIONS,
  ACTION_LABELS,
  SESSION_CONFIG,
  PAGINATION,
  TIME_PRESETS,
  RENEWAL_PRESETS,
  DEVICE_CATEGORIES,
  DEVICE_CONDITIONS,
  VALIDATION,
  SLASH_COMMAND_ENDPOINTS,
  getEndpointUrl,
  COLORS,
  MESSAGES,
} from "./constants";

// Session Store
export {
  createBorrowSession,
  createRenewalSession,
  createReturnSession,
  getSession,
  getUserSession,
  updateSession,
  deleteSession,
  cancelUserSession,
  getOrCreateUserMapping,
  getUserMapping,
  setUserMappingDMReady,
  isUserMappingDMReady,
  cleanupExpiredSessions,
  getAllSessions,
  getAllUserMappings,
  getSessionStats,
  startSessionCleanup,
  stopSessionCleanup,
} from "./session-store";

// Interactive Messages
export {
  ephemeralResponse,
  buildHelpMessage,
  buildStatusMessage,
  buildCategorySelection,
  buildDeviceSelection,
  buildTimeSelection,
  buildReasonPrompt,
  buildBorrowConfirmation,
  buildReturnDeviceSelection,
  buildConditionSelection,
  buildReturnConfirmation,
  buildRenewalDeviceSelection,
  buildRenewalDurationSelection,
  buildRenewalConfirmation,
  buildSuccessMessage,
  buildErrorMessage,
  buildCancelledMessage,
} from "./interactive-messages";

// Handlers
export {
  handleSlashCommand,
  handleInteractiveMessage,
  handleWizardTextInput,
  verifyCommandToken,
} from "./handlers";

// Wizard
export {
  handleBorrowWizard,
  handleReturnWizard,
  handleRenewalWizard,
  handleTextInput,
  getInitialBorrowResponse,
  getInitialReturnResponse,
  getInitialRenewalResponse,
} from "./wizard";
