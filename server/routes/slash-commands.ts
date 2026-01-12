/**
 * Slash Commands Routes
 * API endpoints for Mattermost slash commands and interactive messages
 */

import {
  handleSlashCommand,
  handleInteractiveMessage,
  handleWizardTextInput,
  verifyCommandToken,
  SlashCommandRequest,
  InteractiveMessageRequest,
  SlashCommandResponse,
  getSessionStats,
  getAllSessions,
  getAllUserMappings,
} from "../mattermost/slash-commands";
import { authenticateRequest, requireAdmin } from "../middleware/auth";

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function slashCommandResponse(response: SlashCommandResponse): Response {
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================================================
// Routes
// ============================================================================

export const slashCommandsRoutes = {
  /**
   * POST /api/mattermost/command
   * Handles incoming slash commands from Mattermost
   */
  async command(request: Request): Promise<Response> {
    try {
      // Parse form data (Mattermost sends as application/x-www-form-urlencoded)
      const contentType = request.headers.get("content-type") || "";
      let commandRequest: SlashCommandRequest;

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData();
        commandRequest = {
          channel_id: formData.get("channel_id") as string,
          channel_name: formData.get("channel_name") as string,
          command: formData.get("command") as string,
          response_url: formData.get("response_url") as string,
          team_domain: formData.get("team_domain") as string,
          team_id: formData.get("team_id") as string,
          text: (formData.get("text") as string) || "",
          token: formData.get("token") as string,
          trigger_id: formData.get("trigger_id") as string,
          user_id: formData.get("user_id") as string,
          user_name: formData.get("user_name") as string,
        };
      } else {
        // JSON format
        commandRequest = await request.json();
      }

      // Verify token if configured
      if (!verifyCommandToken(commandRequest.token)) {
        console.error("[SlashCommands] Invalid command token");
        return slashCommandResponse({
          response_type: "ephemeral",
          text: ":x: Unauthorized request",
        });
      }

      // Handle the command
      const response = await handleSlashCommand(commandRequest);
      return slashCommandResponse(response);
    } catch (error) {
      console.error("[SlashCommands] Command handler error:", error);
      return slashCommandResponse({
        response_type: "ephemeral",
        text: ":x: An error occurred processing your command. Please try again.",
      });
    }
  },

  /**
   * POST /api/mattermost/interactive
   * Handles interactive message actions (button clicks, selections)
   */
  async interactive(request: Request): Promise<Response> {
    try {
      const interactiveRequest: InteractiveMessageRequest =
        await request.json();

      console.log(
        "[SlashCommands] Interactive request:",
        JSON.stringify(interactiveRequest, null, 2),
      );

      // Handle the interactive action
      const response = await handleInteractiveMessage(interactiveRequest);

      // Return update response
      return jsonResponse({
        update: {
          message: response.text || "",
          props: {
            attachments: response.attachments || [],
          },
        },
      });
    } catch (error) {
      console.error("[SlashCommands] Interactive handler error:", error);
      return jsonResponse({
        update: {
          message: ":x: An error occurred. Please try again.",
        },
      });
    }
  },

  /**
   * POST /api/mattermost/text-input
   * Handles text input during wizard sessions
   * Called by WebSocket handler when user sends a message
   */
  async textInput(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const { mattermostUserId, text } = body;

      if (!mattermostUserId || !text) {
        return jsonResponse(
          { success: false, error: "Missing required fields" },
          400,
        );
      }

      const response = await handleWizardTextInput(mattermostUserId, text);

      if (!response) {
        // No active session, ignore
        return jsonResponse({ success: true, handled: false });
      }

      return jsonResponse({
        success: true,
        handled: true,
        response,
      });
    } catch (error) {
      console.error("[SlashCommands] Text input handler error:", error);
      return jsonResponse({ success: false, error: "Internal error" }, 500);
    }
  },

  /**
   * GET /api/mattermost/sessions
   * Gets session statistics (admin only)
   */
  async sessions(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const stats = getSessionStats();
      const sessions = getAllSessions();
      const userMappings = getAllUserMappings();

      return jsonResponse({
        success: true,
        data: {
          stats,
          sessions: sessions.map((s) => ({
            id: s.id,
            action: s.action,
            step: s.step,
            mattermostUserId: s.mattermostUserId,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
          })),
          userMappings,
        },
      });
    } catch (error) {
      console.error("[SlashCommands] Sessions handler error:", error);
      return jsonResponse({ success: false, error: "Internal error" }, 500);
    }
  },
};
