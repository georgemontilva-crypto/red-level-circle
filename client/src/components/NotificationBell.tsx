import { useState, useRef, useEffect } from "react";
import {
  Bell, CheckCheck, Trophy, Zap, ShoppingBag,
  Users, Star, Info, X, ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  bracket_ready:        <Trophy   className="w-4 h-4 text-yellow-400" />,
  mission_approved:     <Zap      className="w-4 h-4 text-green-400"  />,
  mission_rejected:     <X        className="w-4 h-4 text-red-400"    />,
  order_confirmed:      <ShoppingBag className="w-4 h-4 text-blue-400" />,
  team_invite:          <Users    className="w-4 h-4 text-purple-400" />,
  team_invite_accepted: <Users    className="w-4 h-4 text-green-400"  />,
  team_invite_rejected: <Users    className="w-4 h-4 text-red-400"    />,
  creator_verified:     <Star     className="w-4 h-4 text-yellow-400" />,
  creator_rejected:     <X        className="w-4 h-4 text-red-400"    />,
  tournament_full:      <Trophy   className="w-4 h-4 text-orange-400" />,
  match_scheduled:      <Trophy   className="w-4 h-4 text-blue-400"   />,
  match_result:         <Trophy   className="w-4 h-4 text-yellow-400" />,
  coins_earned:         <Zap      className="w-4 h-4 text-yellow-400" />,
  coins_spent:          <ShoppingBag className="w-4 h-4 text-muted-foreground" />,
  general:              <Info     className="w-4 h-4 text-muted-foreground"   />,
};

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)    return "ahora";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ─── Shared notification panel (used by both variants) ───────────────────────
interface NotificationPanelProps {
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  style: React.CSSProperties;
  onClose: () => void;
}

function NotificationPanel({ dropdownRef, style, onClose }: NotificationPanelProps) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery({ limit: 20 }, {
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });

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

  // Fallback destinations for old notifications that don't have a link stored
  const TYPE_LINKS: Record<string, string> = {
    order_confirmed:      "/shop?tab=orders",
    coins_earned:         "/shop?tab=orders",
    coins_spent:          "/shop?tab=orders",
    bracket_ready:        "/tournaments",
    match_scheduled:      "/betting",
    match_result:         "/betting",
    tournament_full:      "/tournaments",
    mission_approved:     "/missions",
    mission_rejected:     "/missions",
    team_invite:          "/teams",
    team_invite_accepted: "/teams",
    team_invite_rejected: "/teams",
    creator_verified:     "/creators",
    creator_rejected:     "/creators",
    general:              "",
  };

  function handleNotificationClick(n: { id: number; isRead: boolean; link?: string | null; type: string }) {
    if (!n.isRead) markOneRead.mutate({ id: n.id });
    const dest = n.link || TYPE_LINKS[n.type] || "";
    if (dest) {
      onClose();
      // Use window.location for links with query strings (e.g. /shop?tab=orders)
      // so the target page can read the params on mount
      if (dest.includes("?")) {
        window.location.href = dest;
      } else {
        navigate(dest);
      }
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden"
      style={{ ...style, animation: "notifSlideIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <span className="text-sm font-semibold text-white">Notificaciones</span>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Cargando...</div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Sin notificaciones</p>
          </div>
        ) : (
          [...notifications].reverse().map((n) => {
            const dest = n.link || TYPE_LINKS[n.type] || "";
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex gap-3 px-4 py-3 transition-colors group ${
                  dest ? "cursor-pointer hover:bg-secondary/60" : "cursor-default hover:bg-secondary/30"
                } ${
                  !n.isRead ? "bg-red-500/5" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                  {TYPE_ICONS[n.type] ?? <Info className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.isRead ? "text-white font-medium" : "text-secondary-foreground"}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  {dest && (
                    <p className="text-[10px] text-red-400/60 mt-1 flex items-center gap-0.5 group-hover:text-red-400 transition-colors">
                      <ChevronRight className="w-3 h-3" /> Ver detalles
                    </p>
                  )}
                </div>
                {!n.isRead && (
                  <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-red-500" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications && notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border/50 text-center">
          <span className="text-xs text-muted-foreground">
            {unreadCount === 0 ? "Todo al día" : `${unreadCount} sin leer`}
          </span>
        </div>
      )}

      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}

// ─── Sidebar variant ─────────────────────────────────────────────────────────
// The profile card in SidebarLayout must have: position:relative; overflow:visible
// The dropdown will be absolutely positioned relative to that card.

interface SidebarNotificationBellProps {
  /** Ref to the profile card element (position:relative container) */
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export function SidebarNotificationBell({ cardRef }: SidebarNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [fixedPos, setFixedPos] = useState({ top: 0, left: 0 });
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });
  const unreadCount = unreadData?.count ?? 0;

  function calcPos() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownW = 320;
    const margin = 8;
    // Position dropdown to the right of the sidebar, aligned with the button
    let left = rect.right + margin;
    // If it overflows the viewport, flip to the left
    if (left + dropdownW > window.innerWidth - margin) {
      left = rect.left - dropdownW - margin;
    }
    setFixedPos({ top: rect.top, left });
  }

  function handleToggle() {
    if (!open) calcPos();
    setOpen((v) => !v);
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (buttonRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dropdownStyle: React.CSSProperties = {
    position: "fixed",
    top: fixedPos.top,
    left: fixedPos.left,
    width: 320,
    zIndex: 9999,
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-secondary/60"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <NotificationPanel
          dropdownRef={dropdownRef}
          style={dropdownStyle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
// ─── Topbar variant (mobile)─────────────────────────────────────────────────
export function TopbarNotificationBell() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [fixedPos, setFixedPos] = useState({ top: 0, right: 0 });

  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });
  const unreadCount = unreadData?.count ?? 0;

  function calcPos() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const w = 320;
    const m = 8;
    const centeredLeft = Math.max(m, Math.min(window.innerWidth - w - m, (window.innerWidth - w) / 2));
    setFixedPos({
      top: rect.bottom + m,
      right: window.innerWidth - centeredLeft - w,
    });
  }

  function handleToggle() {
    if (!open) calcPos();
    setOpen((v) => !v);
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (buttonRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = () => calcPos();
    window.addEventListener("scroll", h, true);
    window.addEventListener("resize", h);
    return () => { window.removeEventListener("scroll", h, true); window.removeEventListener("resize", h); };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-secondary/60"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          dropdownRef={dropdownRef}
          style={{ position: "fixed", top: fixedPos.top, right: fixedPos.right, width: 320, zIndex: 9999, maxWidth: "calc(100vw - 16px)" }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Legacy default export (kept for backward compat) ────────────────────────
export function NotificationBell({ variant = "sidebar" }: { variant?: "sidebar" | "topbar" }) {
  if (variant === "topbar") return <TopbarNotificationBell />;
  // sidebar variant without cardRef — button is the anchor (fallback)
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, { refetchInterval: 5_000, refetchIntervalInBackground: true });
  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (buttonRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-secondary/60"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <NotificationPanel
          dropdownRef={dropdownRef}
          style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 320, zIndex: 9999 }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
