import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { ShoppingBag, Plus, Package, Zap, MapPin, Key, AlertCircle, CheckCircle, XCircle, ChevronRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "../components/AdminUI";

const isPhysicalCat = (cat?: string | null) => cat === "physical" || cat === "bundle";

export function ShopPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", price: "", stock: "", category: "digital" as any, maxPerUser: null as number | null });
  const [uploadingImg, setUploadingImg] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [deliveryCodes, setDeliveryCodes] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<"pending" | "processing" | "delivered" | "cancelled" | "all">("all");
  const [editingItem, setEditingItem] = useState<null | { id: number; name: string; description: string; imageUrl: string; price: string; stock: string; category: string; maxPerUser: number | null; isActive: boolean; isFeatured: boolean }>(null);
  const [uploadingEditImg, setUploadingEditImg] = useState(false);

  const { data: orders, refetch: refetchOrders } = trpc.admin.listOrders.useQuery();
  const { data: shopItemsList = [], refetch: refetchItems } = trpc.admin.listShopItems.useQuery();
  const uploadImage = trpc.admin.uploadImage.useMutation();
  const createItem = trpc.admin.createShopItem.useMutation({
    onSuccess: () => { toast.success("Producto creado"); setShowForm(false); setForm({ name: "", description: "", imageUrl: "", price: "", stock: "", category: "digital", maxPerUser: null }); refetchItems(); },
    onError: e => toast.error(e.message),
  });
  const updateItem = trpc.admin.updateShopItem.useMutation({
    onSuccess: () => { toast.success("Producto actualizado"); setEditingItem(null); refetchItems(); },
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
    <div className="space-y-6 max-w-5xl">
      <PageHeader icon={ShoppingBag} title="TIENDA" subtitle="Gestiona productos y pedidos" />

      {/* Create product */}
      <Button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
        <Plus className="w-3.5 h-3.5 mr-1.5" /> NUEVO PRODUCTO
      </Button>
      {showForm && (
        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Nombre</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre del producto" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Imagen del producto</label>
              <div className="flex items-center gap-3">
                {form.imageUrl && <img src={form.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg border border-white/10 flex-shrink-0" />}
                <label className="cursor-pointer flex-1">
                  <div className="bg-zinc-800 hover:bg-zinc-700 border border-dashed border-white/10 hover:border-red-500 rounded-lg px-3 py-3 text-zinc-500 text-xs font-rajdhani flex items-center justify-center gap-2 transition-colors">
                    {uploadingImg ? <><div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> Subiendo...</> : <><Plus className="w-3.5 h-3.5" /> {form.imageUrl ? "Cambiar" : "Subir imagen"}</>}
                  </div>
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingImg} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Precio (RLC)</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="500" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Stock (-1 = ilimitado)</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="-1" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Categoría</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Físico</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="bundle">Paquete</SelectItem>
                  <SelectItem value="limited">Edición Limitada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Límite por usuario</label>
              <input type="number" value={form.maxPerUser ?? ""} onChange={e => setForm(f => ({ ...f, maxPerUser: e.target.value ? parseInt(e.target.value) : null }))} placeholder="Sin límite" min={1} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Descripción</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del producto..." rows={2} className={`${inputCls} resize-none`} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => createItem.mutate({ ...form, price: parseInt(form.price), stock: parseInt(form.stock) || -1, maxPerUser: form.maxPerUser ?? null })}
              disabled={!form.name || !form.price || createItem.isPending || uploadingImg} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
              CREAR PRODUCTO
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="border-white/10 text-zinc-400 font-orbitron text-xs">CANCELAR</Button>
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
                  <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    {physical && shipping && (
                      <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 space-y-1">
                        <p className="text-xs font-mono text-orange-400 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> DIRECCIÓN DE ENVÍO</p>
                        <p className="text-white text-sm font-semibold">{shipping.fullName}</p>
                        <p className="text-zinc-400 text-xs">{shipping.address}</p>
                        <p className="text-zinc-400 text-xs">{shipping.city}{shipping.state ? `, ${shipping.state}` : ""} · {shipping.postalCode}</p>
                        <p className="text-zinc-400 text-xs">{shipping.country}</p>
                        <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {shipping.contact}</p>
                      </div>
                    )}
                    {(order as any).userNote && (
                      <div className="p-2 rounded-lg bg-zinc-800/60 border border-white/5">
                        <p className="text-xs text-zinc-500 mb-1">Nota del usuario:</p>
                        <p className="text-zinc-300 text-sm">{(order as any).userNote}</p>
                      </div>
                    )}
                    {!physical && (
                      <div>
                        <label className="text-xs text-zinc-500 font-mono mb-1 block flex items-center gap-1"><Key className="w-3 h-3" /> CÓDIGO / ACCESO DIGITAL</label>
                        <input value={code} onChange={e => setDeliveryCodes(d => ({...d, [order.id]: e.target.value}))} placeholder="Ej: XXXX-XXXX-XXXX o URL de acceso"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none font-mono" />
                        <p className="text-xs text-zinc-600 mt-1">El código se enviará al usuario al marcar como entregado.</p>
                      </div>
                    )}
                    {physical && (
                      <div>
                        <label className="text-xs text-zinc-500 font-mono mb-1 block flex items-center gap-1"><Package className="w-3 h-3" /> NÚMERO DE SEGUIMIENTO (opcional)</label>
                        <input value={code} onChange={e => setDeliveryCodes(d => ({...d, [order.id]: e.target.value}))} placeholder="Ej: ES123456789ES"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none font-mono" />
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {order.status === "pending" && (
                        <Button size="sm" onClick={() => updateOrder.mutate({ orderId: order.id, status: "processing" })}
                          className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-700/40 font-orbitron text-xs h-7">
                          <AlertCircle className="w-3 h-3 mr-1" /> EN PROCESO
                        </Button>
                      )}
                      <Button size="sm" onClick={() => updateOrder.mutate({ orderId: order.id, status: "delivered", deliveryNote: code || undefined })}
                        disabled={!physical && !code.trim()}
                        className="bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-700/40 font-orbitron text-xs h-7 disabled:opacity-40">
                        <CheckCircle className="w-3 h-3 mr-1" /> {physical ? "ENTREGADO" : "ENTREGAR CÓDIGO"}
                      </Button>
                      <Button size="sm" onClick={() => updateOrder.mutate({ orderId: order.id, status: "cancelled" })}
                        className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-700/40 font-orbitron text-xs h-7">
                        <XCircle className="w-3 h-3 mr-1" /> CANCELAR
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Product list */}
      <div>
        <h3 className="text-sm font-orbitron text-white mb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" /> CATÁLOGO ({shopItemsList.length})
        </h3>
        <div className="space-y-2">
          {shopItemsList.map((item: any) => (
            <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.isActive ? "bg-zinc-900/60 border-white/8" : "bg-zinc-900/30 border-white/5 opacity-60"}`}>
              {item.image ? <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-5 h-5 text-zinc-600" /></div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-rajdhani font-semibold text-sm truncate">{item.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono border ${isPhysicalCat(item.category) ? "text-orange-400 border-orange-500/30 bg-orange-500/10" : "text-blue-400 border-blue-500/30 bg-blue-500/10"}`}>{isPhysicalCat(item.category) ? "FÍSICO" : "DIGITAL"}</span>
                  {!item.isActive && <span className="text-xs px-1.5 py-0.5 rounded font-mono border text-red-400 border-red-500/30 bg-red-500/10">INACTIVO</span>}
                  {item.isFeatured && <span className="text-xs px-1.5 py-0.5 rounded font-mono border text-yellow-400 border-yellow-500/30 bg-yellow-500/10">DESTACADO</span>}
                </div>
                <p className="text-zinc-500 text-xs">{item.price} RLC · Stock: {item.stock === -1 ? "∞" : item.stock}{item.maxPerUser ? ` · Límite: ${item.maxPerUser}/usuario` : ""}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <Button size="sm" onClick={() => setEditingItem({ id: item.id, name: item.name, description: item.description ?? "", imageUrl: item.image ?? "", price: String(item.price), stock: String(item.stock), category: item.category ?? "digital", maxPerUser: item.maxPerUser ?? null, isActive: item.isActive ?? true, isFeatured: item.isFeatured ?? false })}
                  className="h-7 text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-orbitron">EDITAR</Button>
                <Button size="sm" onClick={() => updateItem.mutate({ id: item.id, isActive: !item.isActive })}
                  className={`h-7 text-xs font-orbitron ${item.isActive ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400" : "bg-green-900/30 hover:bg-green-900/50 text-green-400"}`}>
                  {item.isActive ? "PAUSAR" : "ACTIVAR"}
                </Button>
                <Button size="sm" onClick={() => { if (confirm("¿Eliminar este producto?")) deleteItem.mutate({ id: item.id }); }}
                  className="h-7 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 font-orbitron">✕</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit product modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setEditingItem(null); }}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-orbitron text-white text-sm tracking-widest">EDITAR PRODUCTO</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Nombre</label>
                <input value={editingItem.name} onChange={e => setEditingItem(ei => ei ? { ...ei, name: e.target.value } : ei)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Precio (RLC)</label>
                <input type="number" value={editingItem.price} onChange={e => setEditingItem(ei => ei ? { ...ei, price: e.target.value } : ei)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Stock (-1 = ∞)</label>
                <input type="number" value={editingItem.stock} onChange={e => setEditingItem(ei => ei ? { ...ei, stock: e.target.value } : ei)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Categoría</label>
                <Select value={editingItem.category} onValueChange={v => setEditingItem(ei => ei ? { ...ei, category: v } : ei)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Físico</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="bundle">Paquete</SelectItem>
                    <SelectItem value="limited">Edición Limitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Imagen</label>
                <div className="flex items-center gap-3">
                  {editingItem.imageUrl && <img src={editingItem.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg border border-white/10" />}
                  <label className="cursor-pointer flex-1">
                    <div className="bg-zinc-800 hover:bg-zinc-700 border border-dashed border-white/10 hover:border-red-500 rounded-lg px-3 py-2 text-zinc-500 text-xs font-rajdhani flex items-center justify-center gap-2 transition-colors">
                      {uploadingEditImg ? <><div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> Subiendo...</> : <><Plus className="w-3.5 h-3.5" /> Cambiar imagen</>}
                    </div>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingEditImg} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], true)} />
                  </label>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingItem.isActive} onChange={e => setEditingItem(ei => ei ? { ...ei, isActive: e.target.checked } : ei)} className="accent-red-500" />
                  <span className="text-xs text-zinc-400 font-rajdhani">ACTIVO</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingItem.isFeatured} onChange={e => setEditingItem(ei => ei ? { ...ei, isFeatured: e.target.checked } : ei)} className="accent-yellow-500" />
                  <span className="text-xs text-zinc-400 font-rajdhani">DESTACADO</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => updateItem.mutate({ id: editingItem.id, name: editingItem.name, price: parseInt(editingItem.price), stock: parseInt(editingItem.stock), category: editingItem.category as any, imageUrl: editingItem.imageUrl || undefined, isActive: editingItem.isActive, isFeatured: editingItem.isFeatured, maxPerUser: editingItem.maxPerUser })}
                disabled={updateItem.isPending || uploadingEditImg} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs flex-1">
                GUARDAR CAMBIOS
              </Button>
              <Button onClick={() => setEditingItem(null)} variant="outline" className="border-white/10 text-zinc-400 font-orbitron text-xs">CANCELAR</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
