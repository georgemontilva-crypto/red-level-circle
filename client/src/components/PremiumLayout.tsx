import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Trophy,
  Users,
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  LogOut,
  ChevronRight,
  Swords,
  Crown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  premiumOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Torneos", href: "/tournaments", icon: <Trophy size={18} /> },
  { label: "Mis Equipos", href: "/my-teams", icon: <Users size={18} /> },
  { label: "Crear Torneo", href: "/dashboard/create-tournament", icon: <PlusCircle size={18} />, premiumOnly: true },
  { label: "Mis Torneos", href: "/dashboard/my-tournaments", icon: <Swords size={18} />, premiumOnly: true },
  { label: "Inscripciones", href: "/dashboard/registrations", icon: <ClipboardList size={18} />, premiumOnly: true },
];

interface PremiumLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function PremiumLayout({ children, title }: PremiumLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  const isPremium = user?.role === "premium" || user?.role === "admin";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: "oklch(0.20 0.01 0)" }}>
        <Link href="/">
          <span className="font-display text-lg tracking-widest cursor-pointer">
            <span className="neon-text">RED</span>
            <span className="text-foreground">LEVEL</span>
            <span className="text-muted-foreground text-xs ml-1">CIRCLE</span>
          </span>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b" style={{ borderColor: "oklch(0.20 0.01 0)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: "oklch(0.55 0.22 25 / 0.2)",
              border: "1px solid oklch(0.55 0.22 25 / 0.5)",
              color: "oklch(0.70 0.28 25)",
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate font-display tracking-wide">
              {user?.name ?? "Usuario"}
            </p>
            <div className="flex items-center gap-1">
              {isPremium ? (
                <>
                  <Crown size={10} className="neon-text-sm" />
                  <span className="text-xs neon-text-sm font-display tracking-wider">
                    {user?.role === "admin" ? "ADMIN" : "PREMIUM"}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground font-display tracking-wider">ESTÁNDAR</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.premiumOnly && !isPremium) return null;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group"
                style={
                  isActive
                    ? {
                        background: "oklch(0.55 0.22 25 / 0.15)",
                        borderLeft: "3px solid oklch(0.55 0.22 25)",
                        paddingLeft: "calc(0.75rem - 3px)",
                        color: "oklch(0.70 0.28 25)",
                      }
                    : {
                        color: "oklch(0.65 0.005 0)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "oklch(0.55 0.22 25 / 0.08)";
                    e.currentTarget.style.color = "oklch(0.85 0.005 0)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "oklch(0.65 0.005 0)";
                  }
                }}
              >
                <span style={isActive ? { color: "oklch(0.70 0.28 25)" } : {}}>
                  {item.icon}
                </span>
                <span className="font-display text-sm tracking-wider flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} style={{ color: "oklch(0.55 0.22 25)" }} />}
              </div>
            </Link>
          );
        })}

        {/* Upgrade prompt for non-premium */}
        {!isPremium && (
          <div
            className="mt-4 mx-1 p-3 rounded-lg"
            style={{
              background: "oklch(0.55 0.22 25 / 0.08)",
              border: "1px solid oklch(0.55 0.22 25 / 0.3)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Crown size={14} style={{ color: "oklch(0.65 0.22 25)" }} />
              <span className="text-xs font-display tracking-wider" style={{ color: "oklch(0.65 0.22 25)" }}>
                PREMIUM
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              Crea y gestiona tus propios torneos
            </p>
            <Link href="/upgrade">
              <div
                className="text-xs font-display tracking-wider text-center py-1.5 rounded cursor-pointer transition-all duration-200"
                style={{
                  background: "oklch(0.55 0.22 25)",
                  color: "oklch(0.98 0 0)",
                }}
              >
                MEJORAR PLAN
              </div>
            </Link>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "oklch(0.20 0.01 0)" }}>
        <button
          onClick={() => logoutMutation.mutate()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
          style={{ color: "oklch(0.50 0.005 0)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "oklch(0.55 0.22 25 / 0.08)";
            e.currentTarget.style.color = "oklch(0.65 0.22 25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "oklch(0.50 0.005 0)";
          }}
        >
          <LogOut size={18} />
          <span className="font-display text-sm tracking-wider">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30"
        style={{
          background: "oklch(0.09 0.005 0)",
          borderRight: "1px solid oklch(0.20 0.01 0)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70" />
          <aside
            className="relative w-64 flex flex-col z-50"
            style={{
              background: "oklch(0.09 0.005 0)",
              borderRight: "1px solid oklch(0.20 0.01 0)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
          style={{
            background: "oklch(0.07 0.005 0 / 0.95)",
            borderBottom: "1px solid oklch(0.20 0.01 0)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            {title && (
              <h1 className="font-display text-lg font-bold tracking-wider text-foreground">
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: "oklch(0.55 0.22 25 / 0.2)",
                border: "1px solid oklch(0.55 0.22 25 / 0.5)",
                color: "oklch(0.70 0.28 25)",
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
