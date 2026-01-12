/**
 * Mattermost Notification System - WebSocket Handler
 * Handles WebSocket connection for detecting user DM interactions
 */

import { MattermostWebSocketEvent, MattermostPost } from "./types";
import { MATTERMOST_CONFIG, API_ENDPOINTS, WS_EVENTS } from "./constants";
import { getWelcomeMessage } from "./templates";
import {
  getUserStateByMattermostId,
  setUserDMReadyByMattermostId,
  getAllUserStates,
} from "./user-state";
import { createPost, getBotUser } from "./client";

// ============================================================================
// WebSocket State
// ============================================================================

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let isConnecting = false;
let botUserId: string | null = null;

// ============================================================================
// WebSocket Connection
// ============================================================================

/**
 * Connects to the Mattermost WebSocket
 * @returns Promise that resolves when connected
 */
export async function connectWebSocket(): Promise<void> {
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    console.log("[Mattermost WS] Already connected or connecting");
    return;
  }

  isConnecting = true;

  const { serverUrl, botToken, wsMaxReconnectAttempts } = MATTERMOST_CONFIG;

  if (!serverUrl || !botToken) {
    console.error("[Mattermost WS] Missing server URL or bot token");
    isConnecting = false;
    return;
  }

  // Get bot user ID if not cached
  if (!botUserId) {
    try {
      const botUser = await getBotUser();
      botUserId = botUser.id;
      console.log(`[Mattermost WS] Bot user ID: ${botUserId}`);
    } catch (error) {
      console.error("[Mattermost WS] Failed to get bot user:", error);
      isConnecting = false;
      return;
    }
  }

  // Convert HTTP URL to WebSocket URL
  const wsUrl = serverUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  const fullWsUrl = `${wsUrl}${API_ENDPOINTS.websocket}`;

  console.log(`[Mattermost WS] Connecting to ${fullWsUrl}`);

  try {
    ws = new WebSocket(fullWsUrl);

    ws.onopen = () => {
      console.log("[Mattermost WS] Connected");
      isConnecting = false;
      reconnectAttempts = 0;

      // Authenticate with the WebSocket
      const authMessage = JSON.stringify({
        seq: 1,
        action: "authentication_challenge",
        data: {
          token: botToken,
        },
      });
      ws?.send(authMessage);
    };

    ws.onmessage = (event) => {
      handleWebSocketMessage(event.data);
    };

    ws.onerror = (error) => {
      console.error("[Mattermost WS] Error:", error);
    };

    ws.onclose = (event) => {
      console.log(`[Mattermost WS] Closed: ${event.code} ${event.reason}`);
      isConnecting = false;
      ws = null;

      // Attempt reconnection if not at max attempts
      if (reconnectAttempts < wsMaxReconnectAttempts) {
        scheduleReconnect();
      } else {
        console.error("[Mattermost WS] Max reconnection attempts reached");
      }
    };
  } catch (error) {
    console.error("[Mattermost WS] Connection error:", error);
    isConnecting = false;
    scheduleReconnect();
  }
}

/**
 * Schedules a reconnection attempt
 */
function scheduleReconnect(): void {
  const { wsReconnectInterval } = MATTERMOST_CONFIG;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  reconnectAttempts++;
  const delay = wsReconnectInterval * Math.min(reconnectAttempts, 5); // Exponential backoff capped at 5x

  console.log(
    `[Mattermost WS] Scheduling reconnect attempt ${reconnectAttempts} in ${delay}ms`,
  );

  reconnectTimeout = setTimeout(() => {
    connectWebSocket();
  }, delay);
}

/**
 * Disconnects from the Mattermost WebSocket
 */
export function disconnectWebSocket(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (ws) {
    ws.close(1000, "Client disconnect");
    ws = null;
  }

  isConnecting = false;
  reconnectAttempts = 0;
  console.log("[Mattermost WS] Disconnected");
}

/**
 * Checks if WebSocket is connected
 * @returns True if connected
 */
export function isWebSocketConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

// ============================================================================
// Message Handling
// ============================================================================

/**
 * Handles incoming WebSocket messages
 * @param data - Raw message data
 */
function handleWebSocketMessage(data: string): void {
  try {
    const event: MattermostWebSocketEvent = JSON.parse(data);

    // Handle different event types
    switch (event.event) {
      case WS_EVENTS.HELLO:
        console.log("[Mattermost WS] Received hello, connection authenticated");
        break;

      case WS_EVENTS.POSTED:
        handlePostedEvent(event);
        break;

      case WS_EVENTS.DIRECT_ADDED:
        console.log("[Mattermost WS] Direct channel created");
        break;

      default:
        // Ignore other events
        break;
    }
  } catch (error) {
    // Ignore parse errors for non-JSON messages (like pings)
  }
}

/**
 * Handles the "posted" WebSocket event
 * Detects when a user sends a message to the bot via DM
 * @param event - The WebSocket event
 */
async function handlePostedEvent(
  event: MattermostWebSocketEvent,
): Promise<void> {
  if (!event.data.post) {
    return;
  }

  try {
    const post: MattermostPost = JSON.parse(event.data.post);
    const channelType = event.data.channel_type;

    // Only process direct messages
    if (channelType !== "D") {
      return;
    }

    // Ignore messages from the bot itself
    if (post.user_id === botUserId) {
      return;
    }

    console.log(
      `[Mattermost WS] Received DM from user ${post.user_id} in channel ${post.channel_id}`,
    );

    // Check if this user is in our system and not yet DM-ready
    const userState = getUserStateByMattermostId(post.user_id);

    if (userState && !userState.dmReady) {
      console.log(
        `[Mattermost WS] User ${userState.mattermostUsername} (ID: ${userState.userId}) is now DM-ready`,
      );

      // Mark user as DM-ready
      setUserDMReadyByMattermostId(post.user_id, post.channel_id);

      // Send welcome message
      try {
        await createPost(post.channel_id, getWelcomeMessage());
        console.log(
          `[Mattermost WS] Sent welcome message to ${userState.mattermostUsername}`,
        );
      } catch (error) {
        console.error(`[Mattermost WS] Failed to send welcome message:`, error);
      }
    } else if (!userState) {
      // User not in our system - they might be messaging the bot directly
      // We could handle this case differently if needed
      console.log(
        `[Mattermost WS] Received DM from unknown user ${post.user_id}`,
      );
    }
  } catch (error) {
    console.error("[Mattermost WS] Error handling posted event:", error);
  }
}

// ============================================================================
// Status
// ============================================================================

/**
 * Gets the current WebSocket status
 * @returns Status object
 */
export function getWebSocketStatus(): {
  connected: boolean;
  reconnectAttempts: number;
  botUserId: string | null;
} {
  return {
    connected: isWebSocketConnected(),
    reconnectAttempts,
    botUserId,
  };
}
