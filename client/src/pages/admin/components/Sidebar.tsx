import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, CheckSquare, Flag, Crown, Handshake, BadgeCheck,
  Trophy, Shield, BarChart2, Swords, Clapperboard,
  Users, Radio, MessageSquareWarning,
  Layout, Newspaper, Image, Megaphone, Gamepad2,
  Coins, ShoppingBag, Star,
  Settings, Database, ChevronLeft, ChevronDown, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

// ─── Nav definition ───────────────────────────────────────────────────────────
type Child = { href: string; label: string; icon: any };
type NavItem = {
  href: string;
  label: string;
  icon: any;
  badgeKey?: "approvals";
  children?: Child[];
};

const nav: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/approvals",
    label: "Aprobaciones",
    icon: CheckSquare,
    badgeKey: "approvals",
    children: [
      { href: "/admin/system/role-requests",  label: "Solicitudes de Rol", icon: Flag },
      { href: "/admin/community/creators",    label: "Creadores",          icon: Crown },
      { href: "/admin/content/allies",        label: "Aliados",            icon: Handshake },
      { href: "/admin/system/verifications",  label: "Verificaciones",     icon: BadgeCheck },
    ],
  },
  {
    href: "/admin/competitive",
    label: "Torneos",
    icon: Trophy,
    children: [
      { href: "/admin/competitive/tournaments", label: "Torneos",  icon: Trophy },
      { href: "/admin/competitive/teams",       label: "Equipos",  icon: Shield },
      { href: "/admin/competitive/rankings",    label: "Rankings", icon: BarChart2 },
    ],
  },
  {
    href: "/admin/missions",
    label: "Misiones",
    icon: Swords,
    children: [
      { href: "/admin/competitive/missions",         label: "Misiones Usuarios",   icon: Swords },
      { href: "/admin/competitive/creator-missions", label: "Misiones Creadores",  icon: Clapperboard },
    ],
  },
  {
    href: "/admin/community",
    label: "Comunidad",
    icon: Users,
    children: [
      { href: "/admin/community/users",   label: "Usuarios",  icon: Users },
      { href: "/admin/community/streams", label: "Streams",   icon: Radio },
      { href: "/admin/community/reports", label: "Reportes",  icon: MessageSquareWarning },
    ],
  },
  {
    href: "/admin/content",
    label: "Contenido",
    icon: Layout,
    children: [
      { href: "/admin/content/news",    label: "Noticias",     icon: Newspaper },
      { href: "/admin/content/banners", label: "Banners",      icon: Image },
      { href: "/admin/content/ads",     label: "Publicidades", icon: Megaphone },
      { href: "/admin/content/games",   label: "Juegos",       icon: Gamepad2 },
    ],
  },
  {
    href: "/admin/monetization",
    label: "Economía",
    icon: Coins,
    children: [
      { href: "/admin/monetization/rlc",       label: "RLC Coins",   icon: Coins },
      { href: "/admin/monetization/bets",      label: "Apuestas",    icon: Swords },
      { href: "/admin/monetization/shop",      label: "Tienda",      icon: ShoppingBag },
      { href: "/admin/monetization/cosmetics", label: "Cosméticos",  icon: Star },
    ],
  },
  {
    href: "/admin/system",
    label: "Sistema",
    icon: Settings,
    children: [
      { href: "/admin/system/roles",  label: "Roles",         icon: Shield },
      { href: "/admin/system/audit",  label: "Auditoría",     icon: Database },
      { href: "/admin/system/config", label: "Configuración", icon: Settings },
    ],
  },
];

// ─── Pending badge data hook ──────────────────────────────────────────────────
function usePendingCounts() {
  const { data: roleReqs }  = trpc.roleRequests.adminList.useQuery({ status: "pending" });
  const { data: creators }  = trpc.creators.listPending.useQuery();
  const { data: allies }    = trpc.allies.adminList.useQuery();

  const roleCount     = roleReqs?.length ?? 0;
  const creatorCount  = (creators ?? []).filter((c: any) => c.status === "pending").length;
  const allyCount     = (allies ?? []).filter((a: any) => a.status === "pending").length;
  const total         = roleCount + creatorCount + allyCount;

  return { total };
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1"
      style={{ background: "#FF2D2D", color: "#fff" }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

// ─── Nav group ────────────────────────────────────────────────────────────────
function NavGroup({ item, pendingTotal }: { item: NavItem; pendingTotal: number }) {
  const [location] = useLocation();

  const isChildActive = item.children?.some(c => location.startsWith(c.href)) ?? false;
  const isSelfActive  = location === item.href;
  const isActive      = isSelfActive || isChildActive;

  const [open, setOpen] = useState(isActive);

  // No children — simple link
  if (!item.children) {
    return (
      <Link
        href={item.href}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
        style={{
          color:       isSelfActive ? "#fff"                      : "#a1a1aa",
          background:  isSelfActive ? "#1a1d24"                   : "transparent",
          borderLeft:  isSelfActive ? "2px solid #FF2D2D"         : "2px solid transparent",
        }}
      >
        <item.icon style={{ width: 15, height: 15, flexShrink: 0 }} />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <div>
      {/* Group header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
        style={{
          color:      isActive ? "#fff" : "#a1a1aa",
          background: isActive ? "#1a1d24" : "transparent",
          borderLeft: isActive ? "2px solid #FF2D2D" : "2px solid transparent",
        }}
        onMouseEnter={e => {
          if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={e => {
          if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <item.icon style={{ width: 15, height: 15, flexShrink: 0 }} />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badgeKey === "approvals" && <Badge count={pendingTotal} />}
        {open
          ? <ChevronDown style={{ width: 12, height: 12, flexShrink: 0 }} />
          : <ChevronRight style={{ width: 12, height: 12, flexShrink: 0 }} />
        }
      </button>

      {/* Children */}
      {open && (
        <div className="mt-0.5 space-y-0.5" style={{ paddingLeft: 12 }}>
          {item.children.map(child => {
            const childActive = location.startsWith(child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
                style={{
                  color:      childActive ? "#fff"        : "#71717a",
                  background: childActive ? "#1a1d24"     : "transparent",
                  borderLeft: childActive ? "2px solid #FF2D2D" : "2px solid transparent",
                  fontSize:   12,
                  fontWeight: childActive ? 600 : 400,
                }}
                onMouseEnter={e => {
                  if (!childActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={e => {
                  if (!childActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <child.icon style={{ width: 13, height: 13, flexShrink: 0 }} />
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const { total: pendingTotal } = usePendingCounts();

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-full min-h-screen"
      style={{ background: "#0d0f14", borderRight: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Logo */}
      <div className="px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#FF2D2D" }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-orbitron text-xs font-bold text-white tracking-widest">RED LEVEL</p>
            <p className="text-[10px] font-mono tracking-widest" style={{ color: "#FF2D2D" }}>ADMIN PANEL</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item, i) => {
          const prevHasChildren = i > 0 && !!nav[i - 1].children;
          const currHasChildren = !!item.children;
          const showSeparator = i > 0 && (prevHasChildren !== currHasChildren || (i > 0 && !nav[i - 1].children && item.children));

          return (
            <div key={item.href}>
              {showSeparator && (
                <div className="my-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />
              )}
              <NavGroup item={item} pendingTotal={pendingTotal} />
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
          style={{ color: "#71717a" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#d4d4d8"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#71717a"; }}
        >
          <ChevronLeft style={{ width: 13, height: 13 }} />
          Volver al sitio
        </Link>
      </div>
    </aside>
  );
}
