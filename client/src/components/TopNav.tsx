import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Bookmark, Gift, ShoppingCart, ChevronLeft, X } from "lucide-react";
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
    { label: "Aliados", href: "/allies" },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div
      className="hidden md:flex items-center px-6 gap-5 fixed top-0 z-40"
      style={{ height: "100px", background: "#0f1115", border: "none", left: "240px", right: 0 }}
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
        <button
          onClick={() => navigate("/shop?tab=wishlist")}
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

        {/* Gifts */}
        <button
          onClick={() => navigate("/rewards")}
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
          title="Recompensas"
        >
          <Gift className="w-6 h-6" />
        </button>

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
            className="relative flex items-center justify-center w-11 h-11 rounded-full overflow-hidden border-2 transition-all duration-150 flex-shrink-0 ml-2"
            style={{ borderColor: isAdmin ? "#FFD700" : isPremium ? "var(--accent-red)" : "var(--border-main)" }}
            title={user.name ?? "Mi perfil"}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name ?? ""} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-bold text-base"
                style={{ background: isAdmin ? "#3a2e00" : "var(--bg-hover)", color: isAdmin ? "#FFD700" : "var(--text-primary)" }}
              >
                {userInitial}
              </div>
            )}
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{ background: "#22c55e", borderColor: "var(--bg-main)" }}
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
  );
}
