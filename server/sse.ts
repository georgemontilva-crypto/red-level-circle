/**
 * Server-Sent Events (SSE) for Red Level Circle
 *
 * Provides real-time push updates to connected browser clients.
 * Events are emitted when data changes (follows, notifications, banners, news, tournaments, allies).
 *
 * Architecture:
 *   Mutation → sseEmit(event, payload) → all connected clients receive the event
 *   Client   → EventSource('/api/sse') → React Query invalidates affected queries
 *
 * Each connected client gets a response stream. Events are broadcast to:
 *   - ALL clients (public data changes: banners, news, tournaments, allies)
 *   - SPECIFIC user (private data: follows, notifications, coins)
 */

import type { Request, Response } from "express";

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
}

const clients = new Map<string, SSEClient>();

// ─── Register SSE endpoint ────────────────────────────────────────────────────

/**
 * Express route handler for GET /api/sse
 * Optionally accepts ?userId=<id> to register as an authenticated client.
 */
export function sseHandler(req: Request, res: Response): void {
  const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // Register client
  clients.set(clientId, { id: clientId, userId, res });

  // Send initial ping so the client knows it's connected
  res.write(`event: ping\ndata: {"connected":true}\n\n`);

  // Keepalive every 25s to prevent proxy timeouts
  const keepalive = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(keepalive);
      return;
    }
    res.write(`event: ping\ndata: {"ts":${Date.now()}}\n\n`);
  }, 25_000);

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
 */
export function sseEmit(event: SSEEvent): void {
  const data = JSON.stringify({ type: event.type, payload: event.payload ?? {} });
  const message = `event: ${event.type}\ndata: ${data}\n\n`;

  for (const client of clients.values()) {
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
}

/** Broadcast to all connected clients (public data change) */
export function sseBroadcast(type: SSEEventType, payload?: Record<string, unknown>): void {
  sseEmit({ type, userId: null, payload });
}

/** Send to a specific user only (private data change) */
export function sseNotifyUser(userId: number, type: SSEEventType, payload?: Record<string, unknown>): void {
  sseEmit({ type, userId, payload });
}
