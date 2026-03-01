import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Home, Trophy, TrendingUp, Newspaper, Radio, Coins,
  Users, Plus, ClipboardList, Settings, LogOut, Menu, X,
  Shield, Crown, Swords, Star, ShoppingBag, Sparkles, Gift, Megaphone
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SidebarNotificationBell, TopbarNotificationBell } from "./NotificationBell";

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
        { label: "Apuestas", href: "/betting", icon: Coins, requiresAuth: true },
      ],
    },
    {
      title: "TIENDA",
      items: [
        { label: "Tienda", href: "/shop", icon: ShoppingBag },
        { label: "Recompensas", href: "/rewards", icon: Gift },
        { label: "Publicidad", href: "/ads", icon: Megaphone },
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
  const [location] = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // Ref to the profile card — used by SidebarNotificationBell as anchor
  const profileCardRef = useRef<HTMLDivElement>(null);

  const isPremium = user?.role === "premium" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const { data: pendingCount } = trpc.registrations.pendingCount.useQuery(undefined, {
    enabled: isPremium,
  });
  const { data: liveData } = trpc.streams.liveCount.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

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
            <span className="text-zinc-500 text-xs ml-1 font-normal">CIRCLE</span>
          </span>
        </Link>
      </div>

      {/* ── Profile card ── position:relative + overflow:visible so the
           notification dropdown can escape and align to the card's full width */}
      {isAuthenticated && user && (
        <div
          ref={profileCardRef}
          className="mx-3 mb-4 px-3 py-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30"
          style={{ position: "relative", overflow: "visible" }}
        >
          <Link href={`/profile/${user.id}`} onClick={() => setMobileOpen(false)}>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
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
                <span className={`text-xs font-mono ${isAdmin ? "text-yellow-400" : isPremium ? "text-red-400" : "text-zinc-500"}`}>
                  {isAdmin ? "ADMIN" : isPremium ? "PREMIUM" : "FREE"}
                </span>
              </div>
            </div>
          </Link>

          {wallet && (
            <div className="mt-2 flex items-center justify-between pt-2 border-t border-zinc-700/30">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span className="font-orbitron font-bold text-sm text-yellow-400">{wallet.balance.toLocaleString()}</span>
                <span className="text-xs text-zinc-600 font-mono">RLC</span>
              </div>
              {/* Bell button + dropdown anchored to this card */}
              <SidebarNotificationBell cardRef={profileCardRef} />
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 pb-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-mono text-zinc-600 tracking-widest px-2 mb-1.5">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                if (item.requiresAuth && !isAuthenticated) return null;
                if (item.requiresPremium && !isPremium) return null;
                if (item.requiresAdmin && !isAdmin) return null;

                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group relative ${
                      active
                        ? "bg-red-500/10 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                    }`}>
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-500 rounded-r-full" />
                      )}
                      <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                      <span className="font-rajdhani font-semibold text-sm flex-1">{item.label}</span>
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
            <p className="text-xs font-mono text-zinc-600 tracking-widest px-2 mb-1.5">CUENTA</p>
            <a href={getLoginUrl()} onClick={() => setMobileOpen(false)}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all duration-150">
                <Shield className="w-4 h-4 text-zinc-500" />
                <span className="font-rajdhani font-semibold text-sm">Iniciar Sesión</span>
              </div>
            </a>
          </div>
        )}
      </nav>

      {/* Bottom: logout + version */}
      <div className="px-3 pb-5 pt-2 border-t border-zinc-800/50 mt-auto">
        {isAuthenticated && (
          <>
            <Link href="/settings" onClick={() => setMobileOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group mb-1 ${
                location === "/settings" ? "bg-red-500/10 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}>
                <Settings className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  location === "/settings" ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`} />
                <span className="font-rajdhani font-semibold text-sm">Configuración</span>
              </div>
            </Link>
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150 group"
            >
              <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
              <span className="font-rajdhani font-semibold text-sm">Cerrar sesión</span>
            </button>
          </>
        )}
        <p className="text-center text-xs text-zinc-700 font-mono mt-3">Red Level Circle v2.0</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-zinc-950 border-r border-zinc-800/50 flex-col fixed h-full z-40 overflow-visible">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-zinc-800/50 z-50 md:hidden transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50 z-30 flex items-center justify-between px-4 md:hidden">
        <span className="font-orbitron font-black text-base tracking-widest">
          <span className="text-red-500">RED</span><span className="text-white">LEVEL</span>
        </span>
        <div className="flex items-center gap-1">
          {isAuthenticated && <TopbarNotificationBell />}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-60 min-h-screen pt-14 md:pt-0 overflow-x-hidden min-w-0">
        {children}
      </main>
    </div>
  );
}
