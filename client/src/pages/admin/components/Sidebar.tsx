import { Link, useLocation } from "wouter";
import {
  BarChart3, Layout, Trophy, Users, Coins, Shield,
  Newspaper, MapPin, Gamepad2, Star, Crown, Megaphone,
  Gift, Database, BadgeCheck, ChevronDown, ChevronRight,
  ShoppingBag, Swords, BarChart2, Flag, MessageSquareWarning
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  children?: { href: string; label: string; icon: any }[];
};

const nav: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: BarChart3,
  },
  {
    href: "/admin/content",
    label: "Contenido",
    icon: Layout,
    children: [
      { href: "/admin/content/banners", label: "Banners", icon: Layout },
      { href: "/admin/content/news", label: "Noticias", icon: Newspaper },
      { href: "/admin/content/allies", label: "Aliados", icon: MapPin },
      { href: "/admin/content/games", label: "Juegos", icon: Gamepad2 },
    ],
  },
  {
    href: "/admin/competitive",
    label: "Competitivo",
    icon: Trophy,
    children: [
      { href: "/admin/competitive/tournaments", label: "Torneos", icon: Trophy },
      { href: "/admin/competitive/teams", label: "Equipos", icon: Shield },
      { href: "/admin/competitive/rankings", label: "Rankings", icon: BarChart2 },
    ],
  },
  {
    href: "/admin/community",
    label: "Comunidad",
    icon: Users,
    children: [
      { href: "/admin/community/users", label: "Usuarios", icon: Users },
      { href: "/admin/community/creators", label: "Creadores", icon: Crown },
      { href: "/admin/community/streams", label: "Streams", icon: Megaphone },
      { href: "/admin/community/reports", label: "Reportes", icon: MessageSquareWarning },
    ],
  },
  {
    href: "/admin/monetization",
    label: "Monetización",
    icon: Coins,
    children: [
      { href: "/admin/monetization/bets", label: "Apuestas", icon: Swords },
      { href: "/admin/monetization/shop", label: "Tienda", icon: ShoppingBag },
      { href: "/admin/monetization/cosmetics", label: "Cosméticos", icon: Star },
      { href: "/admin/monetization/rlc", label: "RLC Coins", icon: Coins },
      { href: "/admin/monetization/rewards", label: "Recompensas", icon: Gift },
    ],
  },
  {
    href: "/admin/system",
    label: "Sistema",
    icon: Shield,
    children: [
      { href: "/admin/system/verifications", label: "Verificaciones", icon: BadgeCheck },
      { href: "/admin/system/audit", label: "Auditoría", icon: Database },
      { href: "/admin/system/roles", label: "Roles", icon: Flag },
    ],
  },
];

function NavGroup({ item }: { item: NavItem }) {
  const [location] = useLocation();
  const isActive = location === item.href || (item.children && item.children.some(c => location.startsWith(c.href)));
  const [open, setOpen] = useState(!!isActive);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          location === item.href
            ? "bg-red-600 text-white"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }`}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          isActive ? "text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }`}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1 border-l border-zinc-800 pl-3">
          {item.children.map(child => (
            <Link
              key={child.href}
              href={child.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                location.startsWith(child.href)
                  ? "bg-red-600/20 text-red-400 border border-red-600/30"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <child.icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 bg-zinc-950 border-r border-white/5 flex flex-col h-full min-h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-orbitron text-sm font-bold text-white">RED LEVEL</p>
            <p className="text-xs text-zinc-500 font-rajdhani">ADMIN PANEL</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(item => (
          <NavGroup key={item.href} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <Link href="/" className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          Volver al sitio
        </Link>
      </div>
    </aside>
  );
}
