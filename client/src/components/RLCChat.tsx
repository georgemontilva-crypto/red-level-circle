/**
 * RLCChat — Chat en tiempo real propio de RLC para streams en vivo.
 *
 * Características:
 *   - Mensajes en tiempo real via WebSocket
 *   - Avatar + nombre + badge de rol del usuario
 *   - Auto-scroll al último mensaje
 *   - Contador de viewers en tiempo real
 *   - Diseño gaming oscuro consistente con la plataforma
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useStreamChat, type ChatMessage } from "@/hooks/useStreamChat";
import { Send, Users, Wifi, WifiOff } from "lucide-react";

interface RLCChatProps {
  streamId: number;
  currentUser: {
    id: number;
    name?: string | null;
    nickname?: string | null;
    avatar?: string | null;
    role?: string;
  } | null;
}

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  super_admin: { label: "ADMIN",    cls: "text-yellow-300 bg-yellow-500/20 border-yellow-500/40" },
  admin:       { label: "ADMIN",    cls: "text-yellow-300 bg-yellow-500/20 border-yellow-500/40" },
  organizer:   { label: "ORG",      cls: "text-blue-300 bg-blue-500/20 border-blue-500/40" },
  premium:     { label: "PREMIUM",  cls: "text-purple-300 bg-purple-500/20 border-purple-500/40" },
  user:        { label: "",         cls: "" },
};

function Avatar({ src, name, size = 24 }: { src?: string | null; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  const initials = name.slice(0, 2).toUpperCase();
  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-red-600/30 border border-red-500/30 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-red-300"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  const badge = ROLE_BADGE[msg.userRole] ?? ROLE_BADGE.user;
  const displayName = msg.userNickname || msg.userName;
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex gap-2 items-start group px-3 py-1 hover:bg-white/[0.03] transition-colors ${isOwn ? "flex-row-reverse" : ""}`}>
      <Avatar src={msg.userAvatar} name={displayName} size={24} />
      <div className={`flex-1 min-w-0 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className={`text-[11px] font-semibold truncate max-w-[120px] ${isOwn ? "text-red-300" : "text-white/90"}`}>
            {displayName}
          </span>
          {badge.label && (
            <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${badge.cls} flex-shrink-0`}>
              {badge.label}
            </span>
          )}
          <span className="text-[9px] text-white/30 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {time}
          </span>
        </div>
        <p className={`text-[12px] text-white/80 leading-relaxed break-words max-w-[220px] ${isOwn ? "text-right" : ""}`}>
          {msg.message}
        </p>
      </div>
    </div>
  );
}

export default function RLCChat({ streamId, currentUser }: RLCChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const { messages, viewerCount, connected, sendMessage, error } = useStreamChat({
    streamId,
    enabled: true,
  });

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  // Detectar si el usuario scrolleó hacia arriba (deshabilitar auto-scroll)
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(isAtBottom);
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !currentUser) return;
    sendMessage(text);
    setInput("");
    setAutoScroll(true);
    inputRef.current?.focus();
  }, [input, currentUser, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="flex flex-col h-full bg-[#0e0e10] border-l border-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/10 flex-shrink-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-[11px] font-mono font-bold text-white tracking-widest uppercase">
            Chat RLC
          </span>
          {connected ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400 animate-pulse" />
          )}
        </div>
        {viewerCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{viewerCount}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
            <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <span className="text-red-400 text-lg">💬</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {connected ? "Sé el primero en chatear" : "Conectando al chat..."}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={currentUser?.id === msg.userId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mx-3 mb-1 py-1 text-[10px] font-mono text-white/60 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
        >
          ↓ Nuevos mensajes
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="mx-3 mb-1 px-2 py-1 text-[10px] font-mono text-red-300 bg-red-900/20 border border-red-500/30 rounded">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-2 border-t border-border flex-shrink-0">
        {currentUser ? (
          <div className="flex items-center gap-2">
            <Avatar src={currentUser.avatar} name={currentUser.nickname ?? currentUser.name ?? "?"} size={22} />
            <div className="flex-1 flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 focus-within:border-red-500/50 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                maxLength={500}
                className="flex-1 bg-transparent text-[12px] text-white placeholder-white/30 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !connected}
                className="text-red-400 hover:text-red-300 disabled:text-white/20 transition-colors flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-[11px] font-mono text-muted-foreground py-1">
            Inicia sesión para chatear
          </p>
        )}
      </div>
    </div>
  );
}
