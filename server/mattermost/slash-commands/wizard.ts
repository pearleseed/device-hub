/**
 * Mattermost Slash Commands - Wizard Logic
 * Handles multi-step wizard flow for device actions
 */

import { db } from "../../db/connection";
import {
  WizardSession,
  BorrowWizardSession,
  RenewalWizardSession,
  ReturnWizardSession,
  CommandAction,
  BorrowWizardStep,
  RenewalWizardStep,
  ReturnWizardStep,
  SlashCommandResponse,
  InteractiveContext,
  DeviceOption,
  BorrowedDeviceOption,
} from "./types";
import {
  getSession,
  updateSession,
  deleteSession,
  getUserMapping,
} from "./session-store";
import {
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
  ephemeralResponse,
} from "./interactive-messages";
import {
  TIME_PRESETS,
  RENEWAL_PRESETS,
  PAGINATION,
  VALIDATION,
} from "./constants";

// ============================================================================
// Database Queries
// ============================================================================

/**
 * Gets available devices by category
 */
async function getAvailableDevices(
  category: string,
  page: number,
): Promise<{ devices: DeviceOption[]; total: number }> {
  const offset = page * PAGINATION.pageSize;

  const devices = await db<DeviceOption[]>`
    SELECT id, name, asset_tag as "assetTag", category, brand, model, status
    FROM devices
    WHERE category = ${category} AND status = 'available'
    ORDER BY name
    LIMIT ${PAGINATION.pageSize} OFFSET ${offset}
  `;

  const countResult = await db<{ count: number }>`
    SELECT COUNT(*) as count FROM devices
    WHERE category = ${category} AND status = 'available'
  `;

  return {
    devices,
    total: countResult[0]?.count || 0,
  };
}

/**
 * Gets a device by ID
 */
async function getDeviceById(deviceId: number): Promise<DeviceOption | null> {
  const devices = await db<DeviceOption[]>`
    SELECT id, name, asset_tag as "assetTag", category, brand, model, status
    FROM devices WHERE id = ${deviceId}
  `;
  return devices[0] || null;
}

/**
 * Gets user's borrowed devices
 */
