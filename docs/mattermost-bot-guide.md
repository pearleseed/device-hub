# Device Hub Mattermost Bot - User & Administrator Guide

A complete guide for using the Device Hub Mattermost bot to manage device borrowing, returns, and renewals directly from Mattermost.

---

## Table of Contents

- [For Users](#for-users)
  - [Getting Started](#getting-started)
  - [Available Commands](#available-commands)
  - [Borrowing a Device](#borrowing-a-device)
  - [Returning a Device](#returning-a-device)
  - [Renewing a Borrowing](#renewing-a-borrowing)
  - [Checking Your Status](#checking-your-status)
  - [Receiving Notifications](#receiving-notifications)
- [For Administrators](#for-administrators)
  - [Bot Setup](#bot-setup)
  - [Configuration](#configuration)
  - [Notification Channel Setup](#notification-channel-setup)
  - [Troubleshooting](#troubleshooting)

---

## For Users

### Getting Started

The Device Hub bot allows you to manage device borrowing directly from Mattermost using simple slash commands. No need to leave your chat window!

**Prerequisites:**

- Your Mattermost account must be linked to Device Hub
- Contact your administrator if you see "account not linked" errors

**Quick Start:**

1. Type `/device help` in any channel to see available commands
2. Use `/device status` to view your current borrowings
3. Start borrowing with `/device borrow`

---

### Available Commands

| Command                       | Description                         |
| :---------------------------- | :---------------------------------- |
| `/device borrow`              | Start the device borrowing wizard   |
| `/device borrow [device_id]`  | Borrow a specific device by ID      |
| `/device return`              | Return a borrowed device            |
| `/device return [device_id]`  | Return a specific device by ID      |
| `/device renewal`             | Renew your borrowing period         |
| `/device renewal [device_id]` | Renew a specific device by ID       |
| `/device status`              | View your current active borrowings |
| `/device help`                | Show help message with all commands |

> **Tip:** All responses are ephemeral (only visible to you), so you can use these commands in any channel without disturbing others.

---

### Borrowing a Device

To borrow a device, use `/device borrow` and follow the interactive wizard:

**Step 1: Select Category**

```
┌─────────────────────────────────────────┐
│  🔢 Select Device Category              │
│                                         │
│  [💻 Laptops]  [📱 Mobile Phones]       │
│  [📱 Tablets]  [🖥️ Monitors]            │
│  [🎧 Accessories]                       │
│                                         │
│  [Cancel]                               │
└─────────────────────────────────────────┘
```

Click the category button that matches the type of device you need.

**Step 2: Select Device**

```
┌─────────────────────────────────────────┐
│  🔢 Select Device - 💻 Laptops          │
│  Available devices (Page 1/2):          │
│                                         │
│  [MacBook Pro 16" (DEV-001)]            │
│  [ThinkPad X1 Carbon (DEV-002)]         │
│  [Dell XPS 15 (DEV-003)]                │
│                                         │
│  [← Previous] [Next →] [← Back]         │
│  [Cancel]                               │
└─────────────────────────────────────────┘
```

- Browse available devices using pagination buttons
- Click on a device to select it
- Use "Back" to return to category selection

**Step 3: Select Duration**

```
┌─────────────────────────────────────────┐
│  🔢 Select Borrowing Duration           │
│  Device: MacBook Pro 16"                │
│                                         │
│  [1 Day] [3 Days] [7 Days]              │
│  [14 Days] [30 Days] [Custom Range]     │
│                                         │
│  [Cancel]                               │
└─────────────────────────────────────────┘
```

Choose a preset duration or select "Custom Range" to specify exact dates.

> **Custom Range:** Type dates in format `YYYY-MM-DD to YYYY-MM-DD`  
> Example: `2026-01-15 to 2026-01-30`

**Step 4: Enter Reason**

```
┌─────────────────────────────────────────┐
│  🔢 Enter Borrowing Reason              │
│                                         │
│  Please type your reason in the chat    │
│  (minimum 10 characters)                │
│                                         │
│  Example: Need laptop for client        │
│  presentation next week                 │
│                                         │
│  [Cancel]                               │
└─────────────────────────────────────────┘
```

Type your reason directly in the chat. The bot will capture your message.

**Step 5: Confirm**

```
┌─────────────────────────────────────────┐
│  ✅ Confirm Borrow Request              │
│                                         │
│  Device:     MacBook Pro 16" (DEV-001)  │
│  Start Date: Mon, Jan 10, 2026          │
│  End Date:   Mon, Jan 17, 2026          │
│  Duration:   7 days                     │
│  Reason:     Client presentation        │
│                                         │
│  [✓ Confirm Request]  [✗ Cancel]        │
└─────────────────────────────────────────┘
```

Review your request and click "Confirm Request" to submit.

---

### Returning a Device

To return a borrowed device, use `/device return`:

**Step 1: Select Device**

```
┌─────────────────────────────────────────┐
│  🔢 Select Device to Return             │
│                                         │
│  [MacBook Pro 16" (DEV-001)]            │
│  [iPhone 15 Pro (DEV-003)]              │
│                                         │
│  [Cancel]                               │
└─────────────────────────────────────────┘
```

Select the device you want to return from your active borrowings.

**Step 2: Select Condition**

```
┌─────────────────────────────────────────┐
│  🔢 Device Condition                    │
│  Device: MacBook Pro 16"                │
│                                         │
│  [⭐ Excellent]  [👍 Good]              │
│  [👌 Fair]       [⚠️ Damaged]           │
│                                         │
│  [Cancel]                               │
└─────────────────────────────────────────┘
```

Select the current condition of the device.

**Step 3: Enter Notes (Optional)**

```
┌─────────────────────────────────────────┐
│  🔢 Return Notes                        │
│                                         │
│  Type any notes about the device        │
│  condition, or type 'skip' to continue  │
│                                         │
│  [Cancel]                               │
└─────────────────────────────────────────┘
```

Add any notes about the device, or type `skip` to proceed without notes.

**Step 4: Confirm**

```
┌─────────────────────────────────────────┐
│  ✅ Confirm Return                      │
│                                         │
│  Device:    MacBook Pro 16" (DEV-001)   │
│  Condition: 👍 Good                     │
│  Notes:     Minor scratch on lid        │
│                                         │
│  [✓ Confirm Return]  [✗ Cancel]         │
└─────────────────────────────────────────┘
```

---

### Renewing a Borrowing

To extend your borrowing period, use `/device renewal`:

**Step 1: Select Borrowing**

```
┌─────────────────────────────────────────┐
│  🔢 Select Borrowing to Renew           │
│                                         │
│  [MacBook Pro - ends Jan 17, 2026]      │
│  [iPhone 15 - ends Jan 20, 2026]        │
│                                         │
│  [Cancel]                               │
└─────────────────────────────────────────┘
```

Select which active borrowing you want to renew.

**Step 2: Select Duration**

```
┌─────────────────────────────────────────┐
│  🔢 Select Renewal Duration             │
│  Device: MacBook Pro 16"                │
│  Current End Date: Mon, Jan 17, 2026    │
│                                         │
│  [+3 Days] [+7 Days]                    │
│  [+14 Days] [+30 Days]                  │
│                                         │
│  [Cancel]                               │
└─────────────────────────────────────────┘
```

Choose how much longer you need the device.

**Step 3: Enter Reason**

Provide a reason for the renewal (minimum 10 characters).

**Step 4: Confirm**

```
┌─────────────────────────────────────────┐
│  ✅ Confirm Renewal Request             │
│                                         │
│  Device:           MacBook Pro (DEV-001)│
│  Current End Date: Mon, Jan 17, 2026    │
│  New End Date:     Mon, Jan 24, 2026    │
│  Renewal Period:   7 days               │
│  Reason:           Project extended     │
│                                         │
│  [✓ Confirm Renewal]  [✗ Cancel]        │
└─────────────────────────────────────────┘
```

---

### Checking Your Status

Use `/device status` to see all your active borrowings:

```
┌─────────────────────────────────────────┐
│  📋 Your Active Borrowings              │
│                                         │
│  MacBook Pro 16" (DEV-001)              │
│  Period: Jan 10, 2026 → Jan 17, 2026    │
│  Status: active                         │
│                                         │
│  iPhone 15 Pro (DEV-003)                │
│  Period: Jan 5, 2026 → Jan 20, 2026     │
│  Status: active                         │
│                                         │
│  2 device(s) currently borrowed         │
└─────────────────────────────────────────┘
```

---

### Receiving Notifications

The bot sends you notifications when your requests are approved:

**Types of Notifications:**

- ✅ **Borrow Approvals** - When your device request is approved
- 📦 **Return Confirmations** - When your return is processed
- 📅 **Renewal Approvals** - When your renewal is approved

**How Notifications Work:**

1. **First Time:** You'll receive a mention in the notification channel

   ```
   @john.doe Your device borrowing request has been approved
   ```

2. **After DM Setup:** Once you message the bot directly, future notifications come as detailed DMs:
   ```
   ┌─────────────────────────────────────────┐
   │  ✅ Device Borrowing Approved           │
   │                                         │
   │  Your request has been approved!        │
   │                                         │
   │  Device Information:                    │
   │  Name:      MacBook Pro 16"             │
   │  Asset Tag: DEV-001                     │
   │  Category:  laptop                      │
   │  Brand:     Apple                       │
   │  Model:     MacBook Pro 16" M3          │
   │                                         │
   │  Borrowing Period:                      │
   │  Start: January 10, 2026                │
   │  End:   January 17, 2026                │
   │                                         │
   │  Status: 🟢 Active                      │
   │                                         │
   │  🔗 View Details on Device Hub          │
   └─────────────────────────────────────────┘
   ```

> **Tip:** Send any message to the bot via DM to enable direct message notifications. You'll receive a welcome message confirming the setup.

---

## For Administrators

### Bot Setup

#### 1. Create Bot Account

1. Go to **System Console** → **Integrations** → **Bot Accounts**
2. Click **Add Bot Account**
3. Configure:
   - **Username:** `devicehub-bot`
   - **Display Name:** `Device Hub`
   - **Description:** `Device borrowing management bot`
   - **Role:** `Member` (or `System Admin` if needed)
4. Save and copy the **Access Token**

#### 2. Create Slash Command

1. Go to **System Console** → **Integrations** → **Slash Commands**
2. Click **Add Slash Command**
3. Configure:
   - **Title:** `Device Hub`
   - **Description:** `Manage device borrowing`
   - **Command Trigger Word:** `device`
   - **Request URL:** `https://your-server.com/api/mattermost/command`
   - **Request Method:** `POST`
   - **Response Username:** `Device Hub Bot`
   - **Autocomplete:** ✅ Enabled
   - **Autocomplete Hint:** `[borrow|return|renewal|status|help]`
   - **Autocomplete Description:** `Manage device borrowing, returns, and renewals`
4. Save and copy the **Token** (optional, for verification)

#### 3. Create Notification Channel

1. Create a new channel (public or private) for notifications
2. Name suggestion: `device-notifications`
3. Add the bot to this channel
4. Copy the **Channel ID** (from channel URL or API)

---

### Configuration

Set these environment variables on your server:

```env
# Required
MATTERMOST_SERVER_URL=https://your-mattermost-server.com
MATTERMOST_BOT_TOKEN=your-bot-access-token
MATTERMOST_NOTIFICATION_CHANNEL_ID=channel-id-for-notifications

# Optional
MATTERMOST_BOT_USER_ID=bot-user-id              # Auto-detected if not set
APP_BASE_URL=https://your-devicehub-app.com     # For notification links
MATTERMOST_SLASH_COMMAND_TOKEN=command-token    # For request verification

# WebSocket Settings (optional)
MATTERMOST_WS_RECONNECT_INTERVAL=5000           # Reconnect delay (ms)
MATTERMOST_WS_MAX_RECONNECT_ATTEMPTS=10         # Max reconnect attempts
```

---

### Notification Channel Setup

The notification channel is used for users who haven't yet set up direct messaging with the bot.

**Best Practices:**

1. **Channel Visibility:** Use a public channel so all users can be added automatically
2. **Channel Purpose:** Set a clear purpose explaining the channel's use
3. **Pinned Message:** Pin a message explaining how to enable DM notifications

**Example Pinned Message:**

```
📢 Device Hub Notifications

This channel is used for device borrowing notifications.

To receive detailed notifications via Direct Message:
1. Click on the Device Hub bot profile
2. Send any message (e.g., "hi")
3. You'll receive a welcome message confirming DM setup

After setup, all future notifications will come directly to your DMs!
```

---

### Troubleshooting

#### User Not Linked Error

**Problem:** User sees "Your Mattermost account is not linked to Device Hub"

**Solution:**

1. Ensure the user exists in Device Hub
2. Set the `mattermost_username` field in the users table, OR
3. Ensure the user's email prefix matches their Mattermost username

```sql
-- Link user by Mattermost username
UPDATE users
SET mattermost_username = 'john.doe'
WHERE id = 123;
```

#### Bot Not Responding

**Problem:** Slash commands don't get a response

**Checklist:**

1. Verify the Request URL is correct and accessible
2. Check server logs for errors
3. Verify the bot token is valid
4. Ensure the server is running

#### Notifications Not Sending

**Problem:** Users don't receive notifications

**Checklist:**

1. Check WebSocket connection status via `/api/notifications/status`
2. Verify the notification channel ID is correct
3. Ensure the bot is a member of the notification channel
4. Check server logs for API errors

#### Session Expired Errors

**Problem:** Users see "Session expired" during wizard

**Cause:** Sessions expire after 15 minutes of inactivity

**Solution:** Users should restart the command with `/device borrow` (or other command)

---

### API Endpoints Reference

| Endpoint                         | Method | Description                  |
| :------------------------------- | :----- | :--------------------------- |
| `/api/mattermost/command`        | POST   | Slash command handler        |
| `/api/mattermost/interactive`    | POST   | Interactive message handler  |
| `/api/notifications/send`        | POST   | Send notification (internal) |
| `/api/notifications/status`      | GET    | Service status               |
| `/api/notifications/initialize`  | POST   | Initialize service           |
| `/api/notifications/users`       | GET    | User states (debug)          |
| `/api/notifications/idempotency` | GET    | Idempotency records (debug)  |

---

### Security Considerations

1. **Token Security:** Keep bot tokens secure and rotate periodically
2. **HTTPS:** Always use HTTPS for webhook URLs
3. **Token Verification:** Enable slash command token verification in production
4. **Channel Access:** Use private channels if device information is sensitive
5. **User Mapping:** Regularly audit user mappings between systems

---

## Support

For issues or questions:

- Check the [server logs](server/mattermost/README.md) for detailed error messages
- Review the [technical documentation](server/mattermost/README.md) for implementation details
- Contact your system administrator
