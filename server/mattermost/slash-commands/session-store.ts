/**
 * Mattermost Slash Commands - Session Store
 * Manages wizard session state for multi-step flows
 */

import {
  WizardSession,
  BorrowWizardSession,
  RenewalWizardSession,
  ReturnWizardSession,
  CommandAction,
  BorrowWizardStep,
  RenewalWizardStep,
  ReturnWizardStep,
  UserMapping,
} from "./types";
import { SESSION_CONFIG } from "./constants";

// ============================================================================
// In-Memory Storage
// ============================================================================

/**
 * Active wizard sessions indexed by session ID
 */
const sessions = new Map<string, WizardSession>();

/**
 * User to session mapping (one active session per user)
 */
const userSessions = new Map<string, string>();

/**
 * User mappings (Mattermost user ID to app user)
 */
const userMappings = new Map<string, UserMapping>();

// ============================================================================
// Session ID Generation
// ============================================================================

/**
 * Generates a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `session_${timestamp}_${random}`;
}

// ============================================================================
// Session Operations
// ============================================================================

/**
 * Creates a new BORROW wizard session
 */
export function createBorrowSession(
  mattermostUserId: string,
  channelId: string,
  deviceId?: number,
): BorrowWizardSession {
  // Cancel any existing session for this user
  cancelUserSession(mattermostUserId);

  const now = new Date();
  const session: BorrowWizardSession = {
    id: generateSessionId(),
    mattermostUserId,
    channelId,
    action: CommandAction.BORROW,
    step: deviceId
      ? BorrowWizardStep.SELECT_TIME
      : BorrowWizardStep.SELECT_CATEGORY,
    data: {
      deviceId,
      page: 0,
    },
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + SESSION_CONFIG.timeoutMs),
  };

  sessions.set(session.id, session);
  userSessions.set(mattermostUserId, session.id);

  return session;
}

/**
 * Creates a new RENEWAL wizard session
 */
export function createRenewalSession(
  mattermostUserId: string,
  channelId: string,
  borrowRequestId?: number,
): RenewalWizardSession {
  cancelUserSession(mattermostUserId);

  const now = new Date();
  const session: RenewalWizardSession = {
    id: generateSessionId(),
    mattermostUserId,
    channelId,
    action: CommandAction.RENEWAL,
    step: borrowRequestId
      ? RenewalWizardStep.SELECT_DURATION
      : RenewalWizardStep.SELECT_DEVICE,
    data: {
      borrowRequestId,
    },
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + SESSION_CONFIG.timeoutMs),
  };

  sessions.set(session.id, session);
  userSessions.set(mattermostUserId, session.id);

  return session;
}

/**
 * Creates a new RETURN wizard session
 */
export function createReturnSession(
  mattermostUserId: string,
  channelId: string,
  borrowRequestId?: number,
): ReturnWizardSession {
  cancelUserSession(mattermostUserId);

  const now = new Date();
  const session: ReturnWizardSession = {
    id: generateSessionId(),
    mattermostUserId,
    channelId,
    action: CommandAction.RETURN,
    step: borrowRequestId
      ? ReturnWizardStep.SELECT_CONDITION
      : ReturnWizardStep.SELECT_DEVICE,
    data: {
      borrowRequestId,
    },
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + SESSION_CONFIG.timeoutMs),
  };

  sessions.set(session.id, session);
  userSessions.set(mattermostUserId, session.id);

  return session;
}

/**
 * Gets a session by ID
 */
export function getSession(sessionId: string): WizardSession | null {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (session.expiresAt < new Date()) {
    deleteSession(sessionId);
    return null;
  }

  return session;
}

/**
 * Gets the active session for a user
 */
export function getUserSession(mattermostUserId: string): WizardSession | null {
  const sessionId = userSessions.get(mattermostUserId);
  if (!sessionId) {
    return null;
  }
  return getSession(sessionId);
}

/**
 * Updates a session
 */
export function updateSession<T extends WizardSession>(
  sessionId: string,
  updates: Partial<Pick<T, "step" | "data">>,
): T | null {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  const now = new Date();
  const updated = {
    ...session,
    ...updates,
    data: {
      ...session.data,
      ...(updates.data || {}),
    },
    updatedAt: now,
    expiresAt: new Date(now.getTime() + SESSION_CONFIG.timeoutMs),
  } as T;

  sessions.set(sessionId, updated);
  return updated;
}