async function getUserBorrowedDevices(
  appUserId: number,
): Promise<BorrowedDeviceOption[]> {
  return db<BorrowedDeviceOption[]>`
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

/**
 * Gets a borrow request by ID
 */
async function getBorrowRequest(
  borrowRequestId: number,
): Promise<BorrowedDeviceOption | null> {
  const requests = await db<BorrowedDeviceOption[]>`
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
    WHERE br.id = ${borrowRequestId}
  `;
  return requests[0] || null;
}

/**
 * Creates a borrow request
 */
async function createBorrowRequest(
  appUserId: number,
  deviceId: number,
  startDate: string,
  endDate: string,
  reason: string,
): Promise<number> {
  await db`
    INSERT INTO borrow_requests (device_id, user_id, start_date, end_date, reason, status)
    VALUES (${deviceId}, ${appUserId}, ${startDate}, ${endDate}, ${reason}, 'pending')
  `;

  const result = await db<{ id: number }>`
    SELECT LAST_INSERT_ID() as id
  `;
  return result[0].id;
}

/**
 * Creates a return request
 */
async function createReturnRequest(
  borrowRequestId: number,
  condition: string,
  notes: string | null,
): Promise<number> {
  await db.begin(async (tx) => {
    await tx`
      INSERT INTO return_requests (borrow_request_id, return_date, device_condition, notes)
      VALUES (${borrowRequestId}, CURDATE(), ${condition}, ${notes})
    `;

    await tx`
      UPDATE borrow_requests SET status = 'returned', updated_at = NOW()
      WHERE id = ${borrowRequestId}
    `;

    // Get device ID and update status
    const borrowReq = await tx<{ device_id: number }>`
      SELECT device_id FROM borrow_requests WHERE id = ${borrowRequestId}
    `;

    const newStatus = condition === "damaged" ? "maintenance" : "available";
    await tx`
      UPDATE devices SET status = ${newStatus} WHERE id = ${borrowReq[0].device_id}
    `;
  });

  const result = await db<{ id: number }>`
    SELECT id FROM return_requests WHERE borrow_request_id = ${borrowRequestId}
  `;
  return result[0].id;
}

/**
 * Creates a renewal request
 */
async function createRenewalRequest(
  appUserId: number,
  borrowRequestId: number,
  currentEndDate: string,
  newEndDate: string,
  reason: string,
): Promise<number> {
  await db`
    INSERT INTO renewal_requests (borrow_request_id, user_id, current_end_date, requested_end_date, reason, status)
    VALUES (${borrowRequestId}, ${appUserId}, ${currentEndDate}, ${newEndDate}, ${reason}, 'pending')
  `;

  const result = await db<{ id: number }>`
    SELECT LAST_INSERT_ID() as id
  `;
  return result[0].id;
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Calculates end date from preset
 */
function calculateEndDate(startDate: string, presetValue: string): string {
  const preset = TIME_PRESETS.find((p) => p.value === presetValue);
  if (!preset) {
    throw new Error(`Invalid time preset: ${presetValue}`);
  }

  const start = new Date(startDate);
  start.setDate(start.getDate() + preset.days);
  return start.toISOString().split("T")[0];
}

/**
 * Calculates new end date from renewal preset
 */
function calculateRenewedDate(
  currentEndDate: string,
  presetValue: string,
): string {
  const preset = RENEWAL_PRESETS.find((p) => p.value === presetValue);
  if (!preset) {
    throw new Error(`Invalid renewal preset: ${presetValue}`);
  }

  const current = new Date(currentEndDate);
  current.setDate(current.getDate() + preset.days);
  return current.toISOString().split("T")[0];
}

/**
 * Gets today's date as ISO string
 */
function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Parses custom date range input
 */
function parseDateRange(
  input: string,
): { startDate: string; endDate: string } | null {
  const match = input.match(VALIDATION.dateRangePattern);
  if (!match) {
    return null;
  }

  const [, startDate, endDate] = match;

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null;
  }

  if (start < today) {
    return null;
  }

  if (end <= start) {
    return null;
  }

  return { startDate, endDate };
}

// ============================================================================
// BORROW Wizard Handler
// ============================================================================

/**
 * Handles BORROW wizard steps
 */
export async function handleBorrowWizard(
  session: BorrowWizardSession,
  context: InteractiveContext,
): Promise<SlashCommandResponse> {
  const { value } = context;

  // Handle cancel
  if (value === "cancel") {
    deleteSession(session.id);
    return buildCancelledMessage();
  }

  switch (session.step) {
    case BorrowWizardStep.SELECT_CATEGORY:
      return handleBorrowCategorySelection(session, value!);

    case BorrowWizardStep.SELECT_DEVICE:
      return handleBorrowDeviceSelection(session, context);

    case BorrowWizardStep.SELECT_TIME:
      return handleBorrowTimeSelection(session, value!);

    case BorrowWizardStep.ENTER_REASON:
      // Reason is handled via text input, not button
      return buildReasonPrompt(session.id, CommandAction.BORROW);

    case BorrowWizardStep.CONFIRM:
      return handleBorrowConfirmation(session, value!);

    default:
      return buildErrorMessage("Invalid wizard step");
  }
}

async function handleBorrowCategorySelection(
  session: BorrowWizardSession,
  category: string,
): Promise<SlashCommandResponse> {
  // Update session with selected category
  const updated = updateSession<BorrowWizardSession>(session.id, {
    step: BorrowWizardStep.SELECT_DEVICE,
    data: { category, page: 0 },
  });

  if (!updated) {
    return buildErrorMessage("Session expired. Please start again.");
  }

  // Get devices for this category
  const { devices, total } = await getAvailableDevices(category, 0);

  return buildDeviceSelection(session.id, devices, category, 0, total);
}

async function handleBorrowDeviceSelection(
  session: BorrowWizardSession,
  context: InteractiveContext,
): Promise<SlashCommandResponse> {
  const { value, page } = context;

  // Handle back to categories
  if (value === "back") {
    updateSession<BorrowWizardSession>(session.id, {
      step: BorrowWizardStep.SELECT_CATEGORY,
    });
    return buildCategorySelection(session.id);
  }

  // Handle pagination
  if (value === "prev" || value === "next") {
    const newPage = page ?? 0;
    updateSession<BorrowWizardSession>(session.id, {
      data: { page: newPage },
    });

    const { devices, total } = await getAvailableDevices(
      session.data.category!,
      newPage,
    );
    return buildDeviceSelection(
      session.id,
      devices,
      session.data.category!,
      newPage,
      total,
    );
  }

  // Handle device selection
  const deviceId = parseInt(value!);
  const device = await getDeviceById(deviceId);

  if (!device) {
    return buildErrorMessage("Device not found. Please try again.");
  }

  if (device.status !== "available") {
    return buildErrorMessage("This device is no longer available.");
  }

  // Update session with selected device
  updateSession<BorrowWizardSession>(session.id, {
    step: BorrowWizardStep.SELECT_TIME,
    data: { deviceId, deviceName: device.name },
  });

  return buildTimeSelection(session.id, device.name);
}

async function handleBorrowTimeSelection(
  session: BorrowWizardSession,
  value: string,
): Promise<SlashCommandResponse> {
  const startDate = getTodayISO();
  let endDate: string;

  if (value === "custom") {
    // Prompt for custom date range
    return ephemeralResponse(
      `:calendar: Please enter your date range in the format:\n\`YYYY-MM-DD to YYYY-MM-DD\`\n\nExample: \`2026-01-15 to 2026-01-22\``,
    );
  }

  try {
    endDate = calculateEndDate(startDate, value);
  } catch {
    return buildErrorMessage("Invalid time selection.");
  }

  // Update session with dates
  updateSession<BorrowWizardSession>(session.id, {
    step: BorrowWizardStep.ENTER_REASON,
    data: { startDate, endDate },
  });

  return buildReasonPrompt(session.id, CommandAction.BORROW);
}

