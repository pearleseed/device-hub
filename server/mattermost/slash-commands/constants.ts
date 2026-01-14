/**
 * Mattermost Slash Commands - Constants
 * Configuration and constants for slash commands
 */

import { CommandAction, TimePreset, RenewalPreset } from "./types";
import { MATTERMOST_CONFIG } from "../constants";

// ============================================================================
// Command Configuration
// ============================================================================

/**
 * Main slash command trigger
 */
export const COMMAND_TRIGGER = "/device";

/**
 * Valid sub-commands
 */
export const VALID_ACTIONS: CommandAction[] = [
  CommandAction.BORROW,
  CommandAction.RETURN,
  CommandAction.RENEWAL,
  CommandAction.HELP,
  CommandAction.STATUS,
];

/**
 * Action display names
 */
export const ACTION_LABELS: Record<CommandAction, string> = {
  [CommandAction.BORROW]: "Borrow Device",
  [CommandAction.RETURN]: "Return Device",
  [CommandAction.RENEWAL]: "Renew Borrowing",
  [CommandAction.HELP]: "Help",
  [CommandAction.STATUS]: "My Status",
};

// ============================================================================
// Session Configuration
// ============================================================================

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  /** Session timeout in milliseconds (15 minutes) */
  timeoutMs: 15 * 60 * 1000,

  /** Cleanup interval in milliseconds (5 minutes) */
  cleanupIntervalMs: 5 * 60 * 1000,

  /** Maximum concurrent sessions per user */
  maxSessionsPerUser: 1,
} as const;

// ============================================================================
// Pagination Configuration
// ============================================================================

/**
 * Pagination settings for device lists
 */
export const PAGINATION = {
  /** Maximum items per page */
  pageSize: 5,

  /** Maximum pages to show */
  maxPages: 10,
} as const;

// ============================================================================
// Time Presets
// ============================================================================

/**
 * Time presets for borrow duration
 */
export const TIME_PRESETS: TimePreset[] = [
  { label: "1 Day", days: 1, value: "1d" },
  { label: "3 Days", days: 3, value: "3d" },
  { label: "7 Days", days: 7, value: "7d" },
  { label: "14 Days", days: 14, value: "14d" },
  { label: "30 Days", days: 30, value: "30d" },
];

/**
 * Renewal presets for renewal duration
 */
export const RENEWAL_PRESETS: RenewalPreset[] = [
  { label: "+3 Days", days: 3, value: "3d" },
  { label: "+7 Days", days: 7, value: "7d" },
  { label: "+14 Days", days: 14, value: "14d" },
  { label: "+30 Days", days: 30, value: "30d" },
];

// ============================================================================
// Device Categories
// ============================================================================

/**
 * Device categories with display names and emojis
 */
export const DEVICE_CATEGORIES = [
  { value: "laptop", label: "Laptops", emoji: ":computer:" },
  { value: "mobile", label: "Mobile Phones", emoji: ":iphone:" },
  { value: "tablet", label: "Tablets", emoji: ":tablet:" },
  { value: "monitor", label: "Monitors", emoji: ":desktop_computer:" },
  { value: "accessories", label: "Accessories", emoji: ":headphones:" },
] as const;

// ============================================================================
// Device Conditions
// ============================================================================

/**
 * Device conditions for return
 */
export const DEVICE_CONDITIONS = [
  { value: "excellent", label: "Excellent", emoji: ":star:" },
  { value: "good", label: "Good", emoji: ":thumbsup:" },
  { value: "fair", label: "Fair", emoji: ":ok_hand:" },
  { value: "damaged", label: "Damaged", emoji: ":warning:" },
] as const;

// ============================================================================
// Validation
// ============================================================================

/**
 * Validation rules
 */
export const VALIDATION = {
  /** Minimum reason length */
  minReasonLength: 10,

  /** Maximum reason length */
  maxReasonLength: 500,

  /** Date format for manual input */
  dateFormat: "YYYY-MM-DD",

  /** Date range regex pattern */
  dateRangePattern: /^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/i,
} as const;

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Slash command API endpoints
 */
export const SLASH_COMMAND_ENDPOINTS = {
  /** Endpoint for slash command handler */
  command: "/api/mattermost/command",

  /** Endpoint for interactive message handler */
  interactive: "/api/mattermost/interactive",

  /** Endpoint for dialog submission */
  dialog: "/api/mattermost/dialog",
} as const;

/**
 * Gets the full URL for an endpoint
 */
export function getEndpointUrl(endpoint: string): string {
  const baseUrl = MATTERMOST_CONFIG.appBaseUrl || "https://localhost:3001";
  return `${baseUrl}${endpoint}`;
}

// ============================================================================
// Colors
// ============================================================================

/**
 * Attachment colors for different states
 */
export const COLORS = {
  primary: "#0058CC",
  success: "#3DB887",
  warning: "#FFBC1F",
  danger: "#D24B4E",
  info: "#1C58D9",
  neutral: "#63676B",
} as const;

// ============================================================================
// Messages
// ============================================================================

/**
 * Common message templates
 */
export const MESSAGES = {
  sessionExpired:
    "Your session has expired. Please start again with `/device`.",
  sessionNotFound: "Session not found. Please start again with `/device`.",
  invalidAction: "Invalid action. Use `/device help` for available commands.",
  unauthorized: "You are not authorized to perform this action.",
  error: "An error occurred. Please try again later.",
  cancelled: "Action cancelled.",
} as const;
