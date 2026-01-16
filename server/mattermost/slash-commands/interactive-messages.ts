/**
 * Mattermost Slash Commands - Interactive Message Builders
 * Builds interactive messages with buttons and selections
 */

import {
  SlashCommandResponse,
  MessageAttachment,
  InteractiveAction,
  InteractiveContext,
  DeviceOption,
  BorrowedDeviceOption,
  CommandAction,
  WizardStep,
  BorrowWizardStep,
  RenewalWizardStep,
  ReturnWizardStep,
} from "./types";
import {
  COLORS,
  DEVICE_CATEGORIES,
  DEVICE_CONDITIONS,
  TIME_PRESETS,
  RENEWAL_PRESETS,
  PAGINATION,
  SLASH_COMMAND_ENDPOINTS,
  getEndpointUrl,
} from "./constants";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates an ephemeral response (only visible to the user)
 */
export function ephemeralResponse(
  text: string,
  attachments?: MessageAttachment[],
): SlashCommandResponse {
  return {
    response_type: "ephemeral",
    text,
    attachments,
  };
}

/**
 * Creates an action button
 */
function createButton(
  id: string,
  name: string,
  context: InteractiveContext,
  style: InteractiveAction["style"] = "default",
): InteractiveAction {
  return {
    id,
    name,
    type: "button",
    style,
    integration: {
      url: getEndpointUrl(SLASH_COMMAND_ENDPOINTS.interactive),
      context,
    },
  };
}

/**
 * Formats a date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================================================
// Help Message
// ============================================================================

/**
 * Builds the help message
 */
export function buildHelpMessage(): SlashCommandResponse {
  const text = `
## :computer: Device Hub - Slash Commands

**Available Commands:**

| Command | Description |
|:--------|:------------|
| \`/device borrow\` | Start borrowing a device |
| \`/device borrow [device_id]\` | Borrow a specific device |
| \`/device return\` | Return a borrowed device |
| \`/device return [device_id]\` | Return a specific device |
| \`/device renewal\` | Renew your borrowing period |
| \`/device renewal [device_id]\` | Renew for a specific device |
| \`/device status\` | View your current borrowings |
| \`/device help\` | Show this help message |

**Tips:**
- Follow the wizard steps to complete your request
- Use the buttons to navigate through options
- You can cancel at any time by starting a new command
`.trim();

  return ephemeralResponse(text);
}

// ============================================================================
// Status Message
// ============================================================================

/**
 * Builds the user status message
 */
export function buildStatusMessage(
  borrowedDevices: BorrowedDeviceOption[],
): SlashCommandResponse {
  if (borrowedDevices.length === 0) {
    return ephemeralResponse(
      ":information_source: You don't have any active device loans.",
    );
  }

  const fields = borrowedDevices.map((device) => ({
    title: `${device.deviceName} (${device.assetTag})`,
    value: `**Period:** ${formatDate(device.startDate)} → ${formatDate(device.endDate)}\n**Status:** ${device.status}`,
    short: false,
  }));

  const attachment: MessageAttachment = {
    color: COLORS.info,
    title: ":clipboard: Your Active Loans",
    fields,
    footer: `${borrowedDevices.length} device(s) currently in use`,
  };

  return ephemeralResponse("", [attachment]);
}

// ============================================================================
// BORROW Wizard Messages
// ============================================================================

/**
 * Builds category selection message
 */
export function buildCategorySelection(
  sessionId: string,
): SlashCommandResponse {
  const actions: InteractiveAction[] = DEVICE_CATEGORIES.map((cat) =>
    createButton(
      `cat_${cat.value}`,
      `${cat.emoji} ${cat.label}`,
      {
        sessionId,
        action: CommandAction.BORROW,
        step: BorrowWizardStep.SELECT_CATEGORY,
        value: cat.value,
      },
      "default",
    ),
  );

  // Add cancel button
  actions.push(
    createButton(
      "cancel",
      "Cancel",
      {
        sessionId,
        action: CommandAction.BORROW,
        step: BorrowWizardStep.SELECT_CATEGORY,
        value: "cancel",
      },
      "danger",
    ),
  );

  const attachment: MessageAttachment = {
    color: COLORS.primary,
    title: ":one: Select Device Category",
    text: "Choose the type of device you want to borrow:",
    actions,
  };

  return ephemeralResponse("", [attachment]);
}