async function handleBorrowConfirmation(
  session: BorrowWizardSession,
  value: string,
): Promise<SlashCommandResponse> {
  if (value !== "confirm") {
    deleteSession(session.id);
    return buildCancelledMessage();
  }

  // Get user mapping
  const userMapping = getUserMapping(session.mattermostUserId);
  if (!userMapping) {
    return buildErrorMessage("User not found. Please try again.");
  }

  try {
    // Create borrow request
    const requestId = await createBorrowRequest(
      userMapping.appUserId,
      session.data.deviceId!,
      session.data.startDate!,
      session.data.endDate!,
      session.data.reason!,
    );

    deleteSession(session.id);

    return buildSuccessMessage(
      CommandAction.BORROW,
      `Your borrow request #${requestId} has been submitted for **${session.data.deviceName}**.\n\nYou will be notified when it's approved.`,
    );
  } catch (error) {
    console.error("Error creating borrow request:", error);
    return buildErrorMessage(
      "Failed to create borrow request. Please try again.",
    );
  }
}

// ============================================================================
// RETURN Wizard Handler
// ============================================================================

/**
 * Handles RETURN wizard steps
 */
export async function handleReturnWizard(
  session: ReturnWizardSession,
  context: InteractiveContext,
): Promise<SlashCommandResponse> {
  const { value } = context;

  if (value === "cancel") {
    deleteSession(session.id);
    return buildCancelledMessage();
  }

  switch (session.step) {
    case ReturnWizardStep.SELECT_DEVICE:
      return handleReturnDeviceSelection(session, value!);

    case ReturnWizardStep.SELECT_CONDITION:
      return handleReturnConditionSelection(session, value!);

    case ReturnWizardStep.ENTER_NOTES:
      // Notes handled via text input
      return ephemeralResponse(
        `:memo: (Optional) Enter any notes about the device condition, or type "skip" to continue.`,
      );

    case ReturnWizardStep.CONFIRM:
      return handleReturnConfirmation(session, value!);

    default:
      return buildErrorMessage("Invalid wizard step");
  }
}

