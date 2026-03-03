import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Home, Trophy, TrendingUp, Newspaper, Radio, Coins,
  Users, Plus, ClipboardList, Settings, LogOut, Menu, X,
  Shield, Crown, Swords, Star, ShoppingBag, Sparkles, Gift, Megaphone, Handshake,
  FileText, ChevronDown, ChevronUp
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SidebarNotificationBell, TopbarNotificationBell } from "./NotificationBell";
import { TopNav } from "./TopNav";
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

const LEGAL_LINKS = [
  { label: "Términos y Condiciones", href: "/legal/terminos" },
  { label: "Privacidad", href: "/legal/privacidad" },
  { label: "Cookies", href: "/legal/cookies" },
  { label: "Tienda y Recompensas", href: "/legal/tienda" },
  { label: "Alianzas", href: "/legal/aliados" },
  { label: "Devoluciones", href: "/legal/devoluciones" },
];

function LegalesDropdown({ onNavigate }: { onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        <FileText className="w-4 h-4 flex-shrink-0" />
        <span className="font-semibold text-sm flex-1 text-left">Legales</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div
          className="mt-1 mx-1 rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => { onNavigate(); setOpen(false); }}>
              <div
                className="px-4 py-2.5 text-xs font-mono tracking-wide cursor-pointer transition-all duration-150"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(220,38,38,0.08)";
                  (e.currentTarget as HTMLDivElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  (e.currentTarget as HTMLDivElement).style.color = "var(--text-muted)";
                }}
              >
                {link.label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
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
            <span className="text-muted-foreground text-xs ml-1 font-normal">CIRCLE</span>
          </span>
        </Link>
      </div>

      {/* ── Profile card ── position:relative + overflow:visible so the
           notification dropdown can escape and align to the card's full width */}
      {isAuthenticated && user && (
        <div
          ref={profileCardRef}
          className="mx-3 mb-4 px-3 py-3 rounded-xl"
          style={{ background: "var(--bg-card)", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", position: "relative", overflow: "visible" }}
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
                <span className={`text-xs font-mono ${isAdmin ? "text-yellow-400" : isPremium ? "text-red-400" : "text-muted-foreground"}`}>
                  {isAdmin ? "ADMIN" : isPremium ? "PREMIUM" : "FREE"}
                </span>
              </div>
            </div>
          </Link>

          {wallet && (
              <div className="mt-2 flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span className="font-orbitron font-bold text-sm text-yellow-400">{wallet.balance.toLocaleString()}</span>
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>RLC</span>
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
        {/* Legales dropdown */}
        <LegalesDropdown onNavigate={() => setMobileOpen(false)} />

        <p className="text-center text-xs font-mono mt-3" style={{ color: "var(--text-muted)" }}>Red Level Circle v2.0</p>
        <p className="text-center text-xs font-mono mt-1" style={{ color: "var(--text-muted)", opacity: 0.5 }}>© 2026 Red Level Circle.<br />Todos los derechos reservados.</p>
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
          {isAuthenticated && <TopbarNotificationBell />}
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
    </div>
  );
}
