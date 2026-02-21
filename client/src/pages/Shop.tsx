import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionBanner } from "@/components/SectionBanner";
import { toast } from "sonner";
import {
  ShoppingBag, Coins, Package, Zap, Star, Clock, CheckCircle,
  AlertCircle, Lock, ChevronRight, Tag
} from "lucide-react";
import { getLoginUrl } from "@/const";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const CATEGORY_LABELS: Record<string, string> = {
  all: "Todo",
  physical: "Físico",
  digital: "Digital",
  bundle: "Bundle",
  limited: "Edición Limitada",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  physical: <Package className="w-4 h-4" />,
  digital: <Zap className="w-4 h-4" />,
  bundle: <Star className="w-4 h-4" />,
  limited: <Clock className="w-4 h-4" />,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: <Clock className="w-3 h-3" /> },
  processing: { label: "En proceso", color: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: <AlertCircle className="w-3 h-3" /> },
  delivered: { label: "Entregado", color: "text-green-400 bg-green-400/10 border-green-400/30", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Cancelado", color: "text-red-400 bg-red-400/10 border-red-400/30", icon: <AlertCircle className="w-3 h-3" /> },
};

export default function Shop() {
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [userNote, setUserNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showOrders, setShowOrders] = useState(false);

  const { data: items = [], refetch } = trpc.shop.list.useQuery({
    category: activeCategory === "all" ? undefined : activeCategory,
  });

  const { data: myOrders = [], refetch: refetchOrders } = trpc.shop.myOrders.useQuery(
    undefined, { enabled: isAuthenticated }
  );

  const { data: me, refetch: refetchMe } = trpc.auth.me.useQuery();

  const buyMutation = trpc.shop.buy.useMutation({
    onSuccess: (data) => {
      toast.success(`¡Compra realizada! Nuevo balance: ${data.newBalance} RLC Coins`, {
        description: "El administrador procesará tu pedido pronto.",
        style: { background: "#0a0a0a", border: "1px solid #ff0000", color: "#fff" },
      });
      setSelectedItem(null);
      setUserNote("");
      setQuantity(1);
      refetch();
      refetchOrders();
      refetchMe();
    },
    onError: (err) => {
      toast.error(err.message, {
        style: { background: "#0a0a0a", border: "1px solid #ff0000", color: "#fff" },
      });
    },
  });

  const itemToBuy = items.find((i) => i.id === selectedItem);
  const totalCost = itemToBuy ? itemToBuy.price * quantity : 0;
  const userBalance = (me as { rlcBalance?: number } | null)?.rlcBalance ?? 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Section Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <SectionBanner sectionKey="shop" height="h-48 sm:h-64 lg:h-72" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* My Orders Panel */}
        {showOrders && isAuthenticated && (
          <div className="mb-10 rounded-xl border border-white/10 bg-zinc-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
              <Package className="w-5 h-5 text-red-500" />
              <h2 className="font-bold font-mono text-lg">MIS PEDIDOS</h2>
            </div>
            {myOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-mono">No tienes pedidos aún</div>
            ) : (
              <div className="divide-y divide-white/5">
                {(myOrders as Array<{
                  id: number;
                  itemName?: string | null;
                  itemImage?: string | null;
                  quantity: number;
                  totalPrice: number;
                  status: string;
                  deliveryNote?: string | null;
                  userNote?: string | null;
                  createdAt: Date;
                }>).map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                  return (
                    <div key={order.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {order.itemImage ? (
                          <img src={order.itemImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{order.itemName ?? "Producto"}</p>
                        <p className="text-gray-500 text-sm">Cantidad: {order.quantity} · {order.totalPrice} RLC</p>
                        {order.deliveryNote && (
                          <p className="text-green-400 text-xs mt-1">📦 {order.deliveryNote}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </div>
                      <div className="text-gray-600 text-xs font-mono">
                        #{order.id}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-sm transition-all ${
                activeCategory === cat
                  ? "border-red-500 bg-red-500/10 text-red-400"
                  : "border-white/10 bg-white/5 text-gray-400 hover:border-red-500/50 hover:text-white"
              }`}
            >
              {cat !== "all" && CATEGORY_ICONS[cat]}
              {label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {items.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
            <p className="text-gray-500 font-mono text-lg">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const discount = item.originalPrice && item.originalPrice > item.price
                ? Math.round((1 - item.price / item.originalPrice) * 100)
                : null;
              const outOfStock = item.stock === 0;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border bg-zinc-900 overflow-hidden transition-all hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(255,0,0,0.1)] ${
                    outOfStock ? "opacity-60" : "cursor-pointer"
                  } ${item.isFeatured ? "border-yellow-500/30" : "border-white/10"}`}
                  onClick={() => !outOfStock && setSelectedItem(item.id)}
                >
                  {/* Image */}
                  <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {CATEGORY_ICONS[item.category] ?? <ShoppingBag className="w-12 h-12 text-gray-700" />}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {item.isFeatured && (
                        <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded font-mono">DESTACADO</span>
                      )}
                      {item.isLimited && (
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded font-mono">LIMITADO</span>
                      )}
                      {discount && (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded font-mono">-{discount}%</span>
                      )}
                    </div>
                    {outOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-red-400 font-bold font-mono text-lg">AGOTADO</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-1 mb-1">
                      {CATEGORY_ICONS[item.category]}
                      <span className="text-xs text-gray-500 font-mono">{CATEGORY_LABELS[item.category]}</span>
                      {item.stock > 0 && item.stock <= 10 && (
                        <span className="ml-auto text-xs text-orange-400 font-mono">Quedan {item.stock}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-gray-500 text-sm line-clamp-2 mb-3">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <p className="text-gray-600 text-xs line-through font-mono">{item.originalPrice} RLC</p>
                        )}
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-bold font-mono text-lg">{item.price}</span>
                          <span className="text-gray-500 text-sm">RLC</span>
                        </div>
                      </div>
                      {!isAuthenticated ? (
                        <a href={getLoginUrl()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-700 text-gray-400 text-sm font-mono hover:bg-zinc-600 transition-all">
                          <Lock className="w-3 h-3" />
                          Login
                        </a>
                      ) : (
                        <button
                          disabled={outOfStock}
                          className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-mono font-bold transition-all disabled:opacity-50"
                        >
                          Comprar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Buy Dialog */}
      <Dialog open={selectedItem !== null} onOpenChange={() => { setSelectedItem(null); setUserNote(""); setQuantity(1); }}>
        <DialogContent className="bg-zinc-900 border border-red-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-xl text-red-400">CONFIRMAR COMPRA</DialogTitle>
            <DialogDescription className="text-gray-400">
              Revisa los detalles antes de confirmar
            </DialogDescription>
          </DialogHeader>
          {itemToBuy && (
            <div className="space-y-4">
              <div className="flex gap-3 p-3 rounded-lg bg-zinc-800 border border-white/10">
                {itemToBuy.image ? (
                  <img src={itemToBuy.image} alt={itemToBuy.name} className="w-16 h-16 rounded object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded bg-zinc-700 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-white">{itemToBuy.name}</p>
                  <p className="text-gray-400 text-sm">{CATEGORY_LABELS[itemToBuy.category]}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 font-mono font-bold">{itemToBuy.price} RLC</span>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              {itemToBuy.stock !== 1 && (
                <div>
                  <label className="text-sm text-gray-400 font-mono mb-2 block">CANTIDAD</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded border border-white/20 text-white hover:border-red-500 transition-colors"
                    >-</button>
                    <span className="font-bold font-mono text-lg w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(itemToBuy.stock === -1 ? 99 : itemToBuy.stock, quantity + 1))}
                      className="w-8 h-8 rounded border border-white/20 text-white hover:border-red-500 transition-colors"
                    >+</button>
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="text-sm text-gray-400 font-mono mb-2 block">NOTA PARA EL ADMIN (opcional)</label>
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="Ej: Talla M, color azul, nombre de usuario..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-red-500 focus:outline-none resize-none"
                />
              </div>

              {/* Summary */}
              <div className="p-3 rounded-lg bg-black border border-white/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-mono">{totalCost} RLC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tu balance</span>
                  <span className={`font-mono ${userBalance < totalCost ? "text-red-400" : "text-green-400"}`}>{userBalance} RLC</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                  <span>Balance restante</span>
                  <span className={`font-mono ${userBalance - totalCost < 0 ? "text-red-400" : "text-yellow-400"}`}>
                    {userBalance - totalCost} RLC
                  </span>
                </div>
              </div>

              {userBalance < totalCost && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Saldo insuficiente. Gana más RLC en la sección de Recompensas.
                </div>
              )}

              <Button
                onClick={() => buyMutation.mutate({ itemId: itemToBuy.id, quantity, userNote: userNote || undefined })}
                disabled={buyMutation.isPending || userBalance < totalCost}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-mono font-bold"
              >
                {buyMutation.isPending ? "Procesando..." : `Confirmar — ${totalCost} RLC`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