/**
 * Builds device selection message with pagination
 */
export function buildDeviceSelection(
  sessionId: string,
  devices: DeviceOption[],
  category: string,
  page: number,
  totalCount: number,
): SlashCommandResponse {
  const totalPages = Math.ceil(totalCount / PAGINATION.pageSize);
  const categoryInfo = DEVICE_CATEGORIES.find((c) => c.value === category);

  if (devices.length === 0) {
    return ephemeralResponse(
      `:warning: No available devices found in the **${categoryInfo?.label || category}** category.`,
    );
  }

  // Device buttons
  const deviceActions: InteractiveAction[] = devices.map((device) =>
    createButton(
      `device_${device.id}`,
      `${device.name} (${device.assetTag})`,
      {
        sessionId,
        action: CommandAction.BORROW,
        step: BorrowWizardStep.SELECT_DEVICE,
        value: String(device.id),
      },
      "primary",
    ),
  );

  // Pagination buttons
  const navActions: InteractiveAction[] = [];

  if (page > 0) {
    navActions.push(
      createButton(
        "prev_page",
        "← Previous",
        {
          sessionId,
          action: CommandAction.BORROW,
          step: BorrowWizardStep.SELECT_DEVICE,
          value: "prev",
          page: page - 1,
        },
        "default",
      ),
    );
  }

  if (page < totalPages - 1) {
    navActions.push(
      createButton(
        "next_page",
        "Next →",
        {
          sessionId,
          action: CommandAction.BORROW,
          step: BorrowWizardStep.SELECT_DEVICE,
          value: "next",
          page: page + 1,
        },
        "default",
      ),
    );
  }

  navActions.push(
    createButton(
      "back",
      "← Back to Categories",
      {
        sessionId,
        action: CommandAction.BORROW,
        step: BorrowWizardStep.SELECT_DEVICE,
        value: "back",
      },
      "default",
    ),
  );

  navActions.push(
    createButton(
      "cancel",
      "Cancel",
      {
        sessionId,
        action: CommandAction.BORROW,
        step: BorrowWizardStep.SELECT_DEVICE,
        value: "cancel",
      },
      "danger",
    ),
  );

  const attachment: MessageAttachment = {
    color: COLORS.primary,
    title: `:two: Select Device - ${categoryInfo?.emoji || ""} ${categoryInfo?.label || category}`,
    text: `Available devices (Page ${page + 1}/${totalPages}):`,
    actions: [...deviceActions, ...navActions],
    footer: `${totalCount} device(s) available`,
  };

  return ephemeralResponse("", [attachment]);
}

/**
 * Builds time selection message
 */
export function buildTimeSelection(
  sessionId: string,
  deviceName: string,
): SlashCommandResponse {
  const actions: InteractiveAction[] = TIME_PRESETS.map((preset) =>
    createButton(
      `time_${preset.value}`,
      preset.label,
      {
        sessionId,
        action: CommandAction.BORROW,
        step: BorrowWizardStep.SELECT_TIME,
        value: preset.value,
      },
      "default",
    ),
  );

  actions.push(
    createButton(
      "time_custom",
      "Custom Range",
      {
        sessionId,
        action: CommandAction.BORROW,
        step: BorrowWizardStep.SELECT_TIME,
        value: "custom",
      },
      "primary",
    ),
  );

  actions.push(
    createButton(
      "cancel",
      "Cancel",
      {
        sessionId,
        action: CommandAction.BORROW,
        step: BorrowWizardStep.SELECT_TIME,
        value: "cancel",
      },
      "danger",
    ),
  );

  const attachment: MessageAttachment = {
    color: COLORS.primary,
    title: ":three: Select Borrowing Duration",
    text: `**Device:** ${deviceName}\n\nHow long do you need to borrow this device?`,
    actions,
    footer: "For custom range, type: YYYY-MM-DD to YYYY-MM-DD",
  };

  return ephemeralResponse("", [attachment]);
}

