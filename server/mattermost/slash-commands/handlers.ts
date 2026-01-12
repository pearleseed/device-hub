/**
 * Mattermost Slash Commands - Command Handlers
 * Main entry points for slash command and interactive message handling
 */

import { db } from "../../db/connection";
import {
  SlashCommandRequest,
  SlashCommandResponse,
  InteractiveMessageRequest,
  ParsedCommand,
  CommandAction,
  BorrowWizardSession,
  RenewalWizardSession,
  ReturnWizardSession,
  BorrowedDeviceOption,
} from "./types";
import {
  createBorrowSession,
  createRenewalSession,
  createReturnSession,
  getSession,
  getUserSession,
  getOrCreateUserMapping,
  getUserMapping,
} from "./session-store";
import {
  handleBorrowWizard,
  handleReturnWizard,
  handleRenewalWizard,
  handleTextInput,
  getInitialBorrowResponse,
  getInitialReturnResponse,
  getInitialRenewalResponse,
} from "./wizard";
import {
  buildHelpMessage,
  buildStatusMessage,
  buildErrorMessage,
  ephemeralResponse,
} from "./interactive-messages";
import { VALID_ACTIONS, MESSAGES } from "./constants";

// ============================================================================
// Command Parsing
// ============================================================================

/**
 * Parses the slash command text into action and arguments
 */
function parseCommand(text: string): ParsedCommand | null {
  const parts = text.trim().toLowerCase().split(/\s+/);

  if (parts.length === 0 || parts[0] === "") {
    return { action: CommandAction.HELP, args: [] };
  }

  const actionStr = parts[0];
  const args = parts.slice(1);

  // Map action string to enum
  const actionMap: Record<string, CommandAction> = {
    borrow: CommandAction.BORROW,
    return: CommandAction.RETURN,
    renewal: CommandAction.RENEWAL,
    renew: CommandAction.RENEWAL,
    help: CommandAction.HELP,
    status: CommandAction.STATUS,
    "?": CommandAction.HELP,
  };

  const action = actionMap[actionStr];
  if (!action) {
    return null;
  }

  // Parse device ID if provided
  let deviceId: number | undefined;
  if (args.length > 0) {
    const parsed = parseInt(args[0]);
    if (!isNaN(parsed)) {
      deviceId = parsed;
    }
  }

  return { action, args, deviceId };
}

// ============================================================================
// User Resolution
// ============================================================================

/**
 * Resolves Mattermost user to app user
 */
async function resolveAppUser(
  mattermostUserId: string,
  mattermostUsername: string,
): Promise<number | null> {
  // Try to find user by mattermost_username first
  let users = await db<{ id: number }>`
    SELECT id FROM users WHERE mattermost_username = ${mattermostUsername}
  `;

  if (users.length > 0) {
    return users[0].id;
  }

  // Fallback: try to find by email prefix matching username
  users = await db<{ id: number }>`
    SELECT id FROM users WHERE email LIKE ${mattermostUsername + "@%"}
  `;

  if (users.length > 0) {
    return users[0].id;
  }

  // Fallback: try exact email match
  users = await db<{ id: number }>`
    SELECT id FROM users WHERE email = ${mattermostUsername}
  `;

  return users.length > 0 ? users[0].id : null;
}

/**
 * Gets user's borrowed devices
 */
async function getUserBorrowedDevices(
  appUserId: number,
): Promise<BorrowedDeviceOption[]> {
  return db<BorrowedDeviceOption>`
    SELECT 
      br.id as "borrowRequestId",
      br.device_id as "deviceId",
      d.name as "deviceName",
      d.asset_tag as "assetTag",
      br.start_date as "startDate",
      br.end_date as "endDate",
      br.status
    FROM borrow_requests br
    JOIN devices d ON br.device_id = d.id
    WHERE br.user_id = ${appUserId} AND br.status = 'active'
    ORDER BY br.end_date ASC
  `;
}

// ============================================================================
// Slash Command Handler
// ============================================================================

/**
 * Main handler for slash commands
 */
