import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, Trophy, Zap, ShoppingBag, Users, Star, Info, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  bracket_ready: <Trophy className="w-4 h-4 text-yellow-400" />,
  mission_approved: <Zap className="w-4 h-4 text-green-400" />,
  mission_rejected: <X className="w-4 h-4 text-red-400" />,
  order_confirmed: <ShoppingBag className="w-4 h-4 text-blue-400" />,
  team_invite: <Users className="w-4 h-4 text-purple-400" />,
  team_invite_accepted: <Users className="w-4 h-4 text-green-400" />,
  team_invite_rejected: <Users className="w-4 h-4 text-red-400" />,
  creator_verified: <Star className="w-4 h-4 text-yellow-400" />,
  creator_rejected: <X className="w-4 h-4 text-red-400" />,
  tournament_full: <Trophy className="w-4 h-4 text-orange-400" />,
  match_scheduled: <Trophy className="w-4 h-4 text-blue-400" />,
  match_result: <Trophy className="w-4 h-4 text-yellow-400" />,
  coins_earned: <Zap className="w-4 h-4 text-yellow-400" />,
  coins_spent: <ShoppingBag className="w-4 h-4 text-zinc-400" />,
  general: <Info className="w-4 h-4 text-zinc-400" />,
};

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery(
    { limit: 20 },
    { enabled: open }
  );

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const markOneRead = trpc.notifications.markOneRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const unreadCount = unreadData?.count ?? 0;

  // Calculate dropdown position using fixed coordinates from button rect
  function calcPosition() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 320;
    const margin = 8;

    // Position below the button, aligned to its left edge
    let left = rect.left;
    let top = rect.bottom + margin;

    // If it would go off the right edge of the viewport, shift left
    if (left + dropdownWidth > window.innerWidth - margin) {
      left = window.innerWidth - dropdownWidth - margin;
    }
    // If it would go off the left edge, clamp
    if (left < margin) left = margin;

    setDropdownPos({ top, left });
  }

  function handleToggle() {
    if (!open) {
      calcPosition();
    }
    setOpen((v) => !v);
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        buttonRef.current && buttonRef.current.contains(e.target as Node)
      ) return;
      if (
        dropdownRef.current && dropdownRef.current.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Recalculate on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const handler = () => calcPosition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open]);

  function handleNotificationClick(n: { id: number; isRead: boolean; link?: string | null }) {
    if (!n.isRead) {
      markOneRead.mutate({ id: n.id });
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  }

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      className="w-80 bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl overflow-hidden"
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        zIndex: 9999,
        animation: "notifSlideIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
        <span className="text-sm font-semibold text-white">Notificaciones</span>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
        {isLoading ? (
          <div className="py-8 text-center text-zinc-500 text-sm">Cargando...</div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">Sin notificaciones</p>
          </div>
        ) : (
          [...notifications].reverse().map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-zinc-800/50 ${
                !n.isRead ? "bg-red-500/5" : ""
              }`}
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
                {TYPE_ICONS[n.type] ?? <Info className="w-4 h-4 text-zinc-400" />}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm leading-snug ${!n.isRead ? "text-white font-medium" : "text-zinc-300"}`}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-zinc-500 shrink-0 mt-0.5">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>
              </div>
              {/* Unread dot */}
              {!n.isRead && (
                <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-red-500" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications && notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-zinc-700/50 text-center">
          <span className="text-xs text-zinc-500">
            {unreadCount === 0 ? "Todo al día" : `${unreadCount} sin leer`}
          </span>
        </div>
      )}

      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/60"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Render dropdown via portal to escape overflow:hidden containers */}
      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </>
  );
}
