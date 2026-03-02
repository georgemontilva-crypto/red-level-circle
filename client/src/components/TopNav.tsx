import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Bookmark, Gift, ShoppingCart, ChevronLeft, X, Crown, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export function TopNav() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isPremium = user?.role === "premium" || user?.role === "admin";

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

  const navLinks = [
    { label: "Descubrir", href: "/creators" },
    { label: "Explorar", href: "/tournaments" },
    { label: "Noticias", href: "/news" },
  ];

  // Get user initials for avatar fallback
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div
      className="hidden md:flex items-center h-14 px-5 gap-4 border-b fixed top-0 z-40 backdrop-blur-md"
      style={{
        background: "rgba(11,11,13,0.97)",
        borderColor: "var(--border-main)",
        left: "240px",   /* sidebar width */
        right: 0,
      }}
    >
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 flex-shrink-0"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        title="Atrás"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Search bar */}
      <div
        className="relative flex items-center rounded-full transition-all duration-200 flex-shrink-0"
        style={{
          background: searchFocused ? "var(--bg-hover)" : "var(--bg-card)",
          border: `1px solid ${searchFocused ? "rgba(255,255,255,0.15)" : "transparent"}`,
          width: searchFocused ? "300px" : "240px",
        }}
      >
        <Search className="w-4 h-4 ml-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
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
          className="flex-1 bg-transparent text-sm py-2 px-2 outline-none min-w-0"
          style={{ color: "var(--text-primary)" }}
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
            className="mr-2 p-0.5 rounded-full transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-0.5">
        {navLinks.map(link => {
          const active = location === link.href || location.startsWith(link.href + "/");
          return (
            <button
              key={link.href}
              onClick={() => navigate(link.href)}
              className="relative px-4 h-14 text-sm font-semibold transition-all duration-150 flex items-center"
              style={{
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
              }}
            >
              {link.label}
              {/* Active underline */}
              {active && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: "var(--accent-red)" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action icons */}
      <div className="flex items-center gap-0.5">
        {/* Wishlist / Favoritos */}
        <button
          onClick={() => navigate("/shop?tab=wishlist")}
          className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          }}
          title="Mis favoritos"
        >
          <Bookmark className="w-5 h-5" />
          {wishlistCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1"
              style={{ background: "var(--accent-blue)", color: "#fff" }}
            >
              {wishlistCount}
            </span>
          )}
        </button>

        {/* Gifts / Recompensas */}
        <button
          onClick={() => navigate("/rewards")}
          className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          }}
          title="Recompensas"
        >
          <Gift className="w-5 h-5" />
        </button>

        {/* Cart */}
        <button
          onClick={() => navigate("/shop?tab=cart")}
          className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150"
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
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1"
              style={{ background: "var(--accent-blue)", color: "#fff" }}
            >
              {cartCount}
            </span>
          )}
        </button>

        {/* Separator */}
        <div className="w-px h-6 mx-2" style={{ background: "var(--border-main)" }} />

        {/* User avatar / login */}
        {isAuthenticated && user ? (
          <button
            onClick={() => navigate(`/profile/${user.id}`)}
            className="relative flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 transition-all duration-150 flex-shrink-0"
            style={{ borderColor: isAdmin ? "#FFD700" : isPremium ? "var(--accent-red)" : "var(--border-main)" }}
            title={user.name ?? "Mi perfil"}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name ?? ""} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-bold text-sm"
                style={{ background: isAdmin ? "#3a2e00" : "var(--bg-hover)", color: isAdmin ? "#FFD700" : "var(--text-primary)" }}
              >
                {userInitial}
              </div>
            )}
            {/* Online dot */}
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: "#22c55e", borderColor: "var(--bg-main)" }}
            />
          </button>
        ) : (
          <a
            href={getLoginUrl()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150"
            style={{ background: "var(--accent-red)", color: "#fff" }}
          >
            Iniciar sesión
          </a>
        )}
      </div>
    </div>
  );
}