export async function handleSlashCommand(
  request: SlashCommandRequest,
): Promise<SlashCommandResponse> {
  const { user_id, user_name, channel_id, text } = request;

  console.log(
    `[SlashCommands] Received command from @${user_name}: /device ${text}`,
  );

  // Parse the command
  const parsed = parseCommand(text);
  if (!parsed) {
    return buildErrorMessage(
      `Unknown command. Use \`/device help\` for available commands.`,
    );
  }

  // Handle help command (no user resolution needed)
  if (parsed.action === CommandAction.HELP) {
    return buildHelpMessage();
  }

  // Resolve app user
  const appUserId = await resolveAppUser(user_id, user_name);
  if (!appUserId) {
    return buildErrorMessage(
      `Your Mattermost account is not linked to Device Hub.\n\nPlease contact your administrator or sign up at the Device Hub website.`,
    );
  }

  // Create/update user mapping
  getOrCreateUserMapping(user_id, user_name, appUserId);

  // Handle status command
  if (parsed.action === CommandAction.STATUS) {
    const devices = await getUserBorrowedDevices(appUserId);
    return buildStatusMessage(devices);
  }

  // Handle action commands (BORROW, RETURN, RENEWAL)
  switch (parsed.action) {
    case CommandAction.BORROW:
      return handleBorrowCommand(user_id, channel_id, parsed.deviceId);

    case CommandAction.RETURN:
      return handleReturnCommand(
        user_id,
        channel_id,
        appUserId,
        parsed.deviceId,
      );

    case CommandAction.RENEWAL:
      return handleRenewalCommand(
        user_id,
        channel_id,
        appUserId,
        parsed.deviceId,
      );

    default:
      return buildHelpMessage();
  }
}

/**
 * Handles BORROW command
 */
async function handleBorrowCommand(
  mattermostUserId: string,
  channelId: string,
  deviceId?: number,
): Promise<SlashCommandResponse> {
  const session = createBorrowSession(mattermostUserId, channelId, deviceId);
  return getInitialBorrowResponse(session);
}

/**
 * Handles RETURN command
 */
async function handleReturnCommand(
  mattermostUserId: string,
  channelId: string,
  appUserId: number,
  deviceId?: number,
): Promise<SlashCommandResponse> {
  // If deviceId provided, find the borrow request for this device
  let borrowRequestId: number | undefined;
  if (deviceId) {
    const borrowRequests = await db<{ id: number }>`
      SELECT id FROM borrow_requests 
      WHERE device_id = ${deviceId} AND user_id = ${appUserId} AND status = 'active'
      LIMIT 1
    `;
    if (borrowRequests.length > 0) {
      borrowRequestId = borrowRequests[0].id;
    }
  }

  const session = createReturnSession(
    mattermostUserId,
    channelId,
    borrowRequestId,
  );
  return getInitialReturnResponse(session, appUserId);
}

/**
 * Handles RENEWAL command
 */
async function handleRenewalCommand(
  mattermostUserId: string,
  channelId: string,
  appUserId: number,
  deviceId?: number,
): Promise<SlashCommandResponse> {
  // If deviceId provided, find the borrow request for this device
  let borrowRequestId: number | undefined;
  if (deviceId) {
    const borrowRequests = await db<{ id: number }>`
      SELECT id FROM borrow_requests 
      WHERE device_id = ${deviceId} AND user_id = ${appUserId} AND status = 'active'
      LIMIT 1
    `;
    if (borrowRequests.length > 0) {
      borrowRequestId = borrowRequests[0].id;
    }
  }

  const session = createRenewalSession(
    mattermostUserId,
    channelId,
    borrowRequestId,
  );
  return getInitialRenewalResponse(session, appUserId);
}

// ============================================================================
// Interactive Message Handler
// ============================================================================

/**
 * Main handler for interactive message actions (button clicks)
 */
export async function handleInteractiveMessage(
  request: InteractiveMessageRequest,
): Promise<SlashCommandResponse> {
  const { user_id, context } = request;

  console.log(
    `[SlashCommands] Interactive action from user ${user_id}:`,
    context,
  );

  // Get session
  const session = getSession(context.sessionId);
  if (!session) {
    return buildErrorMessage(MESSAGES.sessionExpired);
  }

  // Verify user owns this session
  if (session.mattermostUserId !== user_id) {
    return buildErrorMessage(MESSAGES.unauthorized);
  }

  // Route to appropriate wizard handler
  switch (session.action) {
    case CommandAction.BORROW:
      return handleBorrowWizard(session as BorrowWizardSession, context);

    case CommandAction.RETURN:
      return handleReturnWizard(session as ReturnWizardSession, context);

    case CommandAction.RENEWAL:
      return handleRenewalWizard(session as RenewalWizardSession, context);

    default:
      return buildErrorMessage("Invalid session action");
  }
}

// ============================================================================
// Text Message Handler (for wizard text inputs)
// ============================================================================

/**
 * Handles text messages during active wizard sessions
 * Called when user types in channel during an active session
 */
export async function handleWizardTextInput(
  mattermostUserId: string,
  text: string,
): Promise<SlashCommandResponse | null> {
  // Check if user has an active session
  const session = getUserSession(mattermostUserId);
  if (!session) {
    return null; // No active session, ignore
  }

  // Handle text input in wizard
  return handleTextInput(session, text);
}

// ============================================================================
// Webhook Verification
// ============================================================================

/**
 * Verifies the slash command token (if configured)
 */
export function verifyCommandToken(token: string): boolean {
  const expectedToken = process.env.MATTERMOST_SLASH_COMMAND_TOKEN;
  if (!expectedToken) {
    // Token verification disabled
    return true;
  }
  return token === expectedToken;
}
