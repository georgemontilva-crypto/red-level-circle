import { useState, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Home, Trophy, TrendingUp, Newspaper, Radio, Coins,
  Users, Plus, ClipboardList, Settings, LogOut, Menu, X, Bell,
  Shield, Crown, Swords, Star, ShoppingBag, Sparkles, Gift, Megaphone, Handshake,
  Bookmark, ShoppingCart, Store, LayoutGrid, Wallet,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TopNav } from "./TopNav";
import RightPanel, { type RightPanelTab } from "./RightPanel";
import PageContainer from "./PageContainer";
import { UserAvatar } from "./UserAvatar";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  requiresAuth?: boolean;
  requiresPremium?: boolean;
  requiresAdmin?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function buildSections(isPremium: boolean, isAdmin: boolean, pendingCount?: number, liveCount?: number): NavSection[] {
  const sections: NavSection[] = [
    {
      title: "GENERAL",
      items: [
        { label: "Inicio", href: "/", icon: Home },
        { label: "Panel", href: "/dashboard", icon: TrendingUp, requiresAuth: true },
      ],
    },
    {
      title: "TORNEOS",
      items: [
        { label: "Torneos", href: "/tournaments", icon: Trophy },
        { label: "Ranking", href: "/ranking", icon: Star },
        { label: "En Vivo", href: "/streams", icon: Radio, badge: liveCount ?? 0 },
      ],
    },
    {
      title: "COMUNIDAD",
      items: [
        { label: "Comunidad", href: "/community", icon: Users },
        { label: "Equipos", href: "/teams", icon: Swords },
        { label: "Creadores", href: "/creators", icon: Crown },
        { label: "Noticias", href: "/news", icon: Newspaper },
        { label: "Aliados", href: "/allies", icon: Handshake },
        { label: "Apuestas", href: "/betting", icon: Coins, requiresAuth: true },
      ],
    },
    {
      title: "TIENDA",
      items: [
        { label: "Tienda", href: "/shop", icon: ShoppingBag },
        { label: "Recompensas", href: "/rewards", icon: Gift },
        { label: "Mi Galería", href: "/gallery", icon: Sparkles, requiresAuth: true },
      ],
    },
  ];

  if (isPremium) {
    sections.push({
      title: "CREADOR",
      items: [
        { label: "Mis Torneos", href: "/dashboard/tournaments", icon: Swords },
        { label: "Crear Torneo", href: "/dashboard/create-tournament", icon: Plus },
        {
          label: "Inscripciones",
          href: "/dashboard/registrations",
          icon: ClipboardList,
          badge: pendingCount && pendingCount > 0 ? pendingCount : undefined,
        },
        { label: "Mis Equipos", href: "/dashboard/teams", icon: Users },
      ],
    });
  }

  if (isAdmin) {
    sections.push({
      title: "ADMINISTRACIÓN",
      items: [
        { label: "Administración", href: "/admin", icon: Settings },
      ],
    });
  }

  return sections;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RightPanelTab>("notifications");
  const [location] = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();

  const openPanel = useCallback((tab: RightPanelTab) => {
    setActiveTab(tab);
    setPanelOpen(true);
  }, []);

  const [mobileGridOpen, setMobileGridOpen] = useState(false);
  const mobileGridRef = useRef<HTMLDivElement>(null);

  const isPremium = user?.role === "premium" || user?.role === "admin" || user?.role === "super_admin";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const { data: pendingCount } = trpc.registrations.pendingCount.useQuery(undefined, { enabled: isPremium });
  const { data: liveData } = trpc.streams.liveCount.useQuery(undefined, { refetchInterval: 60_000, staleTime: 30_000 });
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 5_000 });
  const unreadCount = unreadData?.count ?? 0;
  const { data: wallet } = trpc.auth.wallet.useQuery(undefined, { enabled: isAuthenticated });
  const { data: activeCosmetics } = trpc.cosmetics.myCosmetics.useQuery(undefined, { enabled: isAuthenticated });
  const { data: cartData } = trpc.shop.getCart.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 10000 });
  const cartCount = cartData?.items?.length ?? 0;
  const { data: wishlistData } = trpc.shop.getWishlist.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 10000 });
  const wishlistCount = wishlistData?.items?.length ?? 0;
  const sections = buildSections(isPremium, isAdmin, pendingCount ?? 0, liveData?.count ?? 0);
  const isActive = (href: string) => location === href;

  // ─── Desktop sidebar (grid de cuadritos, igual que móvil) ───────────────────
  const DesktopSidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header: logo */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <Link href="/">
          <img src="/logocompleto.webp" alt="Red Level Circle" className="h-8 w-auto object-contain cursor-pointer select-none" />
        </Link>
      </div>

      {/* Header usuario (si autenticado) */}
      {isAuthenticated && user && (
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <UserAvatar
            avatar={(user as any).avatar ?? null}
            name={(user as any).nickname ?? (user as any).name ?? null}
            size={36}
            containerSize={36}
            ringColor={isAdmin ? "#FFD700" : isPremium ? "var(--accent-red)" : "var(--border-main)"}
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
              {(user as any).nickname ?? user.name ?? "Usuario"}
            </p>
            {wallet && (
              <p className="text-xs font-mono" style={{ color: "rgba(220,38,38,0.8)" }}>
                ⬡ {wallet.balance ?? 0} RLC
              </p>
            )}
          </div>
        </div>
      )}

      {/* Grid de secciones */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {sections.map((section) => {
          const visibleItems = section.items.filter(item => {
            if (item.requiresAuth && !isAuthenticated) return false;
            if (item.requiresPremium && !isPremium) return false;
            if (item.requiresAdmin && !isAdmin) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title}>
              <p className="text-[10px] font-mono tracking-widest px-1 mb-2" style={{ color: "var(--text-muted)" }}>{section.title}</p>
              <div className="grid grid-cols-2 gap-2">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className="relative flex flex-col items-start justify-end px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 select-none"
                        style={{
                          background: active ? "rgba(220,38,38,0.18)" : "rgba(255,255,255,0.06)",
                          border: active ? "1px solid rgba(220,38,38,0.35)" : "1px solid rgba(255,255,255,0.07)",
                          minHeight: "72px",
                        }}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.10)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = active ? "rgba(220,38,38,0.18)" : "rgba(255,255,255,0.06)"; }}
                      >
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        )}
                        <item.icon
                          className="w-5 h-5 mb-1.5"
                          style={{ color: active ? "var(--accent-red)" : "var(--text-primary)" }}
                        />
                        <span
                          className="font-semibold text-xs leading-tight"
                          style={{ color: active ? "var(--accent-red)" : "var(--text-primary)" }}
                        >
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!isAuthenticated && !loading && (
          <div>
            <p className="text-[10px] font-mono tracking-widest px-1 mb-2" style={{ color: "var(--text-muted)" }}>CUENTA</p>
            <a href={getLoginUrl()}>
              <div
                className="flex flex-col items-start justify-end px-3 py-3 rounded-xl cursor-pointer transition-all duration-200"
                style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)", minHeight: "72px" }}
              >
                <Shield className="w-5 h-5 mb-1.5" style={{ color: "var(--accent-red)" }} />
                <span className="font-semibold text-xs" style={{ color: "var(--accent-red)" }}>Iniciar Sesión</span>
              </div>
            </a>
          </div>
        )}
      </nav>

      {/* Footer: configuración + cerrar sesión */}
      {isAuthenticated && (
        <div
          className="px-3 pb-4 pt-2 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex gap-2 mt-2">
            <Link href="/settings" className="flex-1">
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  background: location === "/settings" ? "rgba(220,38,38,0.18)" : "rgba(255,255,255,0.06)",
                  border: location === "/settings" ? "1px solid rgba(220,38,38,0.35)" : "1px solid rgba(255,255,255,0.07)",
                }}
                onMouseEnter={e => { if (location !== "/settings") (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.10)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = location === "/settings" ? "rgba(220,38,38,0.18)" : "rgba(255,255,255,0.06)"; }}
              >
                <Settings className="w-4 h-4 flex-shrink-0" style={{ color: location === "/settings" ? "var(--accent-red)" : "var(--text-muted)" }} />
                <span className="font-semibold text-xs" style={{ color: location === "/settings" ? "var(--accent-red)" : "var(--text-primary)" }}>Config.</span>
              </div>
            </Link>
            <button
              onClick={() => logout()}
              className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-left"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              <span className="font-semibold text-xs" style={{ color: "var(--text-muted)" }}>Salir</span>
            </button>
          </div>
          <p className="text-center text-[10px] font-mono mt-3" style={{ color: "var(--text-muted)" }}>Red Level Circle v2.0</p>
        </div>
      )}
    </div>
  );

  // ─── Mobile sidebar (grid de tarjetas cuadradas estilo Facebook) ─────────────
  const MobileSidebarContent = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Header del sidebar móvil: avatar + nombre */}
        {isAuthenticated && user ? (
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <UserAvatar
              avatar={(user as any).avatar ?? null}
              name={(user as any).nickname ?? (user as any).name ?? null}
              size={40}
              containerSize={40}
              ringColor={isAdmin ? "#FFD700" : isPremium ? "var(--accent-red)" : "var(--border-main)"}
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                {(user as any).nickname ?? user.name ?? "Usuario"}
              </p>
              {wallet && (
                <p className="text-xs font-mono" style={{ color: "var(--accent-gold, #f59e0b)" }}>
                  ⬡ {wallet.balance ?? 0} RLC
                </p>
              )}
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-full transition-colors flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <img src="/logocompleto.webp" alt="RLC" className="h-8 w-auto object-contain" />
            <button onClick={() => setMobileOpen(false)} className="p-2 rounded-full" style={{ color: "var(--text-muted)" }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Grid de tarjetas por sección */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {sections.map((section) => {
            const visibleItems = section.items.filter(item => {
              if (item.requiresAuth && !isAuthenticated) return false;
              if (item.requiresPremium && !isPremium) return false;
              if (item.requiresAdmin && !isAdmin) return false;
              return true;
            });
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title}>
                {/* Título de sección */}
                <p className="text-[10px] font-mono tracking-widest px-1 mb-2" style={{ color: "var(--text-muted)" }}>{section.title}</p>
                <div className="grid grid-cols-2 gap-2">
                  {visibleItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                        <div
                          className="relative flex flex-col items-start justify-end px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 select-none"
                          style={{
                            background: active ? "rgba(220,38,38,0.18)" : "rgba(255,255,255,0.06)",
                            border: active ? "1px solid rgba(220,38,38,0.35)" : "1px solid rgba(255,255,255,0.07)",
                            minHeight: "76px",
                          }}
                          onTouchStart={e => { (e.currentTarget as HTMLDivElement).style.background = active ? "rgba(220,38,38,0.25)" : "rgba(255,255,255,0.1)"; }}
                          onTouchEnd={e => { (e.currentTarget as HTMLDivElement).style.background = active ? "rgba(220,38,38,0.18)" : "rgba(255,255,255,0.06)"; }}
                        >
                          {/* Badge */}
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                              {item.badge > 99 ? "99+" : item.badge}
                            </span>
                          )}
                          {/* Icono */}
                          <item.icon
                            className="w-6 h-6 mb-1.5"
                            style={{ color: active ? "var(--accent-red)" : "var(--text-primary)" }}
                          />
                          {/* Label */}
                          <span
                            className="font-semibold text-xs leading-tight"
                            style={{ color: active ? "var(--accent-red)" : "var(--text-primary)" }}
                          >
                            {item.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Tarjeta de login si no está autenticado */}
          {!isAuthenticated && !loading && (
            <div>
              <p className="text-[10px] font-mono tracking-widest px-1 mb-2" style={{ color: "var(--text-muted)" }}>CUENTA</p>
              <a href={getLoginUrl()} onClick={() => setMobileOpen(false)}>
                <div
                  className="flex flex-col items-start justify-end px-3 py-3 rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    background: "rgba(220,38,38,0.12)",
                    border: "1px solid rgba(220,38,38,0.25)",
                    minHeight: "76px",
                  }}
                >
                  <Shield className="w-6 h-6 mb-1.5" style={{ color: "var(--accent-red)" }} />
                  <span className="font-semibold text-xs" style={{ color: "var(--accent-red)" }}>Iniciar Sesión</span>
                </div>
              </a>
            </div>
          )}
        </div>

        {/* Footer: configuración + cerrar sesión — fila horizontal compacta */}
        {isAuthenticated && (
          <div
            className="px-3 pb-safe pt-2 flex-shrink-0"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
            }}
          >
            <div className="flex gap-2 mt-2">
              <Link href="/gallery" onClick={() => setMobileOpen(false)} className="flex-1">
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    background: location === "/gallery" ? "rgba(220,38,38,0.18)" : "rgba(255,255,255,0.06)",
                    border: location === "/gallery" ? "1px solid rgba(220,38,38,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: location === "/gallery" ? "var(--accent-red)" : "var(--text-muted)" }} />
                  <span className="font-semibold text-xs" style={{ color: location === "/gallery" ? "var(--accent-red)" : "var(--text-primary)" }}>Mi Galería</span>
                </div>
              </Link>
              <Link href="/settings" onClick={() => setMobileOpen(false)} className="flex-1">
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    background: location === "/settings" ? "rgba(220,38,38,0.18)" : "rgba(255,255,255,0.06)",
                    border: location === "/settings" ? "1px solid rgba(220,38,38,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <Settings className="w-4 h-4 flex-shrink-0" style={{ color: location === "/settings" ? "var(--accent-red)" : "var(--text-muted)" }} />
                  <span className="font-semibold text-xs" style={{ color: location === "/settings" ? "var(--accent-red)" : "var(--text-primary)" }}>Configuración</span>
                </div>
              </Link>
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-left"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <span className="font-semibold text-xs" style={{ color: "var(--text-muted)" }}>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex overflow-x-clip" style={{ background: "var(--bg-main)", color: "var(--text-primary)" }}>

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col fixed h-full z-40 overflow-visible" style={{ background: "transparent" }}>
        <DesktopSidebarContent />
      </aside>

      {/* ── Mobile overlay ──────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[99999] md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}      {/* ── Mobile sidebar (grid de tarjetas) ────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 md:hidden transition-transform duration-300 ease-in-out`}
        style={{
          zIndex: 100000,
          width: "min(85vw, 340px)",
          height: "100dvh",
          background: "var(--bg-main)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Spacer para la status bar */}
        <div style={{ height: "env(safe-area-inset-top, 0px)", flexShrink: 0 }} />
        {/* MobileSidebarContent ocupa el resto — flex:1 + minHeight:0 es clave para que el scroll funcione */}
        <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <MobileSidebarContent />
        </div>
      </aside>     {/* ── Mobile top bar ──────────────────────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 backdrop-blur-md border-b z-[100001] flex flex-col md:hidden"
        style={{
          background: "rgba(14,14,16,0.92)",
          borderColor: "var(--border-main)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          WebkitBackdropFilter: "blur(12px)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="h-14 flex items-center justify-between px-3 gap-2">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-muted-foreground hover:text-white transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/">
              <img src="/logocompleto.webp" alt="Red Level Circle" className="h-8 w-auto object-contain" />
            </Link>
          </div>
          {/* Right: tienda, campana, grid(wishlist+regalo+carrito), avatar */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Tienda */}
            <Link href="/shop">
              <button className="relative p-2 text-muted-foreground hover:text-white transition-colors" title="Tienda">
                <Store className="w-5 h-5" />
              </button>
            </Link>

            {/* Billetera */}
            {isAuthenticated && (
              <button
                onClick={() => openPanel("wallet")}
                className="relative p-2 transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onTouchStart={e => (e.currentTarget as HTMLButtonElement).style.color = "#FACC15"}
                onTouchEnd={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"}
                title="Billetera"
              >
                <Wallet className="w-5 h-5" />
              </button>
            )}

            {/* Campana */}
            {isAuthenticated && (
              <button onClick={() => openPanel("notifications")} className="relative p-2 text-muted-foreground hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Grid button — abre RightPanel directamente */}
            {isAuthenticated && (
              <button
                onClick={() => openPanel("wishlist")}
                className="relative p-2 text-muted-foreground hover:text-white transition-colors"
                title="Más opciones"
              >
                <LayoutGrid className="w-5 h-5" />
                {(wishlistCount + cartCount) > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {wishlistCount + cartCount > 9 ? "9+" : wishlistCount + cartCount}
                  </span>
                )}
              </button>
            )}
            {isAuthenticated && user && (
              <Link href={`/profile/${user.id}`}>
                <div className="ml-1" style={{ overflow: "visible", display: "inline-flex" }}>
                  <UserAvatar
                    avatar={(user as any).avatar ?? null}
                    name={(user as any).nickname ?? (user as any).name ?? null}
                    size={32}
                    containerSize={32}
                  />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main
        className="flex-1 md:ml-60 min-h-screen overflow-x-clip min-w-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)" }}
        ref={(el) => {
          if (el) {
            const applyPadding = () => {
              el.style.paddingTop = window.innerWidth >= 768
                ? "100px"
                : `calc(env(safe-area-inset-top, 0px) + 56px)`;
            };
            applyPadding();
            window.addEventListener("resize", applyPadding);
          }
        }}
      >
        <TopNav />
        <PageContainer className="pt-0 pb-2 md:py-2">
          {children}
        </PageContainer>
      </main>

      {/* ── Right panel ─────────────────────────────────────────────────────── */}
      {isAuthenticated && (
        <RightPanel
          open={panelOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  );
}