async function handleReturnDeviceSelection(
  session: ReturnWizardSession,
  value: string,
): Promise<SlashCommandResponse> {
  const borrowRequestId = parseInt(value);
  const borrowRequest = await getBorrowRequest(borrowRequestId);

  if (!borrowRequest) {
    return buildErrorMessage("Borrow request not found.");
  }

  updateSession<ReturnWizardSession>(session.id, {
    step: ReturnWizardStep.SELECT_CONDITION,
    data: {
      borrowRequestId,
      deviceId: borrowRequest.deviceId,
      deviceName: borrowRequest.deviceName,
    },
  });

  return buildConditionSelection(session.id, borrowRequest.deviceName);
}

async function handleReturnConditionSelection(
  session: ReturnWizardSession,
  condition: string,
): Promise<SlashCommandResponse> {
  updateSession<ReturnWizardSession>(session.id, {
    step: ReturnWizardStep.ENTER_NOTES,
    data: { condition },
  });

  return ephemeralResponse(
    `:memo: (Optional) Enter any notes about the device condition, or type "skip" to continue.`,
  );
}

async function handleReturnConfirmation(
  session: ReturnWizardSession,
  value: string,
): Promise<SlashCommandResponse> {
  if (value !== "confirm") {
    deleteSession(session.id);
    return buildCancelledMessage();
  }

  try {
    const device = await getDeviceById(session.data.deviceId!);

    await createReturnRequest(
      session.data.borrowRequestId!,
      session.data.condition!,
      session.data.notes || null,
    );

    deleteSession(session.id);

    return buildSuccessMessage(
      CommandAction.RETURN,
      `Your return of **${session.data.deviceName}** has been processed.\n\nThank you for returning the device!`,
    );
  } catch (error) {
    console.error("Error creating return request:", error);
    return buildErrorMessage("Failed to process return. Please try again.");
  }
}

// ============================================================================
// RENEWAL Wizard Handler
// ============================================================================

/**
 * Handles RENEWAL wizard steps
 */
export async function handleRenewalWizard(
  session: RenewalWizardSession,
  context: InteractiveContext,
): Promise<SlashCommandResponse> {
  const { value } = context;

  if (value === "cancel") {
    deleteSession(session.id);
    return buildCancelledMessage();
  }

  switch (session.step) {
    case RenewalWizardStep.SELECT_DEVICE:
      return handleRenewalDeviceSelection(session, value!);

    case RenewalWizardStep.SELECT_DURATION:
      return handleRenewalDurationSelection(session, value!);

    case RenewalWizardStep.ENTER_REASON:
      return buildReasonPrompt(session.id, CommandAction.RENEWAL);

    case RenewalWizardStep.CONFIRM:
      return handleRenewalConfirmation(session, value!);

    default:
      return buildErrorMessage("Invalid wizard step");
  }
}

async function handleRenewalDeviceSelection(
  session: RenewalWizardSession,
  value: string,
): Promise<SlashCommandResponse> {
  const borrowRequestId = parseInt(value);
  const borrowRequest = await getBorrowRequest(borrowRequestId);

  if (!borrowRequest) {
    return buildErrorMessage("Borrow request not found.");
  }

  if (borrowRequest.status !== "active") {
    return buildErrorMessage("This borrowing is not active.");
  }

  const endDateStr =
    typeof borrowRequest.endDate === "string"
      ? borrowRequest.endDate
      : new Date(borrowRequest.endDate).toISOString().split("T")[0];

  updateSession<RenewalWizardSession>(session.id, {
    step: RenewalWizardStep.SELECT_DURATION,
    data: {
      borrowRequestId,
      deviceId: borrowRequest.deviceId,
      deviceName: borrowRequest.deviceName,
      currentEndDate: endDateStr,
    },
  });

  return buildRenewalDurationSelection(
    session.id,
    borrowRequest.deviceName,
    endDateStr,
  );
}