/**
 * Builds reason input prompt
 */
export function buildReasonPrompt(
  sessionId: string,
  action: CommandAction,
): SlashCommandResponse {
  const stepNumber = action === CommandAction.BORROW ? ":four:" : ":three:";
  const title =
    action === CommandAction.RENEWAL
      ? "Enter Renewal Reason"
      : "Enter Borrowing Reason";

  const attachment: MessageAttachment = {
    color: COLORS.primary,
    title: `${stepNumber} ${title}`,
    text: "Please type your reason in the chat (minimum 10 characters).\n\n**Example:** _Need laptop for client presentation next week_",
    actions: [
      createButton(
        "cancel",
        "Cancel",
        {
          sessionId,
          action,
          step:
            action === CommandAction.BORROW
              ? BorrowWizardStep.ENTER_REASON
              : RenewalWizardStep.ENTER_REASON,
          value: "cancel",
        },
        "danger",
      ),
    ],
  };

  return ephemeralResponse("", [attachment]);
}

/**
 * Builds borrow confirmation message
 */
export function buildBorrowConfirmation(
  sessionId: string,
  deviceName: string,
  assetTag: string,
  startDate: string,
  endDate: string,
  reason: string,
): SlashCommandResponse {
  const attachment: MessageAttachment = {
    color: COLORS.success,
    title: ":five: Confirm Borrow Request",
    fields: [
      { title: "Device", value: `${deviceName} (${assetTag})`, short: true },
      { title: "Start Date", value: formatDate(startDate), short: true },
      { title: "End Date", value: formatDate(endDate), short: true },
      {
        title: "Duration",
        value: calculateDuration(startDate, endDate),
        short: true,
      },
      { title: "Reason", value: reason, short: false },
    ],
    actions: [
      createButton(
        "confirm",
        "✓ Confirm Request",
        {
          sessionId,
          action: CommandAction.BORROW,
          step: BorrowWizardStep.CONFIRM,
          value: "confirm",
        },
        "success",
      ),
      createButton(
        "cancel",
        "✗ Cancel",
        {
          sessionId,
          action: CommandAction.BORROW,
          step: BorrowWizardStep.CONFIRM,
          value: "cancel",
        },
        "danger",
      ),
    ],
  };

  return ephemeralResponse("", [attachment]);
}

// ============================================================================
// RETURN Wizard Messages
// ============================================================================

/**
 * Builds borrowed device selection for return
 */
export function buildReturnDeviceSelection(
  sessionId: string,
  devices: BorrowedDeviceOption[],
): SlashCommandResponse {
  if (devices.length === 0) {
    return ephemeralResponse(
      ":information_source: You don't have any devices to return.",
    );
  }

  const actions: InteractiveAction[] = devices.map((device) =>
    createButton(
      `return_${device.borrowRequestId}`,
      `${device.deviceName} (${device.assetTag})`,
      {
        sessionId,
        action: CommandAction.RETURN,
        step: ReturnWizardStep.SELECT_DEVICE,
        value: String(device.borrowRequestId),
      },
      "primary",
    ),
  );

  actions.push(
    createButton(
      "cancel",
      "Cancel",
      {
        sessionId,
        action: CommandAction.RETURN,
        step: ReturnWizardStep.SELECT_DEVICE,
        value: "cancel",
      },
      "danger",
    ),
  );

  const attachment: MessageAttachment = {
    color: COLORS.primary,
    title: ":one: Select Device to Return",
    text: "Choose the device you want to return:",
    actions,
  };

  return ephemeralResponse("", [attachment]);
}

