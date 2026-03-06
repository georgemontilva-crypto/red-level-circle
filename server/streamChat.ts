/**
 * streamChat.ts
 * Chat en tiempo real para streams de RLC usando WebSockets nativos (ws).
 *
 * Protocolo de mensajes (JSON):
 *   Cliente → Servidor:
 *     { type: "auth",    token: string }          // autenticar con cookie de sesión
 *     { type: "join",    streamId: number }        // unirse a sala de stream
 *     { type: "message", text: string }            // enviar mensaje
 *
 *   Servidor → Cliente:
 *     { type: "history",  messages: ChatMessage[] }  // historial al unirse
 *     { type: "message",  message: ChatMessage }     // nuevo mensaje en sala
 *     { type: "error",    text: string }             // error
 *     { type: "joined",   streamId: number, viewerCount: number }
 *     { type: "viewers",  streamId: number, count: number }
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { verifySessionToken } from "./_core/authService";
import { getUserByOpenId, insertChatMessage, getChatMessages } from "./db";
import type { User } from "../drizzle/schema";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: number;
  streamId: number;
  userId: number;
  userName: string;
  userAvatar: string | null;
  userRole: string;
  userNickname: string | null;
  message: string;
  createdAt: string;
}

interface ExtendedWS extends WebSocket {
  user?: User;
  streamId?: number;
  isAlive?: boolean;
}

// ─── State ────────────────────────────────────────────────────────────────────
// Map<streamId, Set<WebSocket>>
const rooms = new Map<number, Set<ExtendedWS>>();

function getRoom(streamId: number): Set<ExtendedWS> {
  if (!rooms.has(streamId)) rooms.set(streamId, new Set());
  return rooms.get(streamId)!;
}

function broadcastToRoom(streamId: number, payload: object, exclude?: ExtendedWS) {
  const room = rooms.get(streamId);
  if (!room) return;
  const data = JSON.stringify(payload);
  room.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastViewerCount(streamId: number) {
  const count = rooms.get(streamId)?.size ?? 0;
  broadcastToRoom(streamId, { type: "viewers", streamId, count });
}

// ─── Parse cookie header ──────────────────────────────────────────────────────
function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key) map.set(key.trim(), rest.join("=").trim());
  }
  return map;
}

// ─── Main setup ───────────────────────────────────────────────────────────────
export function setupStreamChatWS(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/chat" });

  // Heartbeat: detectar clientes muertos cada 30s
  const heartbeat = setInterval(() => {
    rooms.forEach((room, streamId) => {
      room.forEach((ws) => {
        if (!ws.isAlive) {
          ws.terminate();
          room.delete(ws);
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
      if (room.size === 0) rooms.delete(streamId);
    });
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeat));

  wss.on("connection", async (rawWs, req) => {
    const ws = rawWs as ExtendedWS;
    ws.isAlive = true;

    ws.on("pong", () => { ws.isAlive = true; });

    // Intentar autenticar desde cookie de sesión en el handshake
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies.get("app_session_id");
    if (sessionToken) {
      const session = await verifySessionToken(sessionToken);
      if (session) {
        const user = await getUserByOpenId(session.openId);
        if (user) ws.user = user;
      }
    }

    ws.on("message", async (raw) => {
      let msg: { type: string; token?: string; streamId?: number; text?: string };
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // ── auth: autenticar con token explícito (fallback si la cookie no llegó) ──
      if (msg.type === "auth" && msg.token) {
        const session = await verifySessionToken(msg.token);
        if (session) {
          const user = await getUserByOpenId(session.openId);
          if (user) ws.user = user;
        }
        return;
      }

      // ── join: unirse a sala de stream ──
      if (msg.type === "join" && typeof msg.streamId === "number") {
        // Salir de sala anterior si existe
        if (ws.streamId != null) {
          const prevRoom = rooms.get(ws.streamId);
          if (prevRoom) {
            prevRoom.delete(ws);
            broadcastViewerCount(ws.streamId);
            if (prevRoom.size === 0) rooms.delete(ws.streamId);
          }
        }

        ws.streamId = msg.streamId;
        getRoom(msg.streamId).add(ws);

        // Enviar historial de los últimos 100 mensajes
        const history = await getChatMessages(msg.streamId, 100);
        ws.send(JSON.stringify({
          type: "history",
          messages: history.map(formatMessage),
        }));

        // Notificar viewer count actualizado
        broadcastViewerCount(msg.streamId);

        ws.send(JSON.stringify({
          type: "joined",
          streamId: msg.streamId,
          viewerCount: rooms.get(msg.streamId)?.size ?? 1,
        }));
        return;
      }

      // ── message: enviar mensaje al chat ──
      if (msg.type === "message" && typeof msg.text === "string") {
        if (!ws.user) {
          ws.send(JSON.stringify({ type: "error", text: "Debes iniciar sesión para chatear" }));
          return;
        }
        if (ws.streamId == null) {
          ws.send(JSON.stringify({ type: "error", text: "Únete a un stream primero" }));
          return;
        }

        const text = msg.text.trim().slice(0, 500);
        if (!text) return;

        const user = ws.user;
        const saved = await insertChatMessage({
          streamId: ws.streamId,
          userId: user.id,
          userName: user.nickname ?? user.name ?? "Usuario",
          userAvatar: user.avatar ?? null,
          userRole: user.role ?? "user",
          userNickname: user.nickname ?? null,
          message: text,
        });

        const payload = {
          type: "message",
          message: formatMessage(saved),
        };

        // Broadcast a toda la sala incluyendo al emisor
        broadcastToRoom(ws.streamId, payload);
        return;
      }
    });

    ws.on("close", () => {
      if (ws.streamId != null) {
        const room = rooms.get(ws.streamId);
        if (room) {
          room.delete(ws);
          broadcastViewerCount(ws.streamId);
          if (room.size === 0) rooms.delete(ws.streamId);
        }
      }
    });

    ws.on("error", () => {
      // Silenciar errores de socket para no crashear el servidor
    });
  });

  console.log("[Chat WS] Servidor de chat en tiempo real activo en /ws/chat");
  return wss;
}

function formatMessage(m: {
  id: number;
  streamId: number;
  userId: number;
  userName: string;
  userAvatar: string | null | undefined;
  userRole: string | null | undefined;
  userNickname: string | null | undefined;
  message: string;
  createdAt: Date | string;
}): ChatMessage {
  return {
    id: m.id,
    streamId: m.streamId,
    userId: m.userId,
    userName: m.userName,
    userAvatar: m.userAvatar ?? null,
    userRole: m.userRole ?? "user",
    userNickname: m.userNickname ?? null,
    message: m.message,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
  };
}
