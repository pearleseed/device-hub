/**
 * Mattermost Slash Commands - Type Definitions
 * Types for slash commands, wizard sessions, and interactive messages
 */

// ============================================================================
// Command Action Types
// ============================================================================

/**
 * Slash command action types
 */
export enum CommandAction {
  BORROW = "borrow",
  RETURN = "return",
  RENEWAL = "renewal",
  HELP = "help",
  STATUS = "status",
}

// ============================================================================
// Wizard Step Types
// ============================================================================

/**
 * Wizard steps for BORROW flow
 */
export enum BorrowWizardStep {
  SELECT_CATEGORY = "select_category",
  SELECT_DEVICE = "select_device",
  SELECT_TIME = "select_time",
  ENTER_REASON = "enter_reason",
  CONFIRM = "confirm",
  COMPLETE = "complete",
}

/**
 * Wizard steps for RENEWAL flow
 */
export enum RenewalWizardStep {
  SELECT_DEVICE = "select_device",
  SELECT_DURATION = "select_duration",
  ENTER_REASON = "enter_reason",
  CONFIRM = "confirm",
  COMPLETE = "complete",
}

/**
 * Wizard steps for RETURN flow
 */
export enum ReturnWizardStep {
  SELECT_DEVICE = "select_device",
  SELECT_CONDITION = "select_condition",
  ENTER_NOTES = "enter_notes",
  CONFIRM = "confirm",
  COMPLETE = "complete",
}

export type WizardStep =
  | BorrowWizardStep
  | RenewalWizardStep
  | ReturnWizardStep;

// ============================================================================
// Session Types
// ============================================================================

/**
 * Base wizard session data
 */
interface BaseWizardSession {
  id: string;
  mattermostUserId: string;
  channelId: string;
  action: CommandAction;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

/**
 * BORROW wizard session
 */
export interface BorrowWizardSession extends BaseWizardSession {
  action: CommandAction.BORROW;
  step: BorrowWizardStep;
  data: {
    category?: string;
    deviceId?: number;
    deviceName?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
    page?: number;
  };
}

/**
 * RENEWAL wizard session
 */
export interface RenewalWizardSession extends BaseWizardSession {
  action: CommandAction.RENEWAL;
  step: RenewalWizardStep;
  data: {
    borrowRequestId?: number;
    deviceId?: number;
    deviceName?: string;
    currentEndDate?: string;
    newEndDate?: string;
    reason?: string;
  };
}

/**
 * RETURN wizard session
 */
export interface ReturnWizardSession extends BaseWizardSession {
  action: CommandAction.RETURN;
  step: ReturnWizardStep;
  data: {
    borrowRequestId?: number;
    deviceId?: number;
    deviceName?: string;
    condition?: string;
    notes?: string;
  };
}

export type WizardSession =
  | BorrowWizardSession
  | RenewalWizardSession
  | ReturnWizardSession;

// ============================================================================
// Slash Command Request Types
// ============================================================================

/**
 * Mattermost slash command request payload
 * Sent when user executes a slash command
 */
export interface SlashCommandRequest {
  channel_id: string;
  channel_name: string;
  command: string;
  response_url: string;
  team_domain: string;
  team_id: string;
  text: string;
  token: string;
  trigger_id: string;
  user_id: string;
  user_name: string;
}

/**
 * Parsed slash command with action and arguments
 */
export interface ParsedCommand {
  action: CommandAction;
  args: string[];
  deviceId?: number;
}

// ============================================================================
// Interactive Message Types
// ============================================================================

/**
 * Mattermost interactive message action
 */
export interface InteractiveAction {
  id: string;
  name: string;
  type: "button" | "select";
  value?: string;
  style?: "default" | "primary" | "success" | "good" | "warning" | "danger";
  options?: Array<{
    text: string;
    value: string;
  }>;
  data_source?: "users" | "channels";
  integration?: {
    url: string;
    context: Record<string, unknown>;
  };
}

/**
 * Mattermost attachment for interactive messages
 */
export interface MessageAttachment {
  fallback?: string;
  color?: string;
  pretext?: string;
  author_name?: string;
  author_icon?: string;
  author_link?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  actions?: InteractiveAction[];
}

/**
 * Slash command response
 */
export interface SlashCommandResponse {
  response_type?: "ephemeral" | "in_channel";
  text?: string;
  attachments?: MessageAttachment[];
  props?: Record<string, unknown>;
  skip_slack_parsing?: boolean;
  goto_location?: string;
}

// ============================================================================
// Interactive Message Request Types
// ============================================================================

/**
 * Context passed with interactive message actions
 */
export interface InteractiveContext {
  sessionId: string;
  action: CommandAction;
  step: WizardStep;
  value?: string;
  page?: number;
  [key: string]: unknown;
}

/**
 * Mattermost interactive message request payload
 * Sent when user clicks a button or selects an option
 */
export interface InteractiveMessageRequest {
  user_id: string;
  user_name: string;
  channel_id: string;
  channel_name: string;
  team_id: string;
  team_domain: string;
  post_id: string;
  trigger_id: string;
  type: string;
  data_source?: string;
  context: InteractiveContext;
}

// ============================================================================
// Device Selection Types
// ============================================================================

/**
 * Device for selection in wizard
 */
export interface DeviceOption {
  id: number;
  name: string;
  assetTag: string;
  category: string;
  brand: string;
  model: string;
  status: string;
}

/**
 * Borrowed device for return/renewal selection
 */
export interface BorrowedDeviceOption {
  borrowRequestId: number;
  deviceId: number;
  deviceName: string;
  assetTag: string;
  startDate: string;
  endDate: string;
  status: string;
}

// ============================================================================
// Time Preset Types
// ============================================================================

/**
 * Time preset for quick selection
 */
export interface TimePreset {
  label: string;
  days: number;
  value: string;
}

/**
 * Renewal preset for renewal duration
 */
export interface RenewalPreset {
  label: string;
  days: number;
  value: string;
}

// ============================================================================
// User Mapping Types
// ============================================================================

/**
 * Mapping between Mattermost user and app user
 */
export interface UserMapping {
  mattermostUserId: string;
  mattermostUsername: string;
  appUserId: number;
  dmReady: boolean;
  dmChannelId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
