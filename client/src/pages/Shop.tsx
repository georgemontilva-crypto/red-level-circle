import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionBanner } from "@/components/SectionBanner";
import { toast } from "sonner";
import {
  ShoppingBag, Coins, Package, Zap, Star, Clock, CheckCircle,
  AlertCircle, Lock, MapPin, Mail, Phone, User, Globe, Hash, Key,
  Sparkles, Shield, X, Check, ShoppingCart, Heart, Trash2, Plus, Minus, Bookmark,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  all: "Todo",
  physical: "Físico",
  digital: "Digital",
  bundle: "Paquete",
  limited: "Edición Limitada",
};
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  physical: <Package className="w-4 h-4" />,
  digital: <Zap className="w-4 h-4" />,
  bundle: <Star className="w-4 h-4" />,
  limited: <Clock className="w-4 h-4" />,
};
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: "Pendiente",  color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: <Clock className="w-3 h-3" /> },
  processing: { label: "En proceso", color: "text-blue-400 bg-blue-400/10 border-blue-400/30",       icon: <AlertCircle className="w-3 h-3" /> },
  delivered:  { label: "Entregado",  color: "text-green-400 bg-green-400/10 border-green-400/30",    icon: <CheckCircle className="w-3 h-3" /> },
  cancelled:  { label: "Cancelado",  color: "text-red-400 bg-red-400/10 border-red-400/30",          icon: <AlertCircle className="w-3 h-3" /> },
};

const RARITY_COLORS: Record<string, string> = {
  common:    "text-muted-foreground border-gray-600",
  rare:      "text-blue-400 border-blue-500",
  epic:      "text-purple-400 border-purple-500",
  legendary: "text-yellow-400 border-yellow-500",
};
const RARITY_GLOW: Record<string, string> = {
  common:    "",
  rare:      "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
  epic:      "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
  legendary: "shadow-[0_0_20px_rgba(234,179,8,0.5)]",
};
const RARITY_LABELS: Record<string, string> = {
  common:    "Común",
  rare:      "Raro",
  epic:      "Épico",
  legendary: "Legendario",
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  frame:      <Shield className="w-4 h-4" />,
  aura:       <Sparkles className="w-4 h-4" />,
  badge:      <Star className="w-4 h-4" />,
  background: <Zap className="w-4 h-4" />,
};
const TYPE_LABELS: Record<string, string> = {
  frame:      "Marcos",
  aura:       "Auras",
  badge:      "Insignias",
  background: "Fondos",
};

const AVATAR_PLACEHOLDER = "https://api.dicebear.com/7.x/bottts/svg?seed=rlc&backgroundColor=1a1a1a";

const isPhysicalCategory = (cat: string) => cat === "physical" || cat === "bundle";

