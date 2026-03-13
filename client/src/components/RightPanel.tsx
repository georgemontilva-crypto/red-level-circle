import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Bell, Gift, Bookmark, X, ChevronRight, CheckCheck,
  Trophy, Zap, ShoppingBag, Users, Star, Info,
  Coins, Settings, LogOut, Shield, Crown, Wallet,
  ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { UserAvatar } from "./UserAvatar";
import { RLCIcon } from "./RLCIcon";

export type RightPanelTab = "notifications" | "rewards" | "wishlist" | "wallet";

interface RightPanelProps {
  open: boolean;
  activeTab: RightPanelTab;
  onTabChange: (tab: RightPanelTab) => void;
  onClose: () => void;
}

// ─── Notification helpers ─────────────────────────────────────────────────────
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

const TYPE_LINKS: Record<string, string> = {
  order_confirmed:      "/shop?tab=orders",
  coins_earned:         "/wallet",
  coins_spent:          "/wallet",
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

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)    return "ahora";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ─── Tab content components ───────────────────────────────────────────────────
function NotificationsTab({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, { refetchInterval: 5_000 });
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery({ limit: 30 }, { refetchInterval: 5_000 });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { utils.notifications.unreadCount.invalidate(); utils.notifications.list.invalidate(); },
  });
  const markOneRead = trpc.notifications.markOneRead.useMutation({
    onSuccess: () => { utils.notifications.unreadCount.invalidate(); utils.notifications.list.invalidate(); },
  });
  const unreadCount = unreadData?.count ?? 0;

  function handleClick(n: { id: number; isRead: boolean; link?: string | null; type: string }) {
    if (!n.isRead) markOneRead.mutate({ id: n.id });
    const dest = n.link || TYPE_LINKS[n.type] || "";
    if (dest) {
      onClose();
      if (dest.includes("?")) window.location.href = dest;
      else navigate(dest);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {unreadCount > 0 && (
        <div className="px-4 py-2 flex justify-end border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1.5 text-xs font-mono transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"}
          >
            <CheckCheck className="w-3.5 h-3.5" /> Marcar todas como leídas
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.3 }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sin notificaciones</p>
          </div>
        ) : (
          [...notifications].reverse().map((n) => {
            const dest = n.link || TYPE_LINKS[n.type] || "";
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className="flex gap-3 px-4 py-3.5 transition-all group"
                style={{
                  background: !n.isRead ? "rgba(220,38,38,0.04)" : "transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  cursor: dest ? "pointer" : "default",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = !n.isRead ? "rgba(220,38,38,0.04)" : "transparent"}
              >
                <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                  {TYPE_ICONS[n.type] ?? <Info className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-snug" style={{ color: !n.isRead ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: !n.isRead ? 600 : 400 }}>
                      {n.title}
                    </p>
                    <span className="text-[10px] shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{n.message}</p>
                  {dest && (
                    <p className="text-[10px] mt-1 flex items-center gap-0.5 transition-colors" style={{ color: "rgba(220,38,38,0.5)" }}>
                      <ChevronRight className="w-3 h-3" /> Ver detalles
                    </p>
                  )}
                </div>
                {!n.isRead && <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RewardsTab({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const { data: rewards, isLoading } = trpc.rewards.list.useQuery();

  return (
    <div className="flex-1 overflow-y-auto">
      {isLoading ? (
        <div className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Cargando...</div>
      ) : !rewards || rewards.length === 0 ? (
        <div className="py-16 text-center">
          <Gift className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No hay recompensas disponibles</p>
        </div>
      ) : (
        rewards.slice(0, 10).map((r: any) => (
          <div
            key={r.id}
            onClick={() => { onClose(); navigate("/missions"); }}
            className="flex gap-3 px-4 py-3.5 cursor-pointer transition-all"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
          >
            <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(234,179,8,0.1)" }}>
              <Coins className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{r.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                +{r.coinsReward} RLC Coins
              </p>
            </div>
            <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
          </div>
        ))
      )}
      <div className="px-4 py-3">
        <button
          onClick={() => { onClose(); navigate("/missions"); }}
          className="w-full py-2.5 rounded-xl text-sm font-semibold font-mono tracking-wide transition-all"
          style={{ background: "rgba(220,38,38,0.12)", color: "var(--accent-red)", border: "1px solid rgba(220,38,38,0.2)" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.2)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.12)"}
        >
          Ver todas las recompensas
        </button>
      </div>
    </div>
  );
}

function WishlistTab({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const { data: wishlistData, isLoading } = trpc.shop.getWishlist.useQuery();
  const items = wishlistData?.items ?? [];

  return (
    <div className="flex-1 overflow-y-auto">
      {isLoading ? (
        <div className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <Bookmark className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Tu lista de favoritos está vacía</p>
          <button
            onClick={() => { onClose(); navigate("/shop"); }}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(220,38,38,0.12)", color: "var(--accent-red)", border: "1px solid rgba(220,38,38,0.2)" }}
          >
            Explorar tienda
          </button>
        </div>
      ) : (
        <>
          {items.map((item: any) => {
            // El endpoint getWishlist devuelve { wishlistItem, product }
            const product = item.product ?? item.shopItem;
            return (
              <div
                key={item.wishlistItem?.id ?? item.id}
                onClick={() => { onClose(); navigate("/shop"); }}
                className="flex gap-3 px-4 py-3.5 cursor-pointer transition-all"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
              >
                {(product?.image || product?.imageUrl) ? (
                  <img
                    src={product.image ?? product.imageUrl}
                    alt={product?.name ?? "Artículo"}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget as HTMLImageElement).nextElementSibling?.removeAttribute("style"); }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <ShoppingBag className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{product?.name ?? "Artículo"}</p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>
                    {product?.price ? `${Number(product.price).toLocaleString()} RLC` : ""}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              </div>
            );
          })}
          <div className="px-4 py-3">
            <button
              onClick={() => { onClose(); navigate("/shop?tab=wishlist"); }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold font-mono tracking-wide transition-all"
              style={{ background: "rgba(220,38,38,0.12)", color: "var(--accent-red)", border: "1px solid rgba(220,38,38,0.2)" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.2)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.12)"}
            >
              Ver lista completa
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Wallet Tab ─────────────────────────────────────────────────────────────
const TX_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; sign: string }> = {
  deposit:     { label: "Depósito",    icon: <ArrowDownLeft className="w-4 h-4" />,  color: "#22c55e",  sign: "+" },
  withdrawal:  { label: "Retiro",      icon: <ArrowUpRight  className="w-4 h-4" />,  color: "#ef4444",  sign: "-" },
  bet_placed:  { label: "Apuesta",     icon: <TrendingDown  className="w-4 h-4" />,  color: "#f97316",  sign: "-" },
  bet_won:     { label: "Apuesta ganada", icon: <TrendingUp className="w-4 h-4" />,  color: "#22c55e",  sign: "+" },
  bet_lost:    { label: "Apuesta perdida", icon: <TrendingDown className="w-4 h-4" />, color: "#ef4444", sign: "-" },
  reward:      { label: "Recompensa",  icon: <Star          className="w-4 h-4" />,  color: "#FACC15",  sign: "+" },
  refund:      { label: "Reembolso",   icon: <ArrowDownLeft className="w-4 h-4" />,  color: "#60a5fa",  sign: "+" },
};

function WalletTab() {
  const { data: wallet, isLoading } = trpc.auth.wallet.useQuery();
  const balance = wallet?.balance ?? 0;
  const transactions: any[] = wallet?.transactions ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Balance card */}
      <div
        className="flex-shrink-0 mx-4 mt-4 mb-3 rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(220,38,38,0.22) 0%, rgba(180,20,20,0.10) 60%, rgba(0,0,0,0) 100%)",
          border: "1px solid rgba(220,38,38,0.30)",
        }}
      >
        {/* Skull decorativo semitransparente */}
        <img
          src="/rlcskull.webp"
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none select-none"
          style={{
            right: "-28px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "170px",
            height: "170px",
            objectFit: "contain",
            opacity: 0.15,
            filter: "grayscale(1) brightness(1.5)",
          }}
        />
        {/* Decorative glow */}
        <div
          className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: "rgba(220,38,38,0.15)", filter: "blur(28px)" }}
        />
        <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "rgba(220,38,38,0.7)" }}>Saldo disponible</p>
        <div className="flex items-center gap-3">
          <RLCIcon size={40} />
          <div>
            {isLoading ? (
              <div className="w-24 h-8 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
            ) : (
              <p className="text-4xl font-black font-mono leading-none" style={{ color: "#ef4444" }}>
                {balance.toLocaleString()}
              </p>
            )}
            <p className="text-xs font-mono mt-1" style={{ color: "rgba(220,38,38,0.55)" }}>RLC Coins</p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="flex-shrink-0 px-4 mb-2 flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Historial</p>
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{transactions.length} movimientos</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
          ))
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.3 }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sin movimientos aún</p>
          </div>
        ) : (
          transactions.map((tx: any) => {
            const cfg = TX_TYPE_CONFIG[tx.type] ?? { label: tx.type, icon: <Coins className="w-4 h-4" />, color: "#FACC15", sign: "+" };
            const isPositive = tx.amount > 0;
            const amountColor = isPositive ? "#22c55e" : "#ef4444";
            const date = new Date(tx.createdAt);
            const dateStr = date.toLocaleDateString("es", { day: "2-digit", month: "short" });
            const timeStr = date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"}
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
                >
                  {cfg.icon}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {tx.description || cfg.label}
                  </p>
                  <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    {dateStr} · {timeStr}
                  </p>
                </div>
                {/* Amount */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-black font-mono flex items-center gap-1 justify-end" style={{ color: amountColor }}>
                    {isPositive ? "+" : ""}{tx.amount.toLocaleString()} <RLCIcon size={13} />
                  </p>
                  <p className="text-xs font-mono" style={{ color: "rgba(250,204,21,0.5)" }}>
                    {tx.balanceAfter?.toLocaleString()} <span style={{ fontSize: 9 }}>RLC</span>
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Link to full wallet page */}
      <div className="flex-shrink-0 px-4 pb-4">
        <a
          href="/wallet"
          className="block w-full text-center py-2.5 rounded-xl text-xs font-mono font-bold tracking-widest transition-colors mt-3"
          style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.20)", color: "#FFD700" }}
        >
          VER HISTORIAL COMPLETO →
        </a>
      </div>
    </div>
  );
}

// ─── Main RightPanel ──────────────────────────────────────────────────────────
export default function RightPanel({ open, activeTab, onTabChange, onClose }: RightPanelProps) {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  const isPremium = user?.role === "premium" || user?.role === "admin" || user?.role === "super_admin";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Detectar si es móvil para ajustar el top del panel
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { data: wallet } = trpc.auth.wallet.useQuery(undefined, { enabled: isAuthenticated });
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5_000,
  });
  const unreadCount = unreadData?.count ?? 0;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const tabs: { id: RightPanelTab; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: "notifications", icon: <Bell className="w-5 h-5" />, label: "Notificaciones", badge: unreadCount },
    { id: "rewards",       icon: <Gift className="w-5 h-5" />,      label: "Recompensas" },
    { id: "wishlist",      icon: <Bookmark className="w-5 h-5" />,  label: "Favoritos" },
    { id: "wallet",        icon: <Wallet className="w-5 h-5" />,    label: "Billetera" },
  ];

  return (
    <>
      {/* Backdrop — z-index por encima del mobile navbar (z-[100001]) */}
      <div
        className="fixed inset-0 transition-opacity duration-300"
        style={{
          zIndex: 200000,
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed flex flex-col"
        style={{
          zIndex: 200001,
          /* Móvil: panel debajo del header (56px + safe-area), ocupa casi toda la pantalla.
             Desktop: panel flotante en la esquina superior derecha. */
          top: isMobile ? "calc(env(safe-area-inset-top, 0px) + 58px)" : "12px",
          right: isMobile ? "0" : "12px",
          bottom: isMobile ? "0" : "12px",
          left: isMobile ? "0" : "auto",
          width: isMobile ? "100%" : "clamp(300px, 360px, calc(100vw - 24px))",
          background: "#1e1e24",
          border: isMobile ? "none" : "1px solid rgba(255,255,255,0.09)",
          borderRadius: isMobile ? "16px 16px 0 0" : "16px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
          transform: open
            ? "translate(0, 0)"
            : isMobile
              ? "translateY(100%)"
              : "translateX(calc(100% + 24px))",
          transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        {/* Tab bar */}
        <div
          className="flex items-center px-3 pt-3 pb-0 gap-1 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150 flex-shrink-0"
              style={{
                background: activeTab === tab.id ? "rgba(255,255,255,0.1)" : "transparent",
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
              }}
              title={tab.label}
              onMouseEnter={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile header */}
        {isAuthenticated && user && (
          <div
            className="flex-shrink-0 px-5 py-5 text-center"
            style={{
              background: "linear-gradient(180deg, rgba(220,38,38,0.08) 0%, transparent 100%)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Avatar */}
            <div className="relative inline-block mb-1.5">
              <UserAvatar
                avatar={user.avatar}
                name={user.name}
                activeFrameImage={(user as any).activeFrameImage}
                size={80}
                ringColor={isAdmin ? "#FFD700" : isPremium ? "var(--accent-red)" : "rgba(255,255,255,0.15)"}
              />
              {/* Online dot — posicionado sobre el borde inferior-derecho del círculo de la foto (inset 16.7%) */}
              <span
                className="absolute w-3.5 h-3.5 rounded-full border-2"
                style={{
                  background: "#22c55e",
                  borderColor: "#1a1a1f",
                  zIndex: 20,
                  bottom: "18%",
                  right: "14%",
                }}
              />
            </div>

            {/* Name & status */}
            <p className="font-orbitron font-bold text-base text-white truncate">{(user as any).nickname ?? user.name ?? "Usuario"}</p>
            <p className="text-xs mt-0.5 font-mono" style={{ color: "#22c55e" }}>En línea</p>

            {/* Coins + admin badge */}
            <div className="flex items-center justify-center gap-2 mt-2">
              {isAdmin && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
                  style={{ background: "rgba(234,179,8,0.15)", color: "#FFD700", border: "1px solid rgba(234,179,8,0.3)" }}
                >
                  ADMIN
                </span>
              )}
              {wallet && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold" style={{ background: "rgba(234,179,8,0.1)", color: "#FACC15", border: "1px solid rgba(234,179,8,0.2)" }}>
                  <Coins className="w-3 h-3" />
                  {wallet.balance.toLocaleString()} RLC
                </span>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                onClick={() => { onClose(); navigate(`/profile/${user.id}`); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold font-mono tracking-wide transition-all"
                style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"}
              >
                Mi perfil
              </button>
              <button
                onClick={() => { onClose(); navigate("/settings"); }}
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                title="Configuración"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => { onClose(); logout(); }}
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-red)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "notifications" && <NotificationsTab onClose={onClose} />}
          {activeTab === "rewards"       && <RewardsTab onClose={onClose} />}
          {activeTab === "wishlist"      && <WishlistTab onClose={onClose} />}
          {activeTab === "wallet"        && <WalletTab />}
        </div>
      </div>

      <style>{`
        @keyframes rpSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
