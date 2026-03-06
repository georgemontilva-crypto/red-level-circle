/**
 * Server-Sent Events (SSE) for Red Level Circle
 *
 * Provides real-time push updates to connected browser clients.
 * Events are emitted when data changes (follows, notifications, banners, news,
 * tournaments, allies, streams).
 *
 * Architecture:
 *   Mutation → sseEmit(event, payload) → all connected clients receive the event
 *   Client   → EventSource('/api/sse') → React Query invalidates affected queries
 *
 * Scalability improvements:
 *   - SSEEventType now includes stream_started, stream_ended, stream_updated
 *   - sseInternalBus.setMaxListeners raised to 10_000 for thousands of concurrent subs
 *   - Stale connections cleaned up on every broadcast (O(n) but amortized)
 *   - Keepalive interval reduced to 20s for faster dead-connection detection
 *   - Max connections per user = 3 (prevents tab-explosion resource exhaustion)
 */

import { EventEmitter } from "events";
import type { Request, Response } from "express";
import { authenticateRequest } from "./_core/authService";

// ─── Internal EventEmitter for tRPC subscriptions ────────────────────────────
/**
 * Internal bus that bridges sseEmit() calls with tRPC subscription procedures.
 * Each event is emitted as:
 *   - "broadcast"         → for public events (userId == null)
 *   - `user:${userId}`    → for private events targeting a specific user
 *
 * tRPC subscription procedures listen on both channels for the authenticated user.
 */
export const sseInternalBus = new EventEmitter();
// Support thousands of concurrent tRPC subscriptions (each adds 2 listeners)
sseInternalBus.setMaxListeners(10_000);

// ─── Types ────────────────────────────────────────────────────────────────────

export type SSEEventType =
  | "follow"           // someone followed a user
  | "unfollow"         // someone unfollowed a user
  | "notification"     // new notification for a user
  | "banner"           // section banner updated
  | "news"             // news created/updated/deleted
  | "tournament"       // tournament created/updated/approved/rejected
  | "ally"             // ally approved/updated/deleted
  | "ad"               // brand ad created/updated/deleted
  | "coins"            // user balance changed
  | "stream_started"   // a creator went live (auto-detected or manual)
  | "stream_ended"     // a creator went offline
  | "stream_updated"   // viewerCount / title / thumbnail changed
  | "ping";            // keepalive

export interface SSEEvent {
  type: SSEEventType;
  /** userId affected (for private events). null = broadcast to all. */
  userId?: number | null;
  payload?: Record<string, unknown>;
}

// ─── Client registry ─────────────────────────────────────────────────────────

interface SSEClient {
  id: string;
  userId: number | null;
  res: Response;
  connectedAt: number;
}

const clients = new Map<string, SSEClient>();

/** Maximum concurrent SSE connections allowed per authenticated userId. */
const MAX_CONNECTIONS_PER_USER = 3;

// ─── Register SSE endpoint ────────────────────────────────────────────────────

/**
 * Express route handler for GET /api/sse
 *
 * SECURITY: userId is resolved exclusively from the authenticated session cookie.
 * The legacy ?userId=<id> query param is intentionally ignored to prevent
 * unauthenticated clients from impersonating other users and receiving their
 * private notifications (balance changes, order updates, etc.).
 */
export async function sseHandler(req: Request, res: Response): Promise<void> {
  // Resolve userId from the authenticated session — never from query params.
  let userId: number | null = null;
  try {
    const user = await authenticateRequest(req);
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  // Enforce per-user connection limit to prevent resource exhaustion attacks.
  if (userId !== null) {
    const existingForUser = Array.from(clients.values()).filter(
      (c) => c.userId === userId && !c.res.writableEnded
    );
    if (existingForUser.length >= MAX_CONNECTIONS_PER_USER) {
      // Evict the oldest connection to make room for the new one.
      const oldest = existingForUser.sort((a, b) => a.connectedAt - b.connectedAt)[0];
      try { oldest.res.end(); } catch { /* ignore */ }
      clients.delete(oldest.id);
    }
  }

  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // Register client
  clients.set(clientId, { id: clientId, userId, res, connectedAt: Date.now() });

  // Send initial ping so the client knows it's connected
  res.write(`event: ping\ndata: {"connected":true,"clients":${clients.size}}\n\n`);

  // Keepalive every 20s to prevent proxy timeouts and detect dead connections faster
  const keepalive = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(keepalive);
      clients.delete(clientId);
      return;
    }
    try {
      res.write(`event: ping\ndata: {"ts":${Date.now()}}\n\n`);
    } catch {
      clearInterval(keepalive);
      clients.delete(clientId);
    }
  }, 20_000);

  // Cleanup on disconnect
  req.on("close", () => {
    clearInterval(keepalive);
    clients.delete(clientId);
  });
}

// ─── Emit helpers ─────────────────────────────────────────────────────────────

/**
 * Emit an SSE event to relevant connected clients.
 * - If event.userId is set, only that user's connections receive it.
 * - If event.userId is null/undefined, all clients receive it (broadcast).
 *
 * Also emits on the internal bus for tRPC subscription procedures.
 */
export function sseEmit(event: SSEEvent): void {
  const data = JSON.stringify({ type: event.type, payload: event.payload ?? {} });
  const message = `event: ${event.type}\ndata: ${data}\n\n`;

  // Push to legacy Express SSE clients
  for (const client of Array.from(clients.values())) {
    if (event.userId != null && client.userId !== event.userId) continue;
    if (client.res.writableEnded) {
      clients.delete(client.id);
      continue;
    }
    try {
      client.res.write(message);
    } catch {
      clients.delete(client.id);
    }
  }

  // Bridge to tRPC subscription procedures via internal EventEmitter
  const eventData = { type: event.type, payload: event.payload ?? {} };
  if (event.userId != null) {
    // Private event: emit on user-specific channel
    sseInternalBus.emit(`user:${event.userId}`, eventData);
  } else {
    // Public broadcast: emit on broadcast channel
    sseInternalBus.emit("broadcast", eventData);
  }
}

/** Broadcast to all connected clients (public data change) */
export function sseBroadcast(type: SSEEventType, payload?: Record<string, unknown>): void {
  sseEmit({ type, userId: null, payload });
}

/** Send to a specific user only (private data change) */
export function sseNotifyUser(userId: number, type: SSEEventType, payload?: Record<string, unknown>): void {
  sseEmit({ type, userId, payload });
}

/** Returns the current number of connected SSE clients (for monitoring). */
export function getSseClientCount(): number {
  return clients.size;
}