async function handleRenewalDurationSelection(
  session: RenewalWizardSession,
  value: string,
): Promise<SlashCommandResponse> {
  const newEndDate = calculateRenewedDate(session.data.currentEndDate!, value);

  updateSession<RenewalWizardSession>(session.id, {
    step: RenewalWizardStep.ENTER_REASON,
    data: { newEndDate },
  });

  return buildReasonPrompt(session.id, CommandAction.RENEWAL);
}

async function handleRenewalConfirmation(
  session: RenewalWizardSession,
  value: string,
): Promise<SlashCommandResponse> {
  if (value !== "confirm") {
    deleteSession(session.id);
    return buildCancelledMessage();
  }

  const userMapping = getUserMapping(session.mattermostUserId);
  if (!userMapping) {
    return buildErrorMessage("User not found. Please try again.");
  }

  try {
    const requestId = await createRenewalRequest(
      userMapping.appUserId,
      session.data.borrowRequestId!,
      session.data.currentEndDate!,
      session.data.newEndDate!,
      session.data.reason!,
    );

    deleteSession(session.id);

    return buildSuccessMessage(
      CommandAction.RENEWAL,
      `Your renewal request #${requestId} for **${session.data.deviceName}** has been submitted.\n\nYou will be notified when it's approved.`,
    );
  } catch (error) {
    console.error("Error creating renewal request:", error);
    return buildErrorMessage(
      "Failed to create renewal request. Please try again.",
    );
  }
}

// ============================================================================
// Text Input Handler
// ============================================================================

/**
 * Handles text input during wizard (for reason/notes)
 */
export async function handleTextInput(
  session: WizardSession,
  text: string,
): Promise<SlashCommandResponse | null> {
  // Handle BORROW reason input
  if (
    session.action === CommandAction.BORROW &&
    (session as BorrowWizardSession).step === BorrowWizardStep.ENTER_REASON
  ) {
    if (text.length < VALIDATION.minReasonLength) {
      return ephemeralResponse(
        `:warning: Reason must be at least ${VALIDATION.minReasonLength} characters. Please try again.`,
      );
    }

    const borrowSession = session as BorrowWizardSession;
    const device = await getDeviceById(borrowSession.data.deviceId!);

    updateSession<BorrowWizardSession>(session.id, {
      step: BorrowWizardStep.CONFIRM,
      data: { reason: text },
    });

    return buildBorrowConfirmation(
      session.id,
      borrowSession.data.deviceName!,
      device?.assetTag || "",
      borrowSession.data.startDate!,
      borrowSession.data.endDate!,
      text,
    );
  }

  // Handle BORROW custom date range
  if (
    session.action === CommandAction.BORROW &&
    (session as BorrowWizardSession).step === BorrowWizardStep.SELECT_TIME
  ) {
    const dateRange = parseDateRange(text);
    if (!dateRange) {
      return ephemeralResponse(
        `:warning: Invalid date format. Please use: \`YYYY-MM-DD to YYYY-MM-DD\`\n\nMake sure:\n- Start date is today or later\n- End date is after start date`,
      );
    }

    updateSession<BorrowWizardSession>(session.id, {
      step: BorrowWizardStep.ENTER_REASON,
      data: { startDate: dateRange.startDate, endDate: dateRange.endDate },
    });

    return buildReasonPrompt(session.id, CommandAction.BORROW);
  }

  // Handle RETURN notes input
  if (
    session.action === CommandAction.RETURN &&
    (session as ReturnWizardSession).step === ReturnWizardStep.ENTER_NOTES
  ) {
    const returnSession = session as ReturnWizardSession;
    const notes = text.toLowerCase() === "skip" ? undefined : text;
    const device = await getDeviceById(returnSession.data.deviceId!);

    updateSession<ReturnWizardSession>(session.id, {
      step: ReturnWizardStep.CONFIRM,
      data: { notes },
    });

    return buildReturnConfirmation(
      session.id,
      returnSession.data.deviceName!,
      device?.assetTag || "",
      returnSession.data.condition!,
      notes,
    );
  }

  // Handle RENEWAL reason input
  if (
    session.action === CommandAction.RENEWAL &&
    (session as RenewalWizardSession).step === RenewalWizardStep.ENTER_REASON
  ) {
    if (text.length < VALIDATION.minReasonLength) {
      return ephemeralResponse(
        `:warning: Reason must be at least ${VALIDATION.minReasonLength} characters. Please try again.`,
      );
    }

    const renewalSession = session as RenewalWizardSession;
    const device = await getDeviceById(renewalSession.data.deviceId!);

    updateSession<RenewalWizardSession>(session.id, {
      step: RenewalWizardStep.CONFIRM,
      data: { reason: text },
    });

    return buildRenewalConfirmation(
      session.id,
      renewalSession.data.deviceName!,
      device?.assetTag || "",
      renewalSession.data.currentEndDate!,
      renewalSession.data.newEndDate!,
      text,
    );
  }

  return null;
}

