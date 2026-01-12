# Mattermost Notification System

A complete notification system for the Device Hub borrowing application using Mattermost REST APIs.

## Overview

This system sends notifications to users when their device borrowing actions (BORROW, RETURN, RENEWAL) are approved. It follows Mattermost's bot limitations by using a two-phase notification approach:

1. **Channel Mention Phase**: For users who haven't interacted with the bot yet
2. **Direct Message Phase**: For users who have opened a DM with the bot

## Business Flow

### When an action is APPROVED:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Action Approved (BORROW/RETURN/RENEWAL)      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Check dm_ready flag  │
                    └───────────────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
    ┌─────────────────┐                 ┌─────────────────┐
    │  dm_ready=true  │                 │ dm_ready=false  │
    └─────────────────┘                 └─────────────────┘
              │                                   │
              ▼                                   ▼
    ┌─────────────────┐                 ┌─────────────────┐
    │ Send DM directly│                 │ Check channel   │
    │ (detailed msg)  │                 │ membership      │
    └─────────────────┘                 └─────────────────┘
                                                  │
                                        ┌─────────┴─────────┐
                                        │                   │
                                        ▼                   ▼
                              ┌─────────────────┐ ┌─────────────────┐
                              │ Not a member    │ │ Already member  │
                              │ → Add to channel│ └─────────────────┘
                              └─────────────────┘           │
                                        │                   │
                                        └─────────┬─────────┘
                                                  ▼
                                        ┌─────────────────┐
                                        │ Post @mention   │
                                        │ in channel      │
                                        └─────────────────┘
```

### When user opens DM with bot:

```
┌─────────────────────────────────────────────────────────────────┐
│              User sends first message to bot via DM             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ WebSocket detects DM  │
                    │ (posted event)        │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Set dm_ready = true   │
                    │ Store DM channel ID   │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Send welcome message  │
                    └───────────────────────┘
```

## File Structure

```
server/mattermost/
├── types.ts              # TypeScript types and enums
├── constants.ts          # Configuration and constants
├── templates.ts          # Message templates (channel & DM)
├── client.ts             # Mattermost REST API client
├── user-state.ts         # User state & idempotency management
├── websocket.ts          # WebSocket handler for DM detection
├── notification-service.ts # Main notification orchestration
├── index.ts              # Public API exports
└── README.md             # This file
```

## Configuration

Set these environment variables:

```env
# Required
MATTERMOST_SERVER_URL=https://your-mattermost-server.com
MATTERMOST_BOT_TOKEN=your-bot-access-token
MATTERMOST_NOTIFICATION_CHANNEL_ID=channel-id-for-notifications

# Optional
MATTERMOST_BOT_USER_ID=bot-user-id          # Auto-detected if not set
APP_BASE_URL=http://localhost:8080           # For detail links
MATTERMOST_WS_RECONNECT_INTERVAL=5000        # WebSocket reconnect delay
MATTERMOST_WS_MAX_RECONNECT_ATTEMPTS=10      # Max reconnect attempts
```

## API Endpoints

### POST /api/notifications/send

Sends a notification for a device action.

**Request Body:**

```json
{
  "action": "BORROW",
  "userId": 123,
  "mattermostUsername": "john.doe",
  "device": {
    "id": 1,
    "name": "MacBook Pro 16\"",
    "assetTag": "DEV-001",
    "category": "laptop",
    "brand": "Apple",
    "model": "MacBook Pro 16\" M3"
  },
  "requestId": 456,
  "startDate": "2026-01-10",
  "endDate": "2026-02-10"
}
```

**Action-specific fields:**

- `BORROW`: `startDate`, `endDate`
- `RETURN`: `returnDate`
- `RENEWAL`: `previousEndDate`, `newEndDate`

### GET /api/notifications/status

Returns the notification service status.

### POST /api/notifications/initialize

Manually initializes the notification service.

### GET /api/notifications/users

Returns all user notification states (admin only, for debugging).

### GET /api/notifications/idempotency

Returns all idempotency records (admin only, for debugging).

## Message Templates

### Channel Mention (Short)

- **BORROW**: "Your device borrowing request has been approved"
- **RETURN**: "Your device return has been confirmed"
- **RENEWAL**: "Your device borrowing renewal has been approved"

### Direct Message (Detailed)

Includes:

- Device information (name, asset tag, category, brand, model)
- Relevant dates (borrow period, return date, renewal dates)
- Current status
- Link to view details on the website

## Key Features

### Idempotency

- Each notification is tracked with a unique key: `notification:{action}:{requestId}:{userId}`
- Duplicate notifications within 1 hour are automatically skipped
- Expired records are cleaned up every 10 minutes

### User State Management

- Tracks `dm_ready` status per user
- Stores Mattermost user ID and DM channel ID
- In-memory storage (can be replaced with database for persistence)

### WebSocket Connection

- Maintains persistent connection to Mattermost
- Automatically reconnects with exponential backoff
- Detects user DM interactions via `posted` events

### Error Handling

- Custom `MattermostClientError` class for API errors
- Graceful handling of user not found, unauthorized, etc.
- Detailed logging for debugging

## Usage Example

```typescript
import {
  sendBorrowApprovalNotification,
  sendReturnConfirmationNotification,
  sendRenewalApprovalNotification,
} from "./mattermost";

// When a borrow request is approved
await sendBorrowApprovalNotification({
  userId: 123,
  mattermostUsername: "john.doe",
  device: {
    id: 1,
    name: 'MacBook Pro 16"',
    assetTag: "DEV-001",
    category: "laptop",
    brand: "Apple",
    model: 'MacBook Pro 16" M3',
  },
  requestId: 456,
  startDate: "2026-01-10",
  endDate: "2026-02-10",
});

// When a device is returned
await sendReturnConfirmationNotification({
  userId: 123,
  mattermostUsername: "john.doe",
  device: {
    /* ... */
  },
  requestId: 789,
  returnDate: "2026-01-20",
});

// When a borrowing renewal is approved
await sendRenewalApprovalNotification({
  userId: 123,
  mattermostUsername: "john.doe",
  device: {
    /* ... */
  },
  requestId: 101,
  previousEndDate: "2026-02-10",
  newEndDate: "2026-03-10",
});
```

## Mattermost Bot Setup

1. Create a bot account in Mattermost (System Console → Integrations → Bot Accounts)
2. Generate an access token for the bot
3. Create a notification channel and get its ID
4. Add the bot to the notification channel
5. Configure the environment variables

## Technical Constraints

- Uses Mattermost REST APIs only (NO plugins)
- Bots cannot DM users before user interaction
- Mentions do NOT automatically add users to channels
- User DM interaction is detected via WebSocket

## Required Mattermost APIs

- `POST /api/v4/posts` - Create posts
- `GET /api/v4/channels/{channel_id}/members/{user_id}` - Check membership
- `POST /api/v4/channels/{channel_id}/members` - Add member
- `POST /api/v4/channels/direct` - Create DM channel
- `GET /api/v4/users/username/{username}` - Get user by username
- `GET /api/v4/users/me` - Get bot user
- WebSocket `/api/v4/websocket` - Real-time events
