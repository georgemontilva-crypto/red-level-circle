/**
 * RLCChat — Chat en tiempo real propio de RLC.
 * - Foto de perfil + frame cosmético superpuesto
 * - Checkmark de verificación si el usuario está verificado
 * - Sin badge de rol
 * - Mensajes empiezan desde abajo y van subiendo
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useStreamChat, type ChatMessage } from "@/hooks/useStreamChat";
import { Send, Users, Wifi, WifiOff, ChevronDown } from "lucide-react";

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

// ── Checkmark de verificación ─────────────────────────────────────────────────
function VerifiedIcon() {
  return (
    <svg
      className="inline-block w-3 h-3 text-blue-400 flex-shrink-0 mb-px"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Verificado"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z" />
    </svg>
  );
}

// ── Avatar con frame cosmético ────────────────────────────────────────────────
function UserAvatar({
  src,
  name,
  frameImage,
  size = 26,
}: {
  src?: string | null;
  name: string;
  frameImage?: string | null;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  const initials = name.slice(0, 1).toUpperCase();

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {src && !err ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <div
          className="w-full h-full rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold"
          style={{ fontSize: size * 0.42 }}
        >
          {initials}
        </div>
      )}
      {frameImage && (
        <img
          src={frameImage}
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ objectFit: "contain" }}
        />
      )}
    </div>
  );
}

// ── Fila de mensaje ───────────────────────────────────────────────────────────
function MessageRow({ msg }: { msg: ChatMessage }) {
  const displayName = msg.userNickname || msg.userName;
  const nameColor =
    msg.userRole === "admin" || msg.userRole === "super_admin"
      ? "text-red-400"
      : msg.userRole === "premium"
      ? "text-purple-400"
      : "text-zinc-300";

  return (
    <div className="flex items-start gap-2 px-2 py-0.5 hover:bg-white/[0.03] transition-colors">
      <UserAvatar
        src={msg.userAvatar}
        name={displayName}
        frameImage={(msg as any).userFrameImage ?? null}
        size={26}
      />
      <div className="flex-1 min-w-0 leading-snug">
        <span className={`text-[11px] font-semibold mr-1 ${nameColor}`}>
          {displayName}
        </span>
        {(msg as any).userIsVerified && <VerifiedIcon />}
        <span className="text-[12px] text-white/80 break-words"> {msg.message}</span>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function RLCChat({ streamId, currentUser }: RLCChatProps) {
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const prevLenRef = useRef(0);

  const { messages, viewerCount, connected, sendMessage, error } = useStreamChat({
    streamId,
    enabled: true,
  });

  // Scroll al fondo cuando llegan mensajes nuevos (solo si ya estaba abajo)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const diff = messages.length - prevLenRef.current;
    prevLenRef.current = messages.length;
    if (atBottom) {
      el.scrollTop = el.scrollHeight;
      setNewCount(0);
    } else if (diff > 0) {
      setNewCount((n) => n + diff);
    }
  }, [messages, atBottom]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAtBottom(isBottom);
    if (isBottom) setNewCount(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setAtBottom(true);
    setNewCount(0);
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !currentUser || !connected) return;
    sendMessage(text);
    setInput("");
    setAtBottom(true);
    setTimeout(scrollToBottom, 50);
    inputRef.current?.focus();
  }, [input, currentUser, connected, sendMessage, scrollToBottom]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-white tracking-widest uppercase">
            Chat RLC
          </span>
          {connected ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
          <Users className="w-3 h-3" />
          <span>{viewerCount}</span>
        </div>
      </div>

      {/* ── Lista de mensajes (crece desde abajo) ── */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto"
          style={{ scrollBehavior: "auto" }}
        >
          {/* Spacer: empuja los mensajes hacia abajo */}
          <div style={{ minHeight: "100%" }} className="flex flex-col justify-end">
            <div className="flex flex-col py-1">
              {messages.length === 0 && (
                <p className="text-center text-[11px] text-zinc-600 font-mono py-6">
                  {connected ? "Sé el primero en escribir" : "Conectando..."}
                </p>
              )}
              {messages.map((msg) => (
                <MessageRow key={msg.id} msg={msg} />
              ))}
            </div>
          </div>
        </div>

        {/* Botón "nuevos mensajes" */}
        {!atBottom && newCount > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-mono px-3 py-1 rounded-full shadow-lg transition-colors z-10"
          >
            <ChevronDown className="w-3 h-3" />
            {newCount} nuevo{newCount !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mx-2 mb-1 px-2 py-1 text-[10px] font-mono text-red-300 bg-red-900/20 border border-red-500/30 rounded flex-shrink-0">
          {error}
        </div>
      )}

      {/* ── Input ── */}
      <div className="flex-shrink-0 border-t border-zinc-800 px-2 py-2">
        {currentUser ? (
          <div className="flex items-center gap-2">
            <UserAvatar
              src={currentUser.avatar}
              name={currentUser.nickname ?? currentUser.name ?? "U"}
              frameImage={null}
              size={24}
            />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              placeholder="Escribe un mensaje..."
              disabled={!connected}
              className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-full px-3 py-1.5 text-[12px] text-white placeholder-zinc-500 outline-none transition-colors disabled:opacity-40"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !connected}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        ) : (
          <p className="text-center text-[11px] text-zinc-500 font-mono py-1">
            Inicia sesión para chatear
          </p>
        )}
      </div>
    </div>
  );
}