// ============================================================================
// Initial Step Builders
// ============================================================================

/**
 * Gets the initial response for BORROW wizard
 */
export async function getInitialBorrowResponse(
  session: BorrowWizardSession,
): Promise<SlashCommandResponse> {
  if (session.data.deviceId) {
    // Device ID provided, skip to time selection
    const device = await getDeviceById(session.data.deviceId);
    if (!device) {
      return buildErrorMessage("Device not found.");
    }
    if (device.status !== "available") {
      return buildErrorMessage("This device is not available for borrowing.");
    }

    updateSession<BorrowWizardSession>(session.id, {
      data: { deviceName: device.name },
    });

    return buildTimeSelection(session.id, device.name);
  }

  return buildCategorySelection(session.id);
}

/**
 * Gets the initial response for RETURN wizard
 */
export async function getInitialReturnResponse(
  session: ReturnWizardSession,
  appUserId: number,
): Promise<SlashCommandResponse> {
  if (session.data.borrowRequestId) {
    // Borrow request ID provided, skip to condition selection
    const borrowRequest = await getBorrowRequest(session.data.borrowRequestId);
    if (!borrowRequest) {
      return buildErrorMessage("Borrow request not found.");
    }

    updateSession<ReturnWizardSession>(session.id, {
      data: {
        deviceId: borrowRequest.deviceId,
        deviceName: borrowRequest.deviceName,
      },
    });

    return buildConditionSelection(session.id, borrowRequest.deviceName);
  }

  const devices = await getUserBorrowedDevices(appUserId);
  return buildReturnDeviceSelection(session.id, devices);
}

/**
 * Gets the initial response for RENEWAL wizard
 */
export async function getInitialRenewalResponse(
  session: RenewalWizardSession,
  appUserId: number,
): Promise<SlashCommandResponse> {
  if (session.data.borrowRequestId) {
    const borrowRequest = await getBorrowRequest(session.data.borrowRequestId);
    if (!borrowRequest) {
      return buildErrorMessage("Borrow request not found.");
    }

    const endDateStr =
      typeof borrowRequest.endDate === "string"
        ? borrowRequest.endDate
        : new Date(borrowRequest.endDate).toISOString().split("T")[0];

    updateSession<RenewalWizardSession>(session.id, {
      data: {
        deviceId: borrowRequest.deviceId,
        deviceName: borrowRequest.deviceName,
        currentEndDate: endDateStr,
      },
    });

    return buildRenewalDurationSelection(
      session.id,
      borrowRequest.deviceName,
      endDateStr,
    );
  }

  const devices = await getUserBorrowedDevices(appUserId);
  return buildRenewalDeviceSelection(session.id, devices);
}