/**
 * Builds condition selection for return
 */
export function buildConditionSelection(
  sessionId: string,
  deviceName: string,
): SlashCommandResponse {
  const actions: InteractiveAction[] = DEVICE_CONDITIONS.map((cond) =>
    createButton(
      `cond_${cond.value}`,
      `${cond.emoji} ${cond.label}`,
      {
        sessionId,
        action: CommandAction.RETURN,
        step: ReturnWizardStep.SELECT_CONDITION,
        value: cond.value,
      },
      cond.value === "damaged" ? "danger" : "default",
    ),
  );

  actions.push(
    createButton(
      "cancel",
      "Cancel",
      {
        sessionId,
        action: CommandAction.RETURN,
        step: ReturnWizardStep.SELECT_CONDITION,
        value: "cancel",
      },
      "danger",
    ),
  );

  const attachment: MessageAttachment = {
    color: COLORS.primary,
    title: ":two: Device Condition",
    text: `**Device:** ${deviceName}\n\nWhat is the current condition of the device?`,
    actions,
  };

  return ephemeralResponse("", [attachment]);
}

/**
 * Builds return confirmation message
 */
export function buildReturnConfirmation(
  sessionId: string,
  deviceName: string,
  assetTag: string,
  condition: string,
  notes: string | undefined,
): SlashCommandResponse {
  const conditionInfo = DEVICE_CONDITIONS.find((c) => c.value === condition);

  const fields = [
    { title: "Device", value: `${deviceName} (${assetTag})`, short: true },
    {
      title: "Condition",
      value: `${conditionInfo?.emoji || ""} ${conditionInfo?.label || condition}`,
      short: true,
    },
  ];

  if (notes) {
    fields.push({ title: "Notes", value: notes, short: false });
  }

  const attachment: MessageAttachment = {
    color: COLORS.success,
    title: ":four: Confirm Return",
    fields,
    actions: [
      createButton(
        "confirm",
        "✓ Confirm Return",
        {
          sessionId,
          action: CommandAction.RETURN,
          step: ReturnWizardStep.CONFIRM,
          value: "confirm",
        },
        "success",
      ),
      createButton(
        "cancel",
        "✗ Cancel",
        {
          sessionId,
          action: CommandAction.RETURN,
          step: ReturnWizardStep.CONFIRM,
          value: "cancel",
        },
        "danger",
      ),
    ],
  };

  return ephemeralResponse("", [attachment]);
}

// ============================================================================
// RENEWAL Wizard Messages
// ============================================================================

/**
 * Builds device selection for renewal
 */
export function buildRenewalDeviceSelection(
  sessionId: string,
  devices: BorrowedDeviceOption[],
): SlashCommandResponse {
  if (devices.length === 0) {
    return ephemeralResponse(
      ":information_source: You don't have any active borrowings to renew.",
    );
  }

  const actions: InteractiveAction[] = devices.map((device) =>
    createButton(
      `renew_${device.borrowRequestId}`,
      `${device.deviceName} - ends ${formatDate(device.endDate)}`,
      {
        sessionId,
        action: CommandAction.RENEWAL,
        step: RenewalWizardStep.SELECT_DEVICE,
        value: String(device.borrowRequestId),
      },
      "primary",
    ),
  );

  actions.push(
    createButton(
      "cancel",
      "Cancel",
      {
        sessionId,
        action: CommandAction.RENEWAL,
        step: RenewalWizardStep.SELECT_DEVICE,
        value: "cancel",
      },
      "danger",
    ),
  );

  const attachment: MessageAttachment = {
    color: COLORS.primary,
    title: ":one: Select Borrowing to Renew",
    text: "Choose which borrowing you want to renew:",
    actions,
  };

  return ephemeralResponse("", [attachment]);
}

