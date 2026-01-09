# Mattermost Slash Commands - ChatOps for Device Hub

A complete ChatOps implementation for device management using Mattermost slash commands with multi-step wizard flows.

## Overview

This system allows users to BORROW, RETURN, and RENEW devices directly from Mattermost using the `/device` slash command. It implements a multi-step wizard flow since Mattermost doesn't support multi-field forms.

## Commands

| Command | Description |
|:--------|:------------|
| `/device borrow` | Start borrowing a device |
| `/device borrow [device_id]` | Borrow a specific device |
| `/device return` | Return a borrowed device |
| `/device return [device_id]` | Return a specific device |
| `/device renewal` | Renew your borrowing period |
| `/device renewal [device_id]` | Renew for a specific device |
| `/device status` | View your current borrowings |
| `/device help` | Show help message |

## Wizard Flows

### BORROW Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    /device borrow                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  1. SELECT CATEGORY             │
              │  [Laptops] [Phones] [Tablets]   │
              │  [Monitors] [Accessories]       │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  2. SELECT DEVICE               │
              │  [MacBook Pro (DEV-001)]        │
              │  [ThinkPad X1 (DEV-002)]        │
              │  [← Prev] [Next →] [Back]       │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  3. SELECT DURATION             │
              │  [1 Day] [3 Days] [7 Days]      │
              │  [14 Days] [30 Days] [Custom]   │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  4. ENTER REASON                │
              │  "Type your reason..."          │
              │  (min 10 characters)            │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  5. CONFIRM                     │
              │  Device: MacBook Pro            │
              │  Period: Jan 10 → Jan 17        │
              │  Reason: Client presentation    │
              │  [✓ Confirm] [✗ Cancel]         │
              └─────────────────────────────────┘
```

### RETURN Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    /device return                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  1. SELECT DEVICE               │
              │  [MacBook Pro (DEV-001)]        │
              │  [iPhone 15 (DEV-003)]          │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  2. SELECT CONDITION            │
              │  [⭐ Excellent] [👍 Good]        │
              │  [👌 Fair] [⚠️ Damaged]          │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  3. ENTER NOTES (optional)      │
              │  "Type notes or 'skip'..."      │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  4. CONFIRM                     │
              │  Device: MacBook Pro            │
              │  Condition: Good                │
              │  [✓ Confirm] [✗ Cancel]         │
              └─────────────────────────────────┘
```

### RENEWAL Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    /device renewal                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  1. SELECT BORROWING            │
              │  [MacBook Pro - ends Jan 17]    │
              │  [iPhone 15 - ends Jan 20]      │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  2. SELECT DURATION             │
              │  [+3 Days] [+7 Days]            │
              │  [+14 Days] [+30 Days]          │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  3. ENTER REASON                │
              │  "Type your reason..."          │
              │  (min 10 characters)            │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  4. CONFIRM                     │
              │  Device: MacBook Pro            │
              │  Current End: Jan 17            │
              │  New End: Jan 24                │
              │  [✓ Confirm] [✗ Cancel]         │
              └─────────────────────────────────┘
```

## File Structure

```
server/mattermost/slash-commands/
├── types.ts              # TypeScript types and enums
├── constants.ts          # Configuration and constants
├── session-store.ts      # Wizard session state management
├── interactive-messages.ts # Interactive message builders
├── wizard.ts             # Multi-step wizard logic
├── handlers.ts           # Command and interaction handlers
├── index.ts              # Public API exports
└── README.md             # This file
```

## API Endpoints

### POST /api/mattermost/command
Handles incoming slash commands from Mattermost.

**Request:** `application/x-www-form-urlencoded` (Mattermost format)
```
channel_id=xxx&user_id=xxx&user_name=john&text=borrow&token=xxx
```

**Response:** Ephemeral message with interactive buttons

### POST /api/mattermost/interactive
Handles interactive message actions (button clicks).

**Request:**
```json
{
  "user_id": "xxx",
  "context": {
    "sessionId": "session_xxx",
    "action": "borrow",
    "step": "select_category",
    "value": "laptop"
  }
}
```

**Response:** Updated message with next wizard step

### POST /api/mattermost/text-input
Handles text input during wizard sessions.

**Request:**
```json
{
  "mattermostUserId": "xxx",
  "text": "Need laptop for client presentation"
}
```

### GET /api/mattermost/sessions
Gets session statistics (admin only).

## Mattermost Setup

### 1. Create Slash Command

In Mattermost System Console → Integrations → Slash Commands:

- **Command Trigger Word:** `device`
- **Request URL:** `https://your-server.com/api/mattermost/command`
- **Request Method:** POST
- **Response Username:** Device Hub Bot
- **Autocomplete:** Enable
- **Autocomplete Hint:** `[borrow|return|renewal|status|help]`

### 2. Create Outgoing Webhook (for text input)

For handling text input during wizard sessions:

- **Content Type:** `application/json`
- **Trigger Words:** (leave empty for all messages)
- **Callback URLs:** `https://your-server.com/api/mattermost/text-input`

### 3. Configure Interactive Messages

Ensure your Mattermost server allows interactive messages from your server URL.

## Configuration

Environment variables:

```env
# Required for slash commands
MATTERMOST_SERVER_URL=https://your-mattermost-server.com
MATTERMOST_BOT_TOKEN=your-bot-access-token

# Optional
MATTERMOST_SLASH_COMMAND_TOKEN=your-slash-command-token
```

## Session Management

- Sessions expire after 15 minutes of inactivity
- Only one active session per user
- Starting a new command cancels any existing session
- Sessions are cleaned up automatically every 5 minutes

## User Mapping

Users are mapped between Mattermost and Device Hub by:
1. `mattermost_username` column in users table (if set)
2. Email prefix matching username (fallback)
3. Exact email match (fallback)

## Technical Constraints

- Uses Mattermost REST APIs only (no plugins)
- Interactive messages limited to 5-10 items per page
- All wizard steps use ephemeral messages (only visible to user)
- Text input handled via separate endpoint

## Integration with Notifications

When actions are approved on the website:
1. If user is not DM-ready → post channel mention
2. If user is DM-ready → send direct message
3. Channel messages "activate" DM communication

See `server/mattermost/README.md` for notification system details.
