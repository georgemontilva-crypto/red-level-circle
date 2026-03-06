/**
 * useStreamChat — Hook para conectar al chat en tiempo real de RLC via WebSocket.
 *
 * Maneja:
 *   - Conexión/reconexión automática con backoff exponencial
 *   - Autenticación con cookie de sesión (automática en el handshake)
 *   - Historial de mensajes al unirse
 *   - Envío de mensajes
 *   - Contador de viewers en tiempo real
 */

import { useState, useEffect, useRef, useCallback } from "react";

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

interface UseStreamChatOptions {
  streamId: number | null;
  enabled?: boolean;
}

interface UseStreamChatReturn {
  messages: ChatMessage[];
  viewerCount: number;
  connected: boolean;
  sendMessage: (text: string) => void;
  error: string | null;
}

const MAX_MESSAGES = 200;
const MAX_RECONNECT_DELAY = 30_000;

export function useStreamChat({ streamId, enabled = true }: UseStreamChatOptions): UseStreamChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const currentStreamId = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!streamId || !enabled || !mountedRef.current) return;

    // Limpiar conexión anterior
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws/chat`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      reconnectDelay.current = 1000;
      setConnected(true);
      setError(null);

      // Unirse al stream
      ws.send(JSON.stringify({ type: "join", streamId }));
      currentStreamId.current = streamId;
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      let msg: {
        type: string;
        messages?: ChatMessage[];
        message?: ChatMessage;
        viewerCount?: number;
        count?: number;
        text?: string;
        streamId?: number;
      };
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === "history" && Array.isArray(msg.messages)) {
        setMessages(msg.messages.slice(-MAX_MESSAGES));
      } else if (msg.type === "message" && msg.message) {
        setMessages((prev) => {
          const next = [...prev, msg.message!];
          return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
        });
      } else if (msg.type === "viewers" && typeof msg.count === "number") {
        setViewerCount(msg.count);
      } else if (msg.type === "joined" && typeof msg.viewerCount === "number") {
        setViewerCount(msg.viewerCount);
      } else if (msg.type === "error" && msg.text) {
        setError(msg.text);
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      wsRef.current = null;

      // Reconexión con backoff exponencial
      if (enabled && streamId) {
        const delay = Math.min(reconnectDelay.current, MAX_RECONNECT_DELAY);
        reconnectDelay.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      // El evento onclose se disparará después del error
    };
  }, [streamId, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (streamId && enabled) {
      setMessages([]);
      setViewerCount(0);
      connect();
    }
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [streamId, enabled, connect]);

  const sendMessage = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setError("No conectado al chat");
      return;
    }
    ws.send(JSON.stringify({ type: "message", text }));
  }, []);

  return { messages, viewerCount, connected, sendMessage, error };
}
