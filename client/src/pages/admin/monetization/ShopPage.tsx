import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { ShoppingBag, Plus, Package, Zap, MapPin, Key, AlertCircle, CheckCircle, XCircle, ChevronRight, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "../components/AdminUI";

const isPhysicalCat = (cat?: string | null) => cat === "physical" || cat === "bundle";

// ─── AI Price Report Card ─────────────────────────────────────────────────────
function AIPriceCard({ report, onAccept }: { report: any; onAccept: (price: number) => void }) {
  const rarityColors: Record<string, string> = {
    "COMÚN": "text-gray-400 border-gray-500/30 bg-gray-500/10",
    "RARO": "text-blue-400 border-blue-500/30 bg-blue-500/10",
    "ÉPICO": "text-purple-400 border-purple-500/30 bg-purple-500/10",
    "LEGENDARIO": "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  };
  return (
    <div className="bg-gradient-to-br from-red-950/40 to-zinc-900/80 border border-red-700/40 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
        </div>
        <span className="text-xs font-orbitron text-red-400 uppercase tracking-wider">RLC Economy Architect</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/20 rounded-lg p-3">
          <p className="text-xs text-zinc-500 font-mono mb-0.5">TIPO</p>
          <p className="text-white font-rajdhani font-bold text-sm">{report.type}</p>
        </div>
        {report.rarity && (
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-zinc-500 font-mono mb-0.5">RAREZA</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${rarityColors[report.rarity] ?? "text-gray-400"}`}>{report.rarity}</span>
          </div>
        )}
        {report.marketPriceUSD && (
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-zinc-500 font-mono mb-0.5">PRECIO MERCADO</p>
            <p className="text-white font-rajdhani font-bold text-sm">${report.marketPriceUSD.toFixed(2)} USD</p>
          </div>
        )}
        <div className="bg-black/20 rounded-lg p-3">
          <p className="text-xs text-zinc-500 font-mono mb-0.5">ESFUERZO</p>
          <p className="text-white font-rajdhani font-bold text-sm">{report.effortHours.toFixed(1)}h actividad</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 bg-red-600/10 border border-red-600/30 rounded-xl p-3">
        <div>
          <p className="text-xs text-zinc-500 font-mono">PRECIO SUGERIDO</p>
          <p className="text-2xl font-orbitron font-bold text-red-400">{report.suggestedPriceRLC.toLocaleString()} <span className="text-sm text-zinc-500">RLC</span></p>
        </div>
        <Button onClick={() => onAccept(report.suggestedPriceRLC)} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs flex-shrink-0">
          APLICAR
        </Button>
      </div>
      <p className="text-xs text-zinc-500 font-rajdhani leading-relaxed">{report.justification}</p>
    </div>
  );
}

export function ShopPage() {
  const emptyForm = { name: "", description: "", imageUrl: "", price: "", stock: "", category: "digital" as any, maxPerUser: null as number | null };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [deliveryCodes, setDeliveryCodes] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<"pending" | "processing" | "delivered" | "cancelled" | "all">("all");
  const [editingItem, setEditingItem] = useState<null | { id: number; name: string; description: string; imageUrl: string; price: string; stock: string; category: string; maxPerUser: number | null; isActive: boolean; isFeatured: boolean }>(null);
  const [uploadingEditImg, setUploadingEditImg] = useState(false);
  const [aiEditReport, setAiEditReport] = useState<any>(null);

  const { data: orders, refetch: refetchOrders } = trpc.admin.listOrders.useQuery();
  const { data: shopItemsList = [], refetch: refetchItems } = trpc.admin.listShopItems.useQuery();
  const uploadImage = trpc.admin.uploadImage.useMutation();

  const suggestPrice = trpc.admin.suggestPrice.useMutation({
    onSuccess: (data) => { setAiReport(data); toast.success("Precio sugerido por IA"); },
    onError: e => toast.error("Error IA: " + e.message),
  });
  const suggestPriceEdit = trpc.admin.suggestPrice.useMutation({
    onSuccess: (data) => { setAiEditReport(data); toast.success("Precio sugerido por IA"); },
    onError: e => toast.error("Error IA: " + e.message),
  });

  const createItem = trpc.admin.createShopItem.useMutation({
    onSuccess: () => { toast.success("Producto creado"); setShowForm(false); setForm(emptyForm); setAiReport(null); refetchItems(); },
    onError: e => toast.error(e.message),
  });
  const updateItem = trpc.admin.updateShopItem.useMutation({
    onSuccess: () => { toast.success("Producto actualizado"); setEditingItem(null); setAiEditReport(null); refetchItems(); },
    onError: e => toast.error(e.message),
  });
  const deleteItem = trpc.admin.deleteShopItem.useMutation({
    onSuccess: () => { toast.success("Producto eliminado"); refetchItems(); },
    onError: e => toast.error(e.message),
  });
  const updateOrder = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => { toast.success("Pedido actualizado"); refetchOrders(); },
    onError: e => toast.error(e.message),
  });

  const handleImageUpload = async (file: File, isEdit = false) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
    if (isEdit) setUploadingEditImg(true); else setUploadingImg(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const result = await uploadImage.mutateAsync({ base64, mimeType: file.type as any, folder: "shop/products" });
      if (isEdit) { setEditingItem(ei => ei ? { ...ei, imageUrl: result.url } : ei); setUploadingEditImg(false); }
      else { setForm(f => ({ ...f, imageUrl: result.url })); setUploadingImg(false); }
    };
    reader.readAsDataURL(file);
  };

  const inputCls = "w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500";

  return (
    <div className="space-y-6 w-full">
      <PageHeader icon={ShoppingBag} title="TIENDA" subtitle="Gestiona productos y pedidos" />

      {/* Create product */}
      <Button onClick={() => { setShowForm(!showForm); setAiReport(null); }} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
        <Plus className="w-3.5 h-3.5 mr-1.5" /> NUEVO PRODUCTO
      </Button>

      {showForm && (
        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-orbitron text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-red-400" /> NUEVO PRODUCTO
          </h3>

          {/* Name + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Nombre *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Teclado Mecánico HyperX" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Categoría</label>
              <Select value={form.category} onValueChange={v => { setForm(f => ({ ...f, category: v as any })); setAiReport(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">📦 Físico</SelectItem>
                  <SelectItem value="digital">⚡ Digital</SelectItem>
                  <SelectItem value="bundle">🎁 Paquete</SelectItem>
                  <SelectItem value="limited">⏱ Edición Limitada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Descripción</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe el producto..." rows={2} className={`${inputCls} resize-none`} />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2 font-rajdhani uppercase">Imagen del producto</label>
            <div className="flex items-start gap-4">
              {form.imageUrl ? (
                <div className="relative flex-shrink-0">
                  <img src={form.imageUrl} alt="" className="w-24 h-24 object-cover rounded-xl border border-white/10" />
                  <button onClick={() => setForm(f => ({ ...f, imageUrl: "" }))} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700">
                    <XCircle className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex-shrink-0">
                  <div className="w-24 h-24 bg-zinc-800 hover:bg-zinc-700 border-2 border-dashed border-white/10 hover:border-red-500 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors">
                    {uploadingImg
                      ? <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <><Plus className="w-5 h-5 text-zinc-500" /><span className="text-xs text-zinc-500 font-rajdhani">Imagen</span></>}
                  </div>
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingImg} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                </label>
              )}
              <div className="flex-1 text-xs text-zinc-500 font-rajdhani leading-relaxed pt-1">
                <p className="text-white font-semibold mb-1">Imagen de portada</p>
                <p>Se mostrará en la tienda y en el carrito. Recomendado: 800×800px, JPG o PNG.</p>
                {form.imageUrl && (
                  <label className="cursor-pointer mt-2 inline-block">
                    <span className="text-red-400 hover:text-red-300 underline">Cambiar imagen</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingImg} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* RLC Economy Architect - AI Price Suggestion */}
          <div className="flex items-center justify-between bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">
            <div>
              <p className="text-xs font-orbitron text-red-400 uppercase tracking-wider">✦ RLC Economy Architect</p>
              <p className="text-xs text-zinc-500 font-rajdhani mt-0.5">Escribe el nombre del producto y presiona para obtener un precio sugerido por IA</p>
            </div>
            <Button
              type="button"
              disabled={!form.name || suggestPrice.isPending}
              onClick={() => suggestPrice.mutate({ name: form.name, description: form.description || undefined, category: form.category })}
              className="flex-shrink-0 ml-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-orbitron text-xs px-4 py-2 h-auto"
            >
              {suggestPrice.isPending
                ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Analizando...</>
                : <><Sparkles className="w-3.5 h-3.5 mr-2" />SUGERIR PRECIO IA</>}
            </Button>
          </div>

          {/* AI Report */}
          {aiReport && (
            <AIPriceCard report={aiReport} onAccept={(price) => { setForm(f => ({ ...f, price: String(price) })); setAiReport(null); }} />
          )}

          {/* Price + Stock + MaxPerUser */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Precio (RLC) *</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="500" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Stock (-1 = ∞)</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="-1" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Límite / usuario</label>
              <input type="number" value={form.maxPerUser ?? ""} onChange={e => setForm(f => ({ ...f, maxPerUser: e.target.value ? parseInt(e.target.value) : null }))} placeholder="Sin límite" min={1} className={inputCls} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button onClick={() => createItem.mutate({ ...form, price: parseInt(form.price), stock: parseInt(form.stock) || -1, maxPerUser: form.maxPerUser ?? null })}
              disabled={!form.name || !form.price || createItem.isPending || uploadingImg} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
              {createItem.isPending ? "CREANDO..." : "CREAR PRODUCTO"}
            </Button>
            <Button onClick={() => { setShowForm(false); setAiReport(null); }} variant="outline" className="border-white/10 text-zinc-400 font-orbitron text-xs">CANCELAR</Button>
          </div>
        </div>
      )}

      {/* Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-orbitron text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-red-400" /> PEDIDOS
            <span className="text-xs text-zinc-500 font-mono">({orders?.length ?? 0} total)</span>
          </h3>
        </div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {(["all", "pending", "processing", "delivered", "cancelled"] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-orbitron border transition-all ${statusFilter === f ? "border-red-500 bg-red-500/10 text-red-400" : "border-white/10 text-zinc-500 hover:border-zinc-500"}`}>
              {f === "pending" ? "PENDIENTES" : f === "processing" ? "EN PROCESO" : f === "delivered" ? "ENTREGADOS" : f === "cancelled" ? "CANCELADOS" : "TODOS"}
              <span className="ml-1.5 opacity-60">({orders?.filter(o => f === "all" ? true : o.status === f).length ?? 0})</span>
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {orders?.filter(o => statusFilter === "all" ? true : o.status === statusFilter).map(order => {
            const physical = isPhysicalCat((order as any).itemCategory);
            let shipping: Record<string, string> | null = null;
            if ((order as any).shippingAddress) { try { shipping = JSON.parse((order as any).shippingAddress); } catch {} }
            const isExpanded = expandedOrder === order.id;
            const code = deliveryCodes[order.id] ?? "";
            return (
              <div key={order.id} className={`bg-zinc-900/60 border rounded-xl overflow-hidden transition-all ${order.status === "pending" ? "border-yellow-900/40" : order.status === "processing" ? "border-blue-900/30" : order.status === "delivered" ? "border-green-900/30" : "border-red-900/20 opacity-70"}`}>
                <div className="p-4 flex items-center gap-3 flex-wrap cursor-pointer" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                    {(order as any).itemImage ? <img src={(order as any).itemImage} alt="" className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center ${physical ? "bg-orange-500/20" : "bg-blue-500/20"}`}>{physical ? <Package className="w-5 h-5 text-orange-400" /> : <Zap className="w-5 h-5 text-blue-400" />}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    {(order as any).itemName && <p className="text-white font-rajdhani font-bold text-sm">{(order as any).itemName}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-zinc-500 font-mono text-xs">#{order.id}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono border ${physical ? "text-orange-400 border-orange-500/30 bg-orange-500/10" : "text-blue-400 border-blue-500/30 bg-blue-500/10"}`}>{physical ? "FÍSICO" : "DIGITAL"}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono border ${order.status === "pending" ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" : order.status === "processing" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" : order.status === "delivered" ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"}`}>
                        {order.status === "pending" ? "PENDIENTE" : order.status === "processing" ? "EN PROCESO" : order.status === "delivered" ? "ENTREGADO" : "CANCELADO"}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs">{new Date(order.createdAt).toLocaleString("es")} · x{order.quantity} · {order.totalPrice ?? "?"} RLC</p>
                    {(order as any).userName && <p className="text-zinc-500 text-xs">Usuario: <span className="text-white">{(order as any).userName}</span></p>}
                  </div>
                  <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                </div>
                {isExpanded && (
                  <div className="border-t border-white/5 p-4 space-y-3">
                    {physical && shipping && (
                      <div className="bg-zinc-800/40 rounded-lg p-3 space-y-1.5">
                        <p className="text-xs font-orbitron text-zinc-400 mb-2 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> DIRECCIÓN DE ENVÍO</p>
                        {Object.entries(shipping).map(([k, v]) => v && <p key={k} className="text-xs text-zinc-300 font-rajdhani"><span className="text-zinc-500 capitalize">{k}:</span> {v}</p>)}
                      </div>
                    )}
                    {!physical && (order as any).contactInfo && (
                      <div className="bg-zinc-800/40 rounded-lg p-3">
                        <p className="text-xs font-orbitron text-zinc-400 mb-1 flex items-center gap-1.5"><Phone className="w-3 h-3" /> CONTACTO</p>
                        <p className="text-xs text-zinc-300 font-rajdhani">{(order as any).contactInfo}</p>
                      </div>
                    )}
                    {order.notes && (
                      <div className="bg-zinc-800/40 rounded-lg p-3">
                        <p className="text-xs font-orbitron text-zinc-400 mb-1 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> NOTAS</p>
                        <p className="text-xs text-zinc-300 font-rajdhani">{order.notes}</p>
                      </div>
                    )}
                    {order.deliveryCode && (
                      <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                        <p className="text-xs font-orbitron text-green-400 mb-1 flex items-center gap-1.5"><Key className="w-3 h-3" /> CÓDIGO DE ENTREGA</p>
                        <p className="text-sm text-white font-mono">{order.deliveryCode}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {order.status === "pending" && (
                        <Button size="sm" onClick={() => updateOrder.mutate({ orderId: order.id, status: "processing" })} className="bg-blue-600 hover:bg-blue-700 text-white font-orbitron text-xs h-7">
                          <CheckCircle className="w-3 h-3 mr-1" /> EN PROCESO
                        </Button>
                      )}
                      {(order.status === "pending" || order.status === "processing") && (
                        <>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input value={code} onChange={e => setDeliveryCodes(d => ({ ...d, [order.id]: e.target.value }))} placeholder={physical ? "Número de tracking..." : "Código de entrega..."} className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-green-500 font-mono min-w-0" />
                            <Button size="sm" onClick={() => updateOrder.mutate({ orderId: order.id, status: "delivered", deliveryCode: code || undefined })} className="bg-green-600 hover:bg-green-700 text-white font-orbitron text-xs h-7 flex-shrink-0">
                              <CheckCircle className="w-3 h-3 mr-1" /> ENTREGADO
                            </Button>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => updateOrder.mutate({ orderId: order.id, status: "cancelled" })} className="border-red-900/40 text-red-400 hover:bg-red-900/20 font-orbitron text-xs h-7">
                            <XCircle className="w-3 h-3 mr-1" /> CANCELAR
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {(!orders || orders.filter(o => statusFilter === "all" ? true : o.status === statusFilter).length === 0) && (
            <div className="text-center py-8 text-zinc-600 font-rajdhani">No hay pedidos {statusFilter !== "all" ? `con estado "${statusFilter}"` : ""}</div>
          )}
        </div>
      </div>

      {/* Catalog */}
      <div>
        <h3 className="text-sm font-orbitron text-white flex items-center gap-2 mb-3">
          <ShoppingBag className="w-4 h-4 text-red-400" /> CATÁLOGO
          <span className="text-xs text-zinc-500 font-mono">({shopItemsList.length})</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shopItemsList.map(item => (
            <div key={item.id} className={`bg-zinc-900/60 border rounded-xl overflow-hidden ${item.isActive ? "border-white/10" : "border-white/5 opacity-60"}`}>
              {item.image && <img src={item.image} alt={item.name} className="w-full h-32 object-cover" />}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-white font-rajdhani font-bold text-sm leading-tight">{item.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono border flex-shrink-0 ${isPhysicalCat(item.category) ? "text-orange-400 border-orange-500/30 bg-orange-500/10" : "text-blue-400 border-blue-500/30 bg-blue-500/10"}`}>
                    {isPhysicalCat(item.category) ? "FÍSICO" : "DIGITAL"}
                  </span>
                </div>
                <p className="text-zinc-500 text-xs">{item.price} RLC · Stock: {item.stock === -1 ? "∞" : item.stock}{item.maxPerUser ? ` · Límite: ${item.maxPerUser}/usuario` : ""}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => setEditingItem({ id: item.id, name: item.name, description: item.description ?? "", imageUrl: item.image ?? "", price: String(item.price), stock: String(item.stock), category: item.category ?? "digital", maxPerUser: item.maxPerUser ?? null, isActive: item.isActive ?? true, isFeatured: item.isFeatured ?? false })}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-orbitron text-xs h-7">EDITAR</Button>
                  <Button size="sm" variant="outline" onClick={() => deleteItem.mutate({ id: item.id })} disabled={deleteItem.isPending}
                    className="border-red-900/40 text-red-400 hover:bg-red-900/20 font-orbitron text-xs h-7">BORRAR</Button>
                </div>
              </div>
            </div>
          ))}
          {shopItemsList.length === 0 && (
            <div className="col-span-full text-center py-8 text-zinc-600 font-rajdhani">Sin productos en el catálogo</div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-orbitron text-white">EDITAR PRODUCTO</h3>
              <button onClick={() => { setEditingItem(null); setAiEditReport(null); }} className="text-zinc-500 hover:text-white"><XCircle className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Nombre</label>
                <input value={editingItem.name} onChange={e => setEditingItem(ei => ei ? { ...ei, name: e.target.value } : ei)} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Descripción</label>
                <textarea value={editingItem.description} onChange={e => setEditingItem(ei => ei ? { ...ei, description: e.target.value } : ei)}
                  rows={2} className={`${inputCls} resize-none`} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Imagen</label>
                <div className="flex items-center gap-3">
                  {editingItem.imageUrl && <img src={editingItem.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg border border-white/10 flex-shrink-0" />}
                  <label className="cursor-pointer flex-1">
                    <div className="bg-zinc-800 hover:bg-zinc-700 border border-dashed border-white/10 hover:border-red-500 rounded-lg px-3 py-2 text-zinc-500 text-xs font-rajdhani flex items-center justify-center gap-2 transition-colors">
                      {uploadingEditImg ? <><div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> Subiendo...</> : <><Plus className="w-3.5 h-3.5" /> {editingItem.imageUrl ? "Cambiar" : "Subir imagen"}</>}
                    </div>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingEditImg} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], true)} />
                  </label>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Categoría</label>
                <Select value={editingItem.category} onValueChange={v => { setEditingItem(ei => ei ? { ...ei, category: v } : ei); setAiEditReport(null); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">📦 Físico</SelectItem>
                    <SelectItem value="digital">⚡ Digital</SelectItem>
                    <SelectItem value="bundle">🎁 Paquete</SelectItem>
                    <SelectItem value="limited">⏱ Edición Limitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* AI Suggest Price - Edit */}
            <div className="flex items-center justify-between bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs font-orbitron text-red-400 uppercase tracking-wider">✦ RLC Economy Architect</p>
                <p className="text-xs text-zinc-500 font-rajdhani mt-0.5">Obtén un precio sugerido por IA</p>
              </div>
              <Button
                type="button"
                disabled={!editingItem.name || suggestPriceEdit.isPending}
                onClick={() => suggestPriceEdit.mutate({ name: editingItem.name, description: editingItem.description || undefined, category: editingItem.category as any })}
                className="flex-shrink-0 ml-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-orbitron text-xs px-4 py-2 h-auto"
              >
                {suggestPriceEdit.isPending
                  ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Analizando...</>
                  : <><Sparkles className="w-3.5 h-3.5 mr-2" />SUGERIR PRECIO IA</>}
              </Button>
            </div>

            {aiEditReport && (
              <AIPriceCard report={aiEditReport} onAccept={(price) => { setEditingItem(ei => ei ? { ...ei, price: String(price) } : ei); setAiEditReport(null); }} />
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Precio (RLC)</label>
                <input type="number" value={editingItem.price} onChange={e => setEditingItem(ei => ei ? { ...ei, price: e.target.value } : ei)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Stock (-1 = ∞)</label>
                <input type="number" value={editingItem.stock} onChange={e => setEditingItem(ei => ei ? { ...ei, stock: e.target.value } : ei)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Límite/usuario</label>
                <input type="number" value={editingItem.maxPerUser ?? ""} min={1}
                  onChange={e => setEditingItem(ei => ei ? { ...ei, maxPerUser: e.target.value ? parseInt(e.target.value) : null } : ei)}
                  placeholder="Sin límite" className={inputCls} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editingItem.isActive} onChange={e => setEditingItem(ei => ei ? { ...ei, isActive: e.target.checked } : ei)} className="w-4 h-4 accent-red-500" />
                <span className="text-xs text-zinc-400 font-rajdhani">Activo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editingItem.isFeatured} onChange={e => setEditingItem(ei => ei ? { ...ei, isFeatured: e.target.checked } : ei)} className="w-4 h-4 accent-yellow-500" />
                <span className="text-xs text-zinc-400 font-rajdhani">Destacado</span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => updateItem.mutate({ id: editingItem.id, name: editingItem.name, description: editingItem.description || undefined, imageUrl: editingItem.imageUrl || undefined, price: parseInt(editingItem.price) || undefined, stock: parseInt(editingItem.stock) !== undefined ? parseInt(editingItem.stock) : undefined, category: editingItem.category as any, isActive: editingItem.isActive, isFeatured: editingItem.isFeatured, maxPerUser: editingItem.maxPerUser })}
                disabled={updateItem.isPending} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
                {updateItem.isPending ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
              </Button>
              <Button onClick={() => { setEditingItem(null); setAiEditReport(null); }} variant="outline" className="border-white/10 text-zinc-400 font-orbitron text-xs">CANCELAR</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