// ─── Cosmetic Purchase Modal ───────────────────────────────────────────────────
function CosmeticPurchaseModal({
  cosmetic, userBalance, onConfirm, onClose, isPending, error,
}: {
  cosmetic: any; userBalance: number; onConfirm: () => void; onClose: () => void;
  isPending: boolean; error: string | null;
}) {
  const canAfford = userBalance >= cosmetic.price;
  const rarityGlow = RARITY_GLOW[cosmetic.rarity] ?? "";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-white/10"
        style={{ animation: "modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}
      >
        <div className="relative h-44 bg-card overflow-hidden">
          {cosmetic.previewImage ? (
            <img src={cosmetic.previewImage} alt={cosmetic.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-24 h-24">
                <img src={AVATAR_PLACEHOLDER} alt="avatar" className="w-full h-full rounded-full" />
                {cosmetic.frameImage && <img src={cosmetic.frameImage} alt="frame" className="absolute inset-0 w-full h-full" />}
              </div>
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, var(--bg-card) 100%)" }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 hover:bg-background/80 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="px-5 pb-5 -mt-2">
          {!canAfford && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">Saldo insuficiente. Necesitas {cosmetic.price - userBalance} RLC más.</p>
            </div>
          )}
          {error && canAfford && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest mb-3">Detalles de la compra</p>
          <div className={`flex items-center gap-3 bg-card border border-white/10 rounded-xl p-3 mb-4 ${rarityGlow}`}>
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              {cosmetic.previewImage ? <img src={cosmetic.previewImage} alt={cosmetic.name} className="w-full h-full object-cover" /> : <Sparkles className="w-5 h-5 text-muted-foreground m-auto" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{cosmetic.name}</p>
              <p className={`text-xs font-mono ${RARITY_COLORS[cosmetic.rarity]?.split(" ")[0] ?? "text-muted-foreground"}`}>{RARITY_LABELS[cosmetic.rarity]} · {TYPE_LABELS[cosmetic.type]}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold font-mono text-sm">{cosmetic.price}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card border border-white/10 rounded-xl px-4 py-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center flex-shrink-0">
              <Coins className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">RLC Coins</p>
              <p className={`text-xs font-mono ${canAfford ? "text-green-400" : "text-red-400"}`}>Saldo disponible: {userBalance} RLC</p>
            </div>
            {canAfford && <Check className="w-4 h-4 text-green-400 flex-shrink-0" />}
          </div>
          <p className="text-muted-foreground text-xs mb-4 leading-relaxed">Al hacer clic en "Comprar", el cosmético quedará disponible de inmediato en tu galería de perfil. Esta compra no es reembolsable.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-muted-foreground hover:bg-white/5 text-xs">Cancelar</Button>
            <Button onClick={onConfirm} disabled={!canAfford || isPending} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs disabled:opacity-50">
              {isPending ? <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2" />Procesando...</> : <><ShoppingCart className="w-3.5 h-3.5 mr-1.5" />Comprar</>}
            </Button>
          </div>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.88) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Shop() {
  const { user, isAuthenticated } = useAuth();

  // Read ?tab= from URL to allow deep-linking from notifications
  const initialTab = (() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "orders" || t === "products" || t === "cosmetics" || t === "cart" || t === "wishlist") return t;
    return "all";
  })();
  const [mainTab, setMainTab] = useState<"all" | "products" | "cosmetics" | "orders" | "cart" | "wishlist">(initialTab);

  // Products state
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [userNote, setUserNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [shippingForm, setShippingForm] = useState({ fullName: "", address: "", city: "", state: "", country: "", postalCode: "", contact: "" });

  // Cosmetics state
  const [activeType, setActiveType] = useState("all");
  const [activeCollection, setActiveCollection] = useState<string | undefined>();
  const [confirmCosmetic, setConfirmCosmetic] = useState<any | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  // Queries
  const { data: items = [], refetch: refetchItems } = trpc.shop.list.useQuery({
    category: activeCategory === "all" ? undefined : activeCategory,
  });
  const { data: myOrders = [], refetch: refetchOrders } = trpc.shop.myOrders.useQuery(undefined, { enabled: isAuthenticated });
  const { data: cosmetics = [], refetch: refetchCosmetics } = trpc.cosmetics.list.useQuery({
    type: activeType === "all" ? undefined : activeType,
    collection: activeCollection,
  });
  const { data: myCosmetics = [], refetch: refetchOwned } = trpc.cosmetics.myCosmetics.useQuery(undefined, { enabled: isAuthenticated });
  const { data: me, refetch: refetchMe } = trpc.auth.me.useQuery();

  const userBalance = (me as any)?.rlcBalance ?? 0;

  // Cart & Wishlist queries
  const { data: cartData, refetch: refetchCart } = trpc.shop.getCart.useQuery(undefined, { enabled: isAuthenticated });
  const { data: wishlistData, refetch: refetchWishlist } = trpc.shop.getWishlist.useQuery(undefined, { enabled: isAuthenticated });
  const cartItems = cartData?.items ?? [];
  const wishlistItems = wishlistData?.items ?? [];

  // Cart mutations
  const addToCartMutation = trpc.shop.addToCart.useMutation({
    onSuccess: () => { refetchCart(); toast.success("Añadido al carrito", { style: { background: "var(--bg-main)", border: "1px solid var(--accent-blue)", color: "var(--text-primary)" } }); },
    onError: (err) => toast.error(err.message),
  });
  const removeFromCartMutation = trpc.shop.removeFromCart.useMutation({
    onSuccess: () => refetchCart(),
    onError: (err) => toast.error(err.message),
  });
  const clearCartMutation = trpc.shop.clearCart.useMutation({
    onSuccess: () => refetchCart(),
  });

  // Wishlist mutations
  const addToWishlistMutation = trpc.shop.addToWishlist.useMutation({
    onSuccess: () => { refetchWishlist(); toast.success("Añadido a favoritos", { style: { background: "var(--bg-main)", border: "1px solid var(--accent-blue)", color: "var(--text-primary)" } }); },
    onError: (err) => toast.error(err.message),
  });
  const removeFromWishlistMutation = trpc.shop.removeFromWishlist.useMutation({
    onSuccess: () => refetchWishlist(),
    onError: (err) => toast.error(err.message),
  });

  const wishlistItemIds = new Set(wishlistItems.map((w: any) => w.wishlistItem?.itemId));
  const cartItemIds = new Set(cartItems.map((c: any) => c.cartItem?.itemId));

  // Products mutations
  const resetModal = () => {
    setSelectedItem(null); setUserNote(""); setQuantity(1); setConfirmEmail("");
    setShippingForm({ fullName: "", address: "", city: "", state: "", country: "", postalCode: "", contact: "" });
  };
  const buyItemMutation = trpc.shop.buy.useMutation({
    onSuccess: (data) => {
      toast.success(`¡Compra realizada! Nuevo balance: ${data.newBalance} RLC Coins`, {
        description: "El administrador procesará tu pedido pronto.",
        style: { background: "var(--bg-main)", border: "1px solid var(--accent-red)", color: "var(--text-primary)" },
      });
      resetModal(); refetchItems(); refetchOrders(); refetchMe();
    },
    onError: (err) => toast.error(err.message, { style: { background: "var(--bg-main)", border: "1px solid var(--accent-red)", color: "var(--text-primary)" } }),
  });

  // Cosmetics mutations
  const buyCosmeticMutation = trpc.cosmetics.buy.useMutation({
    onSuccess: () => {
      toast.success("¡Cosmético adquirido! Ve a tu perfil para equiparlo.", { style: { background: "var(--bg-main)", border: "1px solid #22c55e", color: "var(--text-primary)" } });
      setConfirmCosmetic(null); setBuyError(null);
      refetchCosmetics(); refetchOwned(); refetchMe();
    },
    onError: (err) => setBuyError(err.message),
  });
  const equipMutation = trpc.cosmetics.equip.useMutation({
    onSuccess: () => {
      toast.success("¡Cosmético equipado! Visible en tu perfil.", { style: { background: "var(--bg-main)", border: "1px solid var(--accent-red)", color: "var(--text-primary)" } });
      refetchOwned(); refetchMe();
    },
  });

  const itemToBuy = items.find((i) => i.id === selectedItem);
  const totalCost = itemToBuy ? itemToBuy.price * quantity : 0;
  const isPhysical = itemToBuy ? isPhysicalCategory(itemToBuy.category) : false;
  const shippingValid = !isPhysical || (shippingForm.fullName.trim() && shippingForm.address.trim() && shippingForm.city.trim() && shippingForm.country.trim() && shippingForm.postalCode.trim() && shippingForm.contact.trim());

  const handleBuyItem = () => {
    if (!itemToBuy) return;
    const shippingJson = isPhysical ? JSON.stringify(shippingForm) : undefined;
    const noteWithEmail = !isPhysical && confirmEmail ? `Email: ${confirmEmail}${userNote ? ` | ${userNote}` : ""}` : (userNote || undefined);
    buyItemMutation.mutate({ itemId: itemToBuy.id, quantity, userNote: noteWithEmail, shippingAddress: shippingJson });
  };

  const ownedCosmeticIds = new Set(myCosmetics.map((c) => c.cosmeticId));
  const equippedCosmeticIds = new Set(myCosmetics.filter((c) => c.isEquipped).map((c) => c.cosmeticId));
  const collections = Array.from(new Set(cosmetics.map((c) => c.collection).filter(Boolean)));

  const pendingOrdersCount = myOrders.filter((o: any) => o.status === "pending" || o.status === "processing").length;

  // ─── Tab config ─────────────────────────────────────────────────────────────
  const MAIN_TABS = [
    { id: "all",       label: "Todo",        icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "products",  label: "Productos",   icon: <Package className="w-4 h-4" /> },
    { id: "cosmetics", label: "Cosméticos",  icon: <Sparkles className="w-4 h-4" /> },
    ...(isAuthenticated ? [{ id: "orders", label: `Mis Pedidos${pendingOrdersCount > 0 ? ` (${pendingOrdersCount})` : ""}`, icon: <Clock className="w-4 h-4" /> }] : []),
    ...(isAuthenticated ? [{ id: "cart", label: `Carrito${cartItems.length > 0 ? ` (${cartItems.length})` : ""}`, icon: <ShoppingCart className="w-4 h-4" /> }] : []),
    ...(isAuthenticated ? [{ id: "wishlist", label: `Favoritos${wishlistItems.length > 0 ? ` (${wishlistItems.length})` : ""}`, icon: <Heart className="w-4 h-4" /> }] : []),
  ] as const;

  // ─── Render helpers ──────────────────────────────────────────────────────────
  const showProducts = mainTab === "all" || mainTab === "products";
  const showCosmetics = mainTab === "all" || mainTab === "cosmetics";
  const showOrders = mainTab === "orders";
  const showCart = mainTab === "cart";
  const showWishlist = mainTab === "wishlist";

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Banner */}
      <div className="pt-4">
        <SectionBanner sectionKey="shop" height="h-48 sm:h-64 lg:h-72" />
      </div>

      {/* Cosmetic purchase modal */}
      {confirmCosmetic && (
        <CosmeticPurchaseModal
          cosmetic={confirmCosmetic}
          userBalance={userBalance}
          onConfirm={() => buyCosmeticMutation.mutate({ cosmeticId: confirmCosmetic.id })}
          onClose={() => { setConfirmCosmetic(null); setBuyError(null); }}
          isPending={buyCosmeticMutation.isPending}
          error={buyError}
        />
      )}

      <div className="py-8">
        {/* Main Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm font-semibold transition-all ${
                mainTab === tab.id
                  ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                  : "bg-card border border-white/10 text-muted-foreground hover:border-red-500/50 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CART TAB ───────────────────────────────────────────────────────── */}
        {showCart && (
          <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold font-mono text-lg">MI CARRITO</h2>
              <span className="ml-auto text-muted-foreground text-sm font-mono">{cartItems.length} {cartItems.length === 1 ? "producto" : "productos"}</span>
              {cartItems.length > 0 && (
                <button onClick={() => clearCartMutation.mutate()} className="text-xs text-red-400 hover:text-red-300 font-mono ml-2">Vaciar</button>
              )}
            </div>
            {cartItems.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingCart className="w-14 h-14 text-blue-400/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-mono mb-4">Tu carrito está vacío</p>
                <button onClick={() => setMainTab("all")} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-mono text-sm">Ver productos</button>
              </div>
            ) : (
              <div>
                <div className="divide-y divide-white/5">
                  {cartItems.map((ci: any) => {
                    const product = ci.product;
                    const cartItem = ci.cartItem;
                    if (!product) return null;
                    return (
                      <div key={cartItem.id} className="px-6 py-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                          {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <ShoppingBag className="w-8 h-8 text-muted-foreground m-auto mt-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate">{product.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Coins className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-yellow-400 font-mono text-sm">{product.price * cartItem.quantity} RLC</span>
                            <span className="text-muted-foreground text-xs ml-1">({product.price} × {cartItem.quantity})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { if (cartItem.quantity > 1) addToCartMutation.mutate({ itemId: product.id, quantity: -1 }); else removeFromCartMutation.mutate({ cartItemId: cartItem.id }); }} className="w-7 h-7 rounded-full bg-secondary hover:bg-white/10 flex items-center justify-center text-white transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="font-mono text-sm w-6 text-center">{cartItem.quantity}</span>
                          <button onClick={() => addToCartMutation.mutate({ itemId: product.id, quantity: 1 })} className="w-7 h-7 rounded-full bg-secondary hover:bg-white/10 flex items-center justify-center text-white transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                        <button onClick={() => removeFromCartMutation.mutate({ cartItemId: cartItem.id })} className="p-2 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    );
                  })}
                </div>
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total</p>
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold font-mono text-xl">
                        {cartItems.reduce((sum: number, ci: any) => sum + (ci.product?.price ?? 0) * (ci.cartItem?.quantity ?? 1), 0)} RLC
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setMainTab("all")} className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-mono font-bold transition-colors">Ir a comprar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── WISHLIST TAB ───────────────────────────────────────────────────── */}
        {showWishlist && (
          <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              <h2 className="font-bold font-mono text-lg">MIS FAVORITOS</h2>
              <span className="ml-auto text-muted-foreground text-sm font-mono">{wishlistItems.length} {wishlistItems.length === 1 ? "producto" : "productos"}</span>
            </div>
            {wishlistItems.length === 0 ? (
              <div className="p-12 text-center">
                <Heart className="w-14 h-14 text-red-400/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-mono mb-4">No tienes productos favoritos aún</p>
                <button onClick={() => setMainTab("all")} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-mono text-sm">Explorar tienda</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {wishlistItems.map((wi: any) => {
                  const product = wi.product;
                  const wishlistItem = wi.wishlistItem;
                  if (!product) return null;
                  return (
                    <div key={wishlistItem.id} className="rounded-xl border border-white/10 bg-secondary overflow-hidden hover:border-red-500/40 transition-all">
                      <div className="relative aspect-video bg-card overflow-hidden">
                        {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <ShoppingBag className="w-12 h-12 text-gray-700 m-auto mt-8" />}
                        <button onClick={() => removeFromWishlistMutation.mutate({ itemId: product.id })} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-red-400 hover:bg-black/80 transition-colors"><Heart className="w-3.5 h-3.5 fill-red-400" /></button>
                      </div>
                      <div className="p-4">
                        <p className="font-bold text-white truncate mb-2">{product.name}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-bold font-mono">{product.price} RLC</span>
                          </div>
                          <button onClick={() => { addToCartMutation.mutate({ itemId: product.id, quantity: 1 }); setMainTab("cart"); }} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-mono rounded-lg transition-colors flex items-center gap-1"><ShoppingCart className="w-3 h-3" />Carrito</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ─────────────────────────────────────────────────────── */}
        {showOrders && (() => {
          type OrderRow = {
            id: number; itemName?: string | null; itemImage?: string | null; itemCategory?: string | null;
            quantity: number; totalPrice: number; status: string; deliveryNote?: string | null;
            userNote?: string | null; shippingAddress?: string | null; createdAt: Date;
          };
          const allOrders = myOrders as OrderRow[];
          const activeOrders = allOrders.filter(o => o.status === "pending" || o.status === "processing");
          const deliveredOrders = allOrders.filter(o => o.status === "delivered");
          const cancelledOrders = allOrders.filter(o => o.status === "cancelled");

          const renderOrder = (order: OrderRow) => {
            const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const isOrderPhysical = order.itemCategory ? isPhysicalCategory(order.itemCategory) : false;
            let parsedShipping: Record<string, string> | null = null;
            if (order.shippingAddress) { try { parsedShipping = JSON.parse(order.shippingAddress); } catch {} }
            return (
              <div key={order.id} className="px-6 py-4 space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                    {order.itemImage ? <img src={order.itemImage} alt="" className="w-full h-full object-cover" /> : <ShoppingBag className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white truncate">{order.itemName ?? "Producto"}</p>
                      {order.itemCategory && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono border ${isOrderPhysical ? "text-orange-400 border-orange-500/30 bg-orange-500/10" : "text-blue-400 border-blue-500/30 bg-blue-500/10"}`}>
                          {isOrderPhysical ? "FÍSICO" : "DIGITAL"}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">x{order.quantity} · {order.totalPrice} RLC · #{order.id} · {new Date(order.createdAt).toLocaleDateString("es")}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono ${statusCfg.color}`}>
                    {statusCfg.icon}{statusCfg.label}
                  </div>
                </div>
                {!isOrderPhysical && order.status === "delivered" && order.deliveryNote && (
                  <div className="ml-16 flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                    <Key className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-green-400 text-xs font-semibold font-mono mb-1">CÓDIGO / ACCESO DIGITAL</p>
                      <p className="text-green-200 font-mono text-sm break-all select-all">{order.deliveryNote}</p>
                    </div>
                  </div>
                )}
                {!isOrderPhysical && order.status !== "delivered" && (
                  <div className="ml-16 flex items-center gap-2 p-2 rounded-lg bg-secondary/60 border border-white/5 text-muted-foreground text-xs">
                    <Key className="w-3 h-3" /><span>El código o acceso aparecerá aquí cuando el pedido sea entregado.</span>
                  </div>
                )}
                {isOrderPhysical && parsedShipping && (
                  <div className="ml-16 flex items-start gap-2 p-2 rounded-lg bg-secondary/60 border border-white/5 text-muted-foreground text-xs">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-orange-400" />
                    <span>{parsedShipping.fullName}, {parsedShipping.address}, {parsedShipping.city}, {parsedShipping.country} {parsedShipping.postalCode}</span>
                  </div>
                )}
                {isOrderPhysical && order.status === "delivered" && order.deliveryNote && (
                  <div className="ml-16 flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Package className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-blue-400 text-xs font-semibold font-mono">NÚMERO DE SEGUIMIENTO</p>
                      <p className="text-blue-200 text-sm font-mono">{order.deliveryNote}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          };

          return (
            <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
                <Package className="w-5 h-5 text-red-500" />
                <h2 className="font-bold font-mono text-lg">MIS PEDIDOS</h2>
                <span className="ml-auto text-muted-foreground text-sm font-mono">{allOrders.length} total</span>
              </div>
              {allOrders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground font-mono">No tienes pedidos aún</div>
              ) : (
                <div>
                  {activeOrders.length > 0 && (
                    <div>
                      <div className="px-6 py-2 bg-yellow-500/5 border-b border-yellow-500/10">
                        <p className="text-yellow-400 text-xs font-mono font-semibold">EN CURSO ({activeOrders.length})</p>
                      </div>
                      <div className="divide-y divide-white/5">{activeOrders.map(renderOrder)}</div>
                    </div>
                  )}
                  {deliveredOrders.length > 0 && (
                    <div>
                      <div className="px-6 py-2 bg-green-500/5 border-b border-green-500/10 border-t border-t-white/5">
                        <p className="text-green-400 text-xs font-mono font-semibold">ENTREGADOS ({deliveredOrders.length})</p>
                      </div>
                      <div className="divide-y divide-white/5">{deliveredOrders.map(renderOrder)}</div>
                    </div>
                  )}
                  {cancelledOrders.length > 0 && (
                    <div>
                      <div className="px-6 py-2 bg-red-500/5 border-b border-red-500/10 border-t border-t-white/5">
                        <p className="text-red-400 text-xs font-mono font-semibold">CANCELADOS ({cancelledOrders.length})</p>
                      </div>
                      <div className="divide-y divide-white/5">{cancelledOrders.map(renderOrder)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── PRODUCTS SECTION ───────────────────────────────────────────────── */}
        {showProducts && (
          <div className={showCosmetics ? "mb-16" : ""}>
            {mainTab === "all" && (
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-black font-mono tracking-wide">PRODUCTOS</h2>
              </div>
            )}

            {/* Category filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-sm transition-all ${
                    activeCategory === cat
                      ? "border-red-500 bg-red-500/10 text-red-400"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:border-red-500/50 hover:text-white"
                  }`}
                >
                  {cat !== "all" && CATEGORY_ICONS[cat]}
                  {label}
                </button>
              ))}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-14 h-14 text-red-500/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-mono">No hay productos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => {
                  const discount = item.originalPrice && item.originalPrice > item.price ? Math.round((1 - item.price / item.originalPrice) * 100) : null;
                  const outOfStock = item.stock === 0;
                  const purchasedCount = isAuthenticated
                    ? (myOrders as Array<{ itemId?: number; quantity: number; status: string }>)
                        .filter(o => (o as any).itemId === item.id && o.status !== "cancelled")
                        .reduce((sum, o) => sum + (o.quantity ?? 1), 0)
                    : 0;
                  const limitReached = !!(item.maxPerUser && purchasedCount >= item.maxPerUser);
                  const isDisabled = outOfStock || limitReached;
                  return (
                    <div
                      key={item.id}
                      className={`group rounded-xl border bg-card overflow-hidden transition-all hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(255,0,0,0.1)] ${isDisabled ? "opacity-70" : "cursor-pointer"} ${item.isFeatured ? "border-yellow-500/30" : "border-white/10"}`}
                      onClick={() => !isDisabled && setSelectedItem(item.id)}
                    >
                      <div className="relative aspect-video bg-secondary overflow-hidden">
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">{CATEGORY_ICONS[item.category] ?? <ShoppingBag className="w-12 h-12 text-gray-700" />}</div>}
                        <div className="absolute top-2 left-2 flex gap-1">
                          {item.isFeatured && <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded font-mono">DESTACADO</span>}
                          {item.isLimited && <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded font-mono">LIMITADO</span>}
                          {discount && <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded font-mono">-{discount}%</span>}
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded font-mono flex items-center gap-1 ${isPhysicalCategory(item.category) ? "bg-orange-500/80 text-white" : "bg-blue-500/80 text-white"}`}>
                            {isPhysicalCategory(item.category) ? <Package className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                            {isPhysicalCategory(item.category) ? "FÍSICO" : "DIGITAL"}
                          </span>
                        </div>
                        {outOfStock && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><span className="text-red-400 font-bold font-mono text-lg">AGOTADO</span></div>}
                        {!outOfStock && limitReached && (
                          <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-1">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                            <span className="text-green-400 font-bold font-mono text-sm">YA COMPRADO</span>
                            {item.maxPerUser && <span className="text-green-600 text-xs font-mono">{purchasedCount}/{item.maxPerUser} unidades</span>}
                          </div>
                        )}
                        {/* Wishlist & Cart quick-action icons */}
                        {isAuthenticated && (
                          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => { e.stopPropagation(); wishlistItemIds.has(item.id) ? removeFromWishlistMutation.mutate({ itemId: item.id }) : addToWishlistMutation.mutate({ itemId: item.id }); }}
                              className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-black/90"
                              title={wishlistItemIds.has(item.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
                            >
                              <Heart className={`w-4 h-4 ${wishlistItemIds.has(item.id) ? "fill-red-400 text-red-400" : "text-white"}`} />
                            </button>
                            {!isDisabled && (
                              <button
                                onClick={e => { e.stopPropagation(); addToCartMutation.mutate({ itemId: item.id, quantity: 1 }); }}
                                className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-black/90"
                                title="Añadir al carrito"
                              >
                                <ShoppingCart className={`w-4 h-4 ${cartItemIds.has(item.id) ? "text-blue-400" : "text-white"}`} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-1 mb-1">
                          {CATEGORY_ICONS[item.category]}
                          <span className="text-xs text-muted-foreground font-mono">{CATEGORY_LABELS[item.category]}</span>
                          {item.stock > 0 && item.stock <= 10 && <span className="ml-auto text-xs text-orange-400 font-mono">Quedan {item.stock}</span>}
                        </div>
                        <h3 className="font-bold text-white mb-1">{item.name}</h3>
                        {item.description && <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{item.description}</p>}
                        <div className="flex items-center justify-between">
                          <div>
                            {item.originalPrice && item.originalPrice > item.price && <p className="text-muted-foreground text-xs line-through font-mono">{item.originalPrice} RLC</p>}
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-400 font-bold font-mono text-lg">{item.price}</span>
                              <span className="text-muted-foreground text-sm">RLC</span>
                            </div>
                          </div>
                          {!isAuthenticated ? (
                            <a href={getLoginUrl()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm font-mono hover:bg-zinc-600 transition-all"><Lock className="w-3 h-3" />Login</a>
                          ) : limitReached ? (
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono"><CheckCircle className="w-3 h-3" />Adquirido</span>
                          ) : (
                            <button disabled={outOfStock} className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-mono font-bold transition-all disabled:opacity-50">Comprar</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── COSMETICS SECTION ──────────────────────────────────────────────── */}
        {showCosmetics && (
          <div>
            {mainTab === "all" && (
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-black font-mono tracking-wide">COSMÉTICOS</h2>
              </div>
            )}

            {/* Type filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              {["all", "frame", "aura", "badge", "background"].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-sm transition-all ${
                    activeType === type
                      ? "border-purple-500 bg-purple-500/10 text-purple-400"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:border-purple-500/50 hover:text-white"
                  }`}
                >
                  {type !== "all" && TYPE_ICONS[type]}
                  {type === "all" ? "Todos" : TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {/* Collections */}
            {collections.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-muted-foreground text-sm font-mono self-center">Colecciones:</span>
                <button onClick={() => setActiveCollection(undefined)} className={`px-3 py-1 rounded text-xs font-mono border transition-all ${!activeCollection ? "border-purple-500 text-purple-400 bg-purple-500/10" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>Todas</button>
                {collections.map((col) => (
                  <button key={col} onClick={() => setActiveCollection(col === activeCollection ? undefined : col!)} className={`px-3 py-1 rounded text-xs font-mono border transition-all ${activeCollection === col ? "border-purple-500 text-purple-400 bg-purple-500/10" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>{col}</button>
                ))}
              </div>
            )}

            {cosmetics.length === 0 ? (
              <div className="text-center py-16">
                <Sparkles className="w-14 h-14 text-purple-500/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-mono">No hay cosméticos disponibles aún</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {cosmetics.map((cosmetic) => {
                  const owned = ownedCosmeticIds.has(cosmetic.id);
                  const equipped = equippedCosmeticIds.has(cosmetic.id);
                  const rarityClass = RARITY_COLORS[cosmetic.rarity] ?? RARITY_COLORS.common;
                  const glowClass = RARITY_GLOW[cosmetic.rarity] ?? "";
                  const discount = cosmetic.originalPrice && cosmetic.originalPrice > cosmetic.price ? Math.round((1 - cosmetic.price / cosmetic.originalPrice) * 100) : null;
                  return (
                    <div key={cosmetic.id} className={`relative rounded-xl border bg-card overflow-hidden transition-all hover:scale-[1.03] hover:-translate-y-0.5 ${rarityClass} ${glowClass}`}>
                      <div className="relative aspect-square bg-secondary flex items-center justify-center overflow-hidden">
                        {cosmetic.previewImage ? (
                          <img src={cosmetic.previewImage} alt={cosmetic.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="relative w-24 h-24">
                            <img src={AVATAR_PLACEHOLDER} alt="avatar" className="w-full h-full rounded-full" />
                            {cosmetic.frameImage ? <img src={cosmetic.frameImage} alt="frame" className="absolute inset-0 w-full h-full" /> : <div className="absolute inset-0 rounded-full border-4 border-current opacity-60" />}
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {cosmetic.isLimited && <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded font-mono">LIMITADO</span>}
                          {discount && <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded font-mono">-{discount}%</span>}
                        </div>
                        {owned && <div className="absolute top-2 right-2"><div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div></div>}
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-1 mb-1">{TYPE_ICONS[cosmetic.type]}<span className="text-xs text-muted-foreground font-mono">{TYPE_LABELS[cosmetic.type]}</span></div>
                        <p className="font-bold text-sm text-white leading-tight mb-1">{cosmetic.name}</p>
                        <Badge variant="outline" className={`text-xs ${rarityClass} mb-2`}>{RARITY_LABELS[cosmetic.rarity]}</Badge>
                        {(() => {
                          const cols = Array.isArray(cosmetic.colors) ? (cosmetic.colors as unknown[]).filter((c): c is string => typeof c === "string") : [];
                          return cols.length > 0 ? (
                            <div className="flex gap-1 mb-2">
                              {cols.slice(0, 4).map((color, i) => <div key={i} className="w-4 h-4 rounded-full border border-white/20" style={{ background: color }} />)}
                              {cols.length > 4 && <span className="text-muted-foreground text-xs self-center">+{cols.length - 4}</span>}
                            </div>
                          ) : null;
                        })()}
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            {cosmetic.originalPrice && cosmetic.originalPrice > cosmetic.price && <p className="text-muted-foreground text-xs line-through font-mono">{cosmetic.originalPrice} RLC</p>}
                            <div className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-400" /><span className="text-yellow-400 font-bold text-sm font-mono">{cosmetic.price}</span></div>
                          </div>
                          {owned ? (
                            <button onClick={() => equipMutation.mutate({ cosmeticId: cosmetic.id })} className={`px-2 py-1 rounded text-xs font-mono font-bold transition-all ${equipped ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"}`}>{equipped ? "Equipado" : "Equipar"}</button>
                          ) : isAuthenticated ? (
                            <button onClick={() => { setBuyError(null); setConfirmCosmetic(cosmetic); }} className="px-2 py-1 rounded text-xs font-mono font-bold bg-red-500 hover:bg-red-600 text-white transition-all">Comprar</button>
                          ) : (
                            <a href={getLoginUrl()} className="px-2 py-1 rounded text-xs font-mono font-bold bg-muted text-muted-foreground hover:bg-zinc-600 transition-all flex items-center gap-1"><Lock className="w-3 h-3" />Login</a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* My Collection */}
            {isAuthenticated && myCosmetics.length > 0 && (mainTab === "cosmetics") && (
              <div className="mt-16">
                <h2 className="text-2xl font-black mb-2 font-mono tracking-wide">MI <span className="text-red-500">COLECCIÓN</span></h2>
                <p className="text-muted-foreground text-sm mb-6">Los cosméticos equipados se muestran sobre tu foto de perfil en toda la plataforma.</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {myCosmetics.map((uc) => (
                    <div key={uc.id} className={`relative rounded-lg border p-2 text-center transition-all ${uc.isEquipped ? "border-green-500 bg-green-500/10" : "border-white/10 bg-card"}`}>
                      <div className="w-12 h-12 mx-auto mb-1 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {(uc as any).previewImage ? <img src={(uc as any).previewImage} alt={(uc as any).name ?? ""} className="w-full h-full object-cover" /> : <Sparkles className="w-6 h-6 text-muted-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{(uc as any).name}</p>
                      {uc.isEquipped ? (
                        <span className="text-xs text-green-400 font-mono flex items-center gap-0.5 justify-center"><Check size={11} />Equipado</span>
                      ) : (
                        <button onClick={() => equipMutation.mutate({ cosmeticId: uc.cosmeticId })} disabled={equipMutation.isPending} className="text-xs text-red-400 hover:text-red-300 font-mono mt-1 disabled:opacity-50">Equipar</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buy Product Dialog */}
      <Dialog open={selectedItem !== null} onOpenChange={resetModal}>
        <DialogContent className="bg-card border border-red-500/30 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-xl text-red-400 flex items-center gap-2">
              {isPhysical ? <><Package className="w-5 h-5" />PEDIDO FÍSICO</> : <><Key className="w-5 h-5" />ENTREGA DIGITAL</>}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isPhysical ? "Necesitamos tu dirección de envío para procesar el pedido." : "Recibirás el código o acceso por notificación en la plataforma."}
            </DialogDescription>
          </DialogHeader>
          {itemToBuy && (
            <div className="space-y-5">
              <div className="flex gap-3 p-3 rounded-lg bg-secondary border border-white/10">
                {itemToBuy.image ? <img src={itemToBuy.image} alt={itemToBuy.name} className="w-16 h-16 rounded object-cover flex-shrink-0" /> : <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-8 h-8 text-muted-foreground" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{itemToBuy.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">{CATEGORY_ICONS[itemToBuy.category]}<span className="text-muted-foreground text-xs font-mono">{CATEGORY_LABELS[itemToBuy.category]}</span></div>
                  <div className="flex items-center gap-1 mt-1"><Coins className="w-3 h-3 text-yellow-400" /><span className="text-yellow-400 font-mono font-bold">{itemToBuy.price} RLC / ud.</span></div>
                </div>
              </div>
              {itemToBuy.stock !== 1 && (
                <div>
                  <label className="text-xs text-muted-foreground font-mono mb-2 block uppercase">Cantidad</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded border border-white/20 text-white hover:border-red-500 transition-colors">-</button>
                    <span className="font-bold font-mono text-lg w-8 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(itemToBuy.stock === -1 ? 99 : itemToBuy.stock, quantity + 1))} className="w-8 h-8 rounded border border-white/20 text-white hover:border-red-500 transition-colors">+</button>
                  </div>
                </div>
              )}
              {isPhysical && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-orange-400 uppercase"><MapPin className="w-3.5 h-3.5" />Dirección de envío (obligatoria)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User className="w-3 h-3" />Nombre completo *</label><input value={shippingForm.fullName} onChange={e => setShippingForm(f => ({...f, fullName: e.target.value}))} placeholder="Juan Pérez" className="w-full px-3 py-2 rounded-lg bg-secondary border border-white/10 text-white text-sm placeholder:text-muted-foreground focus:border-red-500 focus:outline-none" /></div>
                    <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />Dirección *</label><input value={shippingForm.address} onChange={e => setShippingForm(f => ({...f, address: e.target.value}))} placeholder="Calle Mayor 12, 3º A" className="w-full px-3 py-2 rounded-lg bg-secondary border border-white/10 text-white text-sm placeholder:text-muted-foreground focus:border-red-500 focus:outline-none" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Ciudad *</label><input value={shippingForm.city} onChange={e => setShippingForm(f => ({...f, city: e.target.value}))} placeholder="Madrid" className="w-full px-3 py-2 rounded-lg bg-secondary border border-white/10 text-white text-sm placeholder:text-muted-foreground focus:border-red-500 focus:outline-none" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Provincia / Estado</label><input value={shippingForm.state} onChange={e => setShippingForm(f => ({...f, state: e.target.value}))} placeholder="Madrid" className="w-full px-3 py-2 rounded-lg bg-secondary border border-white/10 text-white text-sm placeholder:text-muted-foreground focus:border-red-500 focus:outline-none" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Globe className="w-3 h-3" />País *</label><input value={shippingForm.country} onChange={e => setShippingForm(f => ({...f, country: e.target.value}))} placeholder="España" className="w-full px-3 py-2 rounded-lg bg-secondary border border-white/10 text-white text-sm placeholder:text-muted-foreground focus:border-red-500 focus:outline-none" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Hash className="w-3 h-3" />Código postal *</label><input value={shippingForm.postalCode} onChange={e => setShippingForm(f => ({...f, postalCode: e.target.value}))} placeholder="28001" className="w-full px-3 py-2 rounded-lg bg-secondary border border-white/10 text-white text-sm placeholder:text-muted-foreground focus:border-red-500 focus:outline-none" /></div>
                    <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Phone className="w-3 h-3" />Discord o teléfono de contacto *</label><input value={shippingForm.contact} onChange={e => setShippingForm(f => ({...f, contact: e.target.value}))} placeholder="usuario#1234 o +34 600 000 000" className="w-full px-3 py-2 rounded-lg bg-secondary border border-white/10 text-white text-sm placeholder:text-muted-foreground focus:border-red-500 focus:outline-none" /></div>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />Tus datos de envío son confidenciales y solo se usarán para procesar este pedido.</div>
                </div>
              )}
              {!isPhysical && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase"><Mail className="w-3.5 h-3.5" />Entrega digital</div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm space-y-1">
                    <p className="font-semibold">¿Cómo recibirás tu producto?</p>
                    <p className="text-xs text-blue-400">Una vez procesado, el código o acceso aparecerá en tu historial de pedidos y recibirás una notificación in-app.</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Mail className="w-3 h-3" />Email de confirmación (opcional)</label>
                    <input type="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-3 py-2 rounded-lg bg-secondary border border-white/10 text-white text-sm placeholder:text-muted-foreground focus:border-red-500 focus:outline-none" />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground font-mono mb-2 block uppercase">Nota adicional (opcional)</label>
                <textarea value={userNote} onChange={(e) => setUserNote(e.target.value)} placeholder={isPhysical ? "Ej: Talla M, color azul..." : "Ej: Nombre de usuario, plataforma preferida..."} rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-white/10 text-white text-sm placeholder:text-muted-foreground focus:border-red-500 focus:outline-none resize-none" />
              </div>
              <div className="p-3 rounded-lg bg-background border border-white/10 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal ({quantity}x)</span><span className="font-mono">{totalCost} RLC</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tu balance</span><span className={`font-mono ${userBalance < totalCost ? "text-red-400" : "text-green-400"}`}>{userBalance} RLC</span></div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold"><span>Balance restante</span><span className={`font-mono ${userBalance - totalCost < 0 ? "text-red-400" : "text-yellow-400"}`}>{userBalance - totalCost} RLC</span></div>
              </div>
              {userBalance < totalCost && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />Saldo insuficiente. Gana más RLC en la sección de Recompensas.</div>}
              {isPhysical && !shippingValid && <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />Completa todos los campos obligatorios de envío (*) para continuar.</div>}
              <Button onClick={handleBuyItem} disabled={buyItemMutation.isPending || userBalance < totalCost || !shippingValid} className="w-full bg-red-500 hover:bg-red-600 text-white font-mono font-bold">
                {buyItemMutation.isPending ? "Procesando..." : `Confirmar — ${totalCost} RLC`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
