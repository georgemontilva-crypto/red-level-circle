import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Bookmark, Gift, ShoppingCart, ChevronLeft, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function TopNav() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();

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

  const canGoBack = window.history.length > 1;

  return (
    <div
      className="hidden md:flex items-center h-12 px-4 gap-4 border-b sticky top-0 z-30 backdrop-blur-md"
      style={{
        background: "rgba(14,14,16,0.95)",
        borderColor: "var(--border-main)",
      }}
    >
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        disabled={!canGoBack}
        className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 disabled:opacity-30"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        title="Atrás"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Search bar */}
      <div
        className="relative flex items-center rounded-full transition-all duration-200"
        style={{
          background: searchFocused ? "var(--bg-hover)" : "var(--bg-card)",
          border: `1px solid ${searchFocused ? "var(--border-main)" : "transparent"}`,
          width: searchFocused ? "260px" : "200px",
        }}
      >
        <Search className="w-4 h-4 ml-3 shrink-0" style={{ color: "var(--text-muted)" }} />
        <input
          ref={searchRef}
          type="text"
          placeholder="Buscar..."
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
          className="flex-1 bg-transparent text-sm py-1.5 px-2 outline-none"
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
      <nav className="flex items-center gap-1">
        {navLinks.map(link => {
          const active = location === link.href || location.startsWith(link.href + "/");
          return (
            <button
              key={link.href}
              onClick={() => navigate(link.href)}
              className="px-3 py-1.5 text-sm font-semibold rounded transition-all duration-150"
              style={{
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                borderBottom: active ? "2px solid var(--accent-red)" : "2px solid transparent",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action icons */}
      <div className="flex items-center gap-1">
        {/* Wishlist / Favoritos */}
        <button
          onClick={() => navigate("/shop?tab=wishlist")}
          className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-150"
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
          className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-150"
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
          className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-150"
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
      </div>
    </div>
  );
}
