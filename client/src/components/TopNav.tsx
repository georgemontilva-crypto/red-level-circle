import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Bookmark, Gift, ShoppingCart, ChevronLeft, X, Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import RightPanel, { type RightPanelTab } from "./RightPanel";
import { UserAvatar } from "./UserAvatar";

export function TopNav() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, user } = useAuth();

  // Right panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RightPanelTab>("notifications");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isPremium = user?.role === "premium" || user?.role === "admin" || user?.role === "super_admin";

  // Cart count
  const { data: cartData } = trpc.shop.getCart.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });
  const cartCount = cartData?.items?.length ?? 0;

  // Wishlist count
  const { data: wishlistData } = trpc.shop.getWishlist.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });
  const wishlistCount = wishlistData?.items?.length ?? 0;

  // Unread notifications
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5_000,
  });
  const unreadCount = unreadData?.count ?? 0;

  function openPanel(tab: RightPanelTab) {
    setActiveTab(tab);
    setPanelOpen(true);
  }

  const navLinks = [
    { label: "Descubrir", href: "/creators" },
    { label: "Explorar", href: "/tournaments" },
    { label: "Noticias", href: "/news" },
    { label: "Aliados", href: "/allies" },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <>
      <div
        className="hidden md:flex items-center px-6 gap-5 fixed top-0 z-40"
        style={{ height: "100px", background: "#0f1115", border: "none", left: "15rem", right: 0 }}
      >
        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 flex-shrink-0"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          title="Atrás"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Search bar */}
        <div
          className="relative flex items-center rounded-full transition-all duration-200 flex-shrink-0"
          style={{
            background: searchFocused ? "var(--bg-hover)" : "var(--bg-card)",
            border: `1px solid ${searchFocused ? "rgba(255,255,255,0.15)" : "transparent"}`,
            width: searchFocused ? "340px" : "270px",
            height: "44px",
          }}
        >
          <Search className="w-5 h-5 ml-4 shrink-0" style={{ color: "var(--text-muted)" }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar en la tienda"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={e => {
              if (e.key === "Enter" && searchQuery.trim()) {
                navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                setSearchQuery("");
                searchRef.current?.blur();
              }
              if (e.key === "Escape") {
                setSearchQuery("");
                searchRef.current?.blur();
              }
            }}
            className="flex-1 bg-transparent text-base py-2 px-3 outline-none min-w-0"
            style={{ color: "var(--text-primary)" }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
              className="mr-3 p-0.5 rounded-full transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(link => {
            const active = location === link.href || location.startsWith(link.href + "/");
            return (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="relative px-5 text-base font-semibold transition-all duration-150 flex flex-col items-center justify-center gap-1.5"
                style={{ height: "100px", color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }}
              >
                <span>{link.label}</span>
                <span
                  className="h-0.5 w-full rounded-full transition-all duration-150"
                  style={{ background: active ? "var(--accent-red)" : "transparent" }}
                />
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action icons */}
        <div className="flex items-center gap-1">

          {/* Wishlist */}
          {isAuthenticated && (
            <button
              onClick={() => openPanel("wishlist")}
              className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-150"
              style={{
                color: panelOpen && activeTab === "wishlist" ? "var(--text-primary)" : "var(--text-secondary)",
                background: panelOpen && activeTab === "wishlist" ? "var(--bg-hover)" : "transparent",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                if (!(panelOpen && activeTab === "wishlist")) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }
              }}
              title="Mis favoritos"
            >
              <Bookmark className="w-6 h-6" />
              {wishlistCount > 0 && (
                <span
                  className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full text-[11px] font-bold flex items-center justify-center px-1"
                  style={{ background: "var(--accent-blue)", color: "#fff" }}
                >
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* Gifts / Rewards */}
          {isAuthenticated && (
            <button
              onClick={() => openPanel("rewards")}
              className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-150"
              style={{
                color: panelOpen && activeTab === "rewards" ? "var(--text-primary)" : "var(--text-secondary)",
                background: panelOpen && activeTab === "rewards" ? "var(--bg-hover)" : "transparent",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                if (!(panelOpen && activeTab === "rewards")) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }
              }}
              title="Recompensas"
            >
              <Gift className="w-6 h-6" />
            </button>
          )}

          {/* Notifications bell */}
          {isAuthenticated && (
            <button
              onClick={() => openPanel("notifications")}
              className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-150"
              style={{
                color: panelOpen && activeTab === "notifications" ? "var(--text-primary)" : "var(--text-secondary)",
                background: panelOpen && activeTab === "notifications" ? "var(--bg-hover)" : "transparent",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                if (!(panelOpen && activeTab === "notifications")) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }
              }}
              title="Notificaciones"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Cart */}
          <button
            onClick={() => navigate("/shop?tab=cart")}
            className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-150"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            }}
            title="Mi carrito"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full text-[11px] font-bold flex items-center justify-center px-1"
                style={{ background: "var(--accent-blue)", color: "#fff" }}
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* User avatar / login */}
          {isAuthenticated && user ? (
            <button
              onClick={() => navigate(`/profile/${user.id}`)}
              className="relative flex items-center justify-center transition-all duration-150 flex-shrink-0 ml-2"
              title={user.name ?? "Mi perfil"}
              style={{ overflow: "visible" }}
            >
              <UserAvatar
                  avatar={user.avatar}
                  name={user.name}
                  activeFrameImage={(user as any).activeFrameImage}
                  size={40}
                  ringColor={isAdmin ? "#FFD700" : isPremium ? "var(--accent-red)" : "var(--border-main)"}
                />
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                style={{ background: "#22c55e", borderColor: "var(--bg-main)", zIndex: 20 }}
              />
            </button>
          ) : (
            <a
              href={getLoginUrl()}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-base font-semibold transition-all duration-150 ml-2"
              style={{ background: "var(--accent-red)", color: "#fff" }}
            >
              Iniciar sesión
            </a>
          )}
        </div>
      </div>

      {/* Right panel — rendered outside the topbar to avoid z-index issues */}
      {isAuthenticated && (
        <RightPanel
          open={panelOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  );
}