/**
 * Deletes a session
 */
export function deleteSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);

  if (!session) {
    return false;
  }

  sessions.delete(sessionId);

  // Remove from user sessions if this is their active session
  const userSessionId = userSessions.get(session.mattermostUserId);
  if (userSessionId === sessionId) {
    userSessions.delete(session.mattermostUserId);
  }

  return true;
}

/**
 * Cancels any active session for a user
 */
export function cancelUserSession(mattermostUserId: string): boolean {
  const sessionId = userSessions.get(mattermostUserId);
  if (sessionId) {
    return deleteSession(sessionId);
  }
  return false;
}

// ============================================================================
// User Mapping Operations
// ============================================================================

/**
 * Gets or creates a user mapping
 */
export function getOrCreateUserMapping(
  mattermostUserId: string,
  mattermostUsername: string,
  appUserId: number,
): UserMapping {
  let mapping = userMappings.get(mattermostUserId);

  if (!mapping) {
    const now = new Date();
    mapping = {
      mattermostUserId,
      mattermostUsername,
      appUserId,
      dmReady: false,
      dmChannelId: null,
      createdAt: now,
      updatedAt: now,
    };
    userMappings.set(mattermostUserId, mapping);
  } else {
    // Update if app user ID changed
    if (mapping.appUserId !== appUserId) {
      mapping.appUserId = appUserId;
      mapping.updatedAt = new Date();
    }
  }

  return mapping;
}

/**
 * Gets a user mapping by Mattermost user ID
 */
export function getUserMapping(mattermostUserId: string): UserMapping | null {
  return userMappings.get(mattermostUserId) || null;
}

/**
 * Sets a user as DM-ready
 */
export function setUserMappingDMReady(
  mattermostUserId: string,
  dmChannelId: string,
): UserMapping | null {
  const mapping = userMappings.get(mattermostUserId);

  if (!mapping) {
    return null;
  }

  mapping.dmReady = true;
  mapping.dmChannelId = dmChannelId;
  mapping.updatedAt = new Date();

  return mapping;
}

/**
 * Checks if a user is DM-ready
 */
export function isUserMappingDMReady(mattermostUserId: string): boolean {
  const mapping = userMappings.get(mattermostUserId);
  return mapping?.dmReady || false;
}

// ============================================================================
// Cleanup Operations
// ============================================================================

/**
 * Cleans up expired sessions
 */
export function cleanupExpiredSessions(): number {
  const now = new Date();
  let cleaned = 0;

  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      deleteSession(sessionId);
      cleaned++;
    }
  }

  return cleaned;
}

// ============================================================================
// Debug/Admin Operations
// ============================================================================

/**
 * Gets all active sessions
 */
export function getAllSessions(): WizardSession[] {
  return Array.from(sessions.values());
}

/**
 * Gets all user mappings
 */
export function getAllUserMappings(): UserMapping[] {
  return Array.from(userMappings.values());
}

/**
 * Clears all sessions (for testing)
 */
export function clearAllSessions(): void {
  sessions.clear();
  userSessions.clear();
}

/**
 * Gets session statistics
 */
export function getSessionStats(): {
  totalSessions: number;
  sessionsByAction: Record<string, number>;
  userMappings: number;
} {
  const sessionsByAction: Record<string, number> = {};

  for (const session of sessions.values()) {
    sessionsByAction[session.action] =
      (sessionsByAction[session.action] || 0) + 1;
  }

  return {
    totalSessions: sessions.size,
    sessionsByAction,
    userMappings: userMappings.size,
  };
}

// ============================================================================
// Periodic Cleanup
// ============================================================================

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Starts periodic session cleanup
 */
export function startSessionCleanup(): void {
  if (cleanupInterval) {
    return;
  }

  cleanupInterval = setInterval(() => {
    const cleaned = cleanupExpiredSessions();
    if (cleaned > 0) {
      console.log(`[SlashCommands] Cleaned up ${cleaned} expired sessions`);
    }
  }, SESSION_CONFIG.cleanupIntervalMs);

  console.log("[SlashCommands] Started session cleanup");
}

/**
 * Stops periodic session cleanup
 */
export function stopSessionCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log("[SlashCommands] Stopped session cleanup");
  }
}
