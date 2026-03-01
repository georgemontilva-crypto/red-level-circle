import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SectionBanner } from "@/components/SectionBanner";
import { toast } from "sonner";
import {
  ShoppingBag, Coins, Package, Zap, Star, Clock, CheckCircle,
  AlertCircle, Lock, Tag, MapPin, Mail, Phone, User, Globe, Hash, Key
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
  pending: { label: "Pendiente", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: <Clock className="w-3 h-3" /> },
  processing: { label: "En proceso", color: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: <AlertCircle className="w-3 h-3" /> },
  delivered: { label: "Entregado", color: "text-green-400 bg-green-400/10 border-green-400/30", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Cancelado", color: "text-red-400 bg-red-400/10 border-red-400/30", icon: <AlertCircle className="w-3 h-3" /> },
};

const isPhysicalCategory = (cat: string) => cat === "physical" || cat === "bundle";

export default function Shop() {
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [userNote, setUserNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showOrders, setShowOrders] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [shippingForm, setShippingForm] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    contact: "",
  });

  const { data: items = [], refetch } = trpc.shop.list.useQuery({
    category: activeCategory === "all" ? undefined : activeCategory,
  });

  const { data: myOrders = [], refetch: refetchOrders } = trpc.shop.myOrders.useQuery(
    undefined, { enabled: isAuthenticated }
  );

  const { data: me, refetch: refetchMe } = trpc.auth.me.useQuery();

  const resetModal = () => {
    setSelectedItem(null);
    setUserNote("");
    setQuantity(1);
    setConfirmEmail("");
    setShippingForm({ fullName: "", address: "", city: "", state: "", country: "", postalCode: "", contact: "" });
  };

  const buyMutation = trpc.shop.buy.useMutation({
    onSuccess: (data) => {
      toast.success(`¡Compra realizada! Nuevo balance: ${data.newBalance} RLC Coins`, {
        description: "El administrador procesará tu pedido pronto.",
        style: { background: "#0a0a0a", border: "1px solid #ff0000", color: "#fff" },
      });
      resetModal();
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
  const isPhysical = itemToBuy ? isPhysicalCategory(itemToBuy.category) : false;

  const shippingValid = !isPhysical || (
    shippingForm.fullName.trim() &&
    shippingForm.address.trim() &&
    shippingForm.city.trim() &&
    shippingForm.country.trim() &&
    shippingForm.postalCode.trim() &&
    shippingForm.contact.trim()
  );

  const handleBuy = () => {
    if (!itemToBuy) return;
    const shippingJson = isPhysical ? JSON.stringify(shippingForm) : undefined;
    const noteWithEmail = !isPhysical && confirmEmail
      ? `Email: ${confirmEmail}${userNote ? ` | ${userNote}` : ""}`
      : (userNote || undefined);
    buyMutation.mutate({
      itemId: itemToBuy.id,
      quantity,
      userNote: noteWithEmail,
      shippingAddress: shippingJson,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Section Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <SectionBanner sectionKey="shop" height="h-48 sm:h-64 lg:h-72" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* My Orders toggle */}
        {isAuthenticated && (
          <div className="mb-6">
            <button
              onClick={() => setShowOrders(!showOrders)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-zinc-900 text-gray-300 hover:border-red-500/50 hover:text-white transition-all text-sm font-mono"
            >
              <Package className="w-4 h-4" />
              MIS PEDIDOS {myOrders.length > 0 && `(${myOrders.length})`}
            </button>
          </div>
        )}

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
                  itemCategory?: string | null;
                  quantity: number;
                  totalPrice: number;
                  status: string;
                  deliveryNote?: string | null;
                  userNote?: string | null;
                  shippingAddress?: string | null;
                  createdAt: Date;
                }>).map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                  const isOrderPhysical = order.itemCategory ? isPhysicalCategory(order.itemCategory) : false;
                  let parsedShipping: Record<string, string> | null = null;
                  if (order.shippingAddress) {
                    try { parsedShipping = JSON.parse(order.shippingAddress); } catch {}
                  }
                  return (
                    <div key={order.id} className="px-6 py-4 space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {order.itemImage ? (
                            <img src={order.itemImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white truncate">{order.itemName ?? "Producto"}</p>
                            {order.itemCategory && (
                              <span className={`text-xs px-1.5 py-0.5 rounded font-mono border ${isOrderPhysical ? "text-orange-400 border-orange-500/30 bg-orange-500/10" : "text-blue-400 border-blue-500/30 bg-blue-500/10"}`}>
                                {isOrderPhysical ? "FÍSICO" : "DIGITAL"}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm">x{order.quantity} · {order.totalPrice} RLC · #{order.id}</p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono ${statusCfg.color}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </div>
                      </div>
                      {/* Delivery code for digital */}
                      {!isOrderPhysical && order.deliveryNote && (
                        <div className="ml-16 flex items-start gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-xs">
                          <Key className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold mb-0.5">Código / Acceso:</p>
                            <p className="font-mono break-all">{order.deliveryNote}</p>
                          </div>
                        </div>
                      )}
                      {/* Shipping info for physical */}
                      {isOrderPhysical && parsedShipping && (
                        <div className="ml-16 flex items-start gap-2 p-2 rounded-lg bg-zinc-800/60 border border-white/5 text-gray-400 text-xs">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-orange-400" />
                          <span>{parsedShipping.fullName}, {parsedShipping.address}, {parsedShipping.city}, {parsedShipping.country} {parsedShipping.postalCode}</span>
                        </div>
                      )}
                      {/* Delivery note for physical */}
                      {isOrderPhysical && order.deliveryNote && (
                        <div className="ml-16 flex items-center gap-2 text-blue-300 text-xs">
                          <Package size={11} />
                          <span>{order.deliveryNote}</span>
                        </div>
                      )}
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
                    {/* Category badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded font-mono flex items-center gap-1 ${
                        isPhysicalCategory(item.category)
                          ? "bg-orange-500/80 text-white"
                          : "bg-blue-500/80 text-white"
                      }`}>
                        {isPhysicalCategory(item.category) ? <Package className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                        {isPhysicalCategory(item.category) ? "FÍSICO" : "DIGITAL"}
                      </span>
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
      <Dialog open={selectedItem !== null} onOpenChange={resetModal}>
        <DialogContent className="bg-zinc-900 border border-red-500/30 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-xl text-red-400 flex items-center gap-2">
              {isPhysical
                ? <><Package className="w-5 h-5" /> PEDIDO FÍSICO</>
                : <><Key className="w-5 h-5" /> ENTREGA DIGITAL</>}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {isPhysical
                ? "Necesitamos tu dirección de envío para procesar el pedido."
                : "Recibirás el código o acceso por notificación en la plataforma."}
            </DialogDescription>
          </DialogHeader>

          {itemToBuy && (
            <div className="space-y-5">
              {/* Product summary */}
              <div className="flex gap-3 p-3 rounded-lg bg-zinc-800 border border-white/10">
                {itemToBuy.image ? (
                  <img src={itemToBuy.image} alt={itemToBuy.name} className="w-16 h-16 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{itemToBuy.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {CATEGORY_ICONS[itemToBuy.category]}
                    <span className="text-gray-400 text-xs font-mono">{CATEGORY_LABELS[itemToBuy.category]}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 font-mono font-bold">{itemToBuy.price} RLC / ud.</span>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              {itemToBuy.stock !== 1 && (
                <div>
                  <label className="text-xs text-gray-400 font-mono mb-2 block uppercase">Cantidad</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded border border-white/20 text-white hover:border-red-500 transition-colors">-</button>
                    <span className="font-bold font-mono text-lg w-8 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(itemToBuy.stock === -1 ? 99 : itemToBuy.stock, quantity + 1))} className="w-8 h-8 rounded border border-white/20 text-white hover:border-red-500 transition-colors">+</button>
                  </div>
                </div>
              )}

              {/* PHYSICAL / BUNDLE: Shipping address form */}
              {isPhysical && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-orange-400 uppercase">
                    <MapPin className="w-3.5 h-3.5" />
                    Dirección de envío (obligatoria)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Nombre completo *</label>
                      <input value={shippingForm.fullName} onChange={e => setShippingForm(f => ({...f, fullName: e.target.value}))} placeholder="Juan Pérez" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-red-500 focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Dirección *</label>
                      <input value={shippingForm.address} onChange={e => setShippingForm(f => ({...f, address: e.target.value}))} placeholder="Calle Mayor 12, 3º A" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Ciudad *</label>
                      <input value={shippingForm.city} onChange={e => setShippingForm(f => ({...f, city: e.target.value}))} placeholder="Madrid" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Provincia / Estado</label>
                      <input value={shippingForm.state} onChange={e => setShippingForm(f => ({...f, state: e.target.value}))} placeholder="Madrid" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> País *</label>
                      <input value={shippingForm.country} onChange={e => setShippingForm(f => ({...f, country: e.target.value}))} placeholder="España" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> Código postal *</label>
                      <input value={shippingForm.postalCode} onChange={e => setShippingForm(f => ({...f, postalCode: e.target.value}))} placeholder="28001" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-red-500 focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Discord o teléfono de contacto *</label>
                      <input value={shippingForm.contact} onChange={e => setShippingForm(f => ({...f, contact: e.target.value}))} placeholder="usuario#1234 o +34 600 000 000" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-red-500 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    Tus datos de envío son confidenciales y solo se usarán para procesar este pedido.
                  </div>
                </div>
              )}

              {/* DIGITAL / LIMITED: Info + optional email */}
              {!isPhysical && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase">
                    <Mail className="w-3.5 h-3.5" />
                    Entrega digital
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm space-y-1">
                    <p className="font-semibold">¿Cómo recibirás tu producto?</p>
                    <p className="text-xs text-blue-400">Una vez procesado, el código o acceso aparecerá en tu historial de pedidos y recibirás una notificación in-app.</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email de confirmación (opcional)</label>
                    <input type="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-red-500 focus:outline-none" />
                    <p className="text-xs text-gray-600 mt-1">Si lo dejas vacío, solo recibirás la notificación en la plataforma.</p>
                  </div>
                </div>
              )}

              {/* Optional note */}
              <div>
                <label className="text-xs text-gray-400 font-mono mb-2 block uppercase">Nota adicional (opcional)</label>
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder={isPhysical ? "Ej: Talla M, color azul, instrucciones especiales..." : "Ej: Nombre de usuario, plataforma preferida..."}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-red-500 focus:outline-none resize-none"
                />
              </div>

              {/* Summary */}
              <div className="p-3 rounded-lg bg-black border border-white/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal ({quantity}x)</span>
                  <span className="font-mono">{totalCost} RLC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tu balance</span>
                  <span className={`font-mono ${userBalance < totalCost ? "text-red-400" : "text-green-400"}`}>{userBalance} RLC</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                  <span>Balance restante</span>
                  <span className={`font-mono ${userBalance - totalCost < 0 ? "text-red-400" : "text-yellow-400"}`}>{userBalance - totalCost} RLC</span>
                </div>
              </div>

              {userBalance < totalCost && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Saldo insuficiente. Gana más RLC en la sección de Recompensas.
                </div>
              )}

              {isPhysical && !shippingValid && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Completa todos los campos obligatorios de envío (*) para continuar.
                </div>
              )}

              <Button
                onClick={handleBuy}
                disabled={buyMutation.isPending || userBalance < totalCost || !shippingValid}
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
