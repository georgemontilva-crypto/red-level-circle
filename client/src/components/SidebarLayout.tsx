import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Home, Trophy, TrendingUp, Newspaper, Radio, Coins,
  Users, Plus, ClipboardList, Settings, LogOut, Menu, X, Bell,
  Shield, Crown, Swords, Star, ShoppingBag, Sparkles, Gift, Megaphone, Handshake,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TopNav } from "./TopNav";
import RightPanel, { type RightPanelTab } from "./RightPanel";
import PageContainer from "./PageContainer";

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

  const isPremium = user?.role === "premium" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const { data: pendingCount } = trpc.registrations.pendingCount.useQuery(undefined, {
    enabled: isPremium,
  });
  const { data: liveData } = trpc.streams.liveCount.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5_000,
  });
  const unreadCount = unreadData?.count ?? 0;

  const { data: wallet } = trpc.auth.wallet.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: activeCosmetics } = trpc.cosmetics.myCosmetics.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const activeFrame = activeCosmetics?.find((c) => c.isEquipped && c.type === "frame");

  const sections = buildSections(isPremium, isAdmin, pendingCount ?? 0, liveData?.count ?? 0);

  const isActive = (href: string) => location === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <span className="font-orbitron font-black text-xl tracking-widest cursor-pointer select-none">
            <span className="text-red-500">RED</span>
            <span className="text-white">LEVEL</span>
            <span className="text-muted-foreground text-xs ml-1 font-normal">CIRCLE</span>
          </span>
        </Link>
      </div>

      {/* Profile row — no card box, just avatar + name + role badge */}
      {isAuthenticated && user && (
        <Link href={`/profile/${user.id}`} onClick={() => setMobileOpen(false)}>
          <div className="mx-3 mb-3 px-3 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-150"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
          >
            <div className="relative w-9 h-9 flex-shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name ?? ""} className="w-full h-full object-cover" />
                ) : (
                  isAdmin ? <Crown className="w-4 h-4 text-yellow-400" /> : <Shield className="w-4 h-4 text-red-400" />
                )}
              </div>
              {(activeFrame as any)?.frameImage && (
                <img
                  src={(activeFrame as any).frameImage}
                  alt="frame"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{ zIndex: 2 }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-rajdhani font-bold text-sm text-white truncate leading-tight">{user.name ?? "Usuario"}</p>
              {isAdmin && (
                <span className="text-xs font-mono text-yellow-400">ADMIN</span>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 pb-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-mono tracking-widest px-2 mb-1.5" style={{ color: "var(--text-muted)" }}>{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                if (item.requiresAuth && !isAuthenticated) return null;
                if (item.requiresPremium && !isPremium) return null;
                if (item.requiresAdmin && !isAdmin) return null;

                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative"
                      style={{
                        background: active ? "var(--bg-hover)" : "transparent",
                        color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)"; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-500 rounded-r-full" />
                      )}
                      <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors`} style={{ color: active ? "var(--accent-red)" : "var(--text-muted)" }} />
                      <span className="font-semibold text-sm flex-1" style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-red-600 text-white text-xs font-mono px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {!isAuthenticated && !loading && (
          <div className="mt-2">
            <p className="text-xs font-mono tracking-widest px-2 mb-1.5" style={{ color: "var(--text-muted)" }}>CUENTA</p>
            <a href={getLoginUrl()} onClick={() => setMobileOpen(false)}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150" style={{ color: "var(--text-secondary)" }}>
                <Shield className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <span className="font-rajdhani font-semibold text-sm">Iniciar Sesión</span>
              </div>
            </a>
          </div>
        )}
      </nav>

      {/* Bottom: logout + version */}
      <div className="px-3 pb-5 pt-2 mt-auto">
        {isAuthenticated && (
          <>
            <Link href="/settings" onClick={() => setMobileOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group mb-1`} style={{ color: location === "/settings" ? "var(--text-primary)" : "var(--text-secondary)" }}>
                <Settings className="w-4 h-4 flex-shrink-0 transition-colors" style={{ color: location === "/settings" ? "var(--accent-red)" : "var(--text-muted)" }} />
                <span className="font-semibold text-sm">Configuración</span>
              </div>
            </Link>
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group"
              style={{ color: "var(--text-muted)" }}
            >
              <LogOut className="w-4 h-4 transition-colors" />
              <span className="font-semibold text-sm">Cerrar sesión</span>
            </button>
          </>
        )}
        <p className="text-center text-xs font-mono mt-3" style={{ color: "var(--text-muted)" }}>Red Level Circle v2.0</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ background: "var(--bg-main)", color: "var(--text-primary)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col fixed h-full z-40 overflow-visible" style={{ background: "transparent" }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/70 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 md:hidden transition-transform duration-300 ease-in-out border-r ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} style={{ background: "var(--bg-main)", borderColor: "var(--border-main)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 backdrop-blur-md border-b z-30 flex items-center justify-between px-4 md:hidden" style={{ background: "rgba(14,14,16,0.92)", borderColor: "var(--border-main)" }}>
        <span className="font-orbitron font-black text-base tracking-widest">
          <span className="text-red-500">RED</span><span className="text-white">LEVEL</span>
        </span>
        <div className="flex items-center gap-1">
          {isAuthenticated && (
            <button
              onClick={() => openPanel("notifications")}
              className="relative p-2 text-muted-foreground hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-muted-foreground hover:text-white transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main content */}
      {/* TopNav is fixed, so we need pt-14 on desktop to push content below it */}
      <main className="flex-1 md:ml-60 min-h-screen overflow-x-hidden min-w-0" style={{ paddingTop: "100px" }}>
        <TopNav />
        <PageContainer className="py-2">
          {children}
        </PageContainer>
      </main>

      {/* Right panel — shared across mobile and desktop */}
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