/**
 * Builds renewal duration selection
 */
export function buildRenewalDurationSelection(
  sessionId: string,
  deviceName: string,
  currentEndDate: string,
): SlashCommandResponse {
  const actions: InteractiveAction[] = RENEWAL_PRESETS.map((preset) =>
    createButton(
      `renew_${preset.value}`,
      preset.label,
      {
        sessionId,
        action: CommandAction.RENEWAL,
        step: RenewalWizardStep.SELECT_DURATION,
        value: preset.value,
      },
      "default",
    ),
  );

  actions.push(
    createButton(
      "cancel",
      "Cancel",
      {
        sessionId,
        action: CommandAction.RENEWAL,
        step: RenewalWizardStep.SELECT_DURATION,
        value: "cancel",
      },
      "danger",
    ),
  );

  const attachment: MessageAttachment = {
    color: COLORS.primary,
    title: ":two: Select Renewal Duration",
    text: `**Device:** ${deviceName}\n**Current End Date:** ${formatDate(currentEndDate)}\n\nHow much longer do you need the device?`,
    actions,
  };

  return ephemeralResponse("", [attachment]);
}

/**
 * Builds renewal confirmation message
 */
export function buildRenewalConfirmation(
  sessionId: string,
  deviceName: string,
  assetTag: string,
  currentEndDate: string,
  newEndDate: string,
  reason: string,
): SlashCommandResponse {
  const attachment: MessageAttachment = {
    color: COLORS.success,
    title: ":four: Confirm Renewal Request",
    fields: [
      { title: "Device", value: `${deviceName} (${assetTag})`, short: true },
      {
        title: "Current End Date",
        value: formatDate(currentEndDate),
        short: true,
      },
      { title: "New End Date", value: formatDate(newEndDate), short: true },
      {
        title: "Renewal Period",
        value: calculateDuration(currentEndDate, newEndDate),
        short: true,
      },
      { title: "Reason", value: reason, short: false },
    ],
    actions: [
      createButton(
        "confirm",
        "✓ Confirm Renewal",
        {
          sessionId,
          action: CommandAction.RENEWAL,
          step: RenewalWizardStep.CONFIRM,
          value: "confirm",
        },
        "success",
      ),
      createButton(
        "cancel",
        "✗ Cancel",
        {
          sessionId,
          action: CommandAction.RENEWAL,
          step: RenewalWizardStep.CONFIRM,
          value: "cancel",
        },
        "danger",
      ),
    ],
  };

  return ephemeralResponse("", [attachment]);
}

// ============================================================================
// Success/Error Messages
// ============================================================================

/**
 * Builds success message
 */
export function buildSuccessMessage(
  action: CommandAction,
  details: string,
): SlashCommandResponse {
  const titles: Record<CommandAction, string> = {
    [CommandAction.BORROW]: ":white_check_mark: Borrow Request Submitted",
    [CommandAction.RETURN]: ":white_check_mark: Return Processed",
    [CommandAction.RENEWAL]: ":white_check_mark: Renewal Request Submitted",
    [CommandAction.HELP]: "",
    [CommandAction.STATUS]: "",
  };

  const attachment: MessageAttachment = {
    color: COLORS.success,
    title: titles[action],
    text: details,
  };

  return ephemeralResponse("", [attachment]);
}

/**
 * Builds error message
 */
export function buildErrorMessage(message: string): SlashCommandResponse {
  const attachment: MessageAttachment = {
    color: COLORS.danger,
    title: ":x: Error",
    text: message,
  };

  return ephemeralResponse("", [attachment]);
}

/**
 * Builds cancelled message
 */
export function buildCancelledMessage(): SlashCommandResponse {
  return ephemeralResponse(":no_entry_sign: Action cancelled.");
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculates duration between two dates
 */
function calculateDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return "1 day";
  }
  return `${diffDays} days`;
}
