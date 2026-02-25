import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users, ShoppingBag, Star, Megaphone, Gift, Newspaper,
  Trophy, Coins, Shield, CheckCircle, XCircle, Edit3,
  Trash2, Plus, Package, Eye, BarChart3, Crown, Youtube, Twitch, Twitter, Instagram, Clock, Gamepad2,
  BadgeCheck, Upload, ImageIcon, X, Layout, ArrowUp, ArrowDown, AlertTriangle, CheckCircle2, RefreshCw, Database
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  arrayMove,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Link } from "wouter";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-600/40 flex items-center justify-center">
        <Icon className="w-5 h-5 text-red-400" />
      </div>
      <div>
        <h2 className="font-orbitron text-white text-lg tracking-wider">{title}</h2>
        {subtitle && <p className="text-gray-500 text-xs font-rajdhani">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = "text-red-400" }: { label: string; value: number | string; icon: any; color?: string }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={`text-2xl font-orbitron font-bold ${color}`}>{value}</p>
        <p className="text-gray-500 text-xs font-rajdhani">{label}</p>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState("");
  const [rlcForm, setRlcForm] = useState<{ userId: number; amount: string; reason: string } | null>(null);
  const { data: users, refetch } = trpc.admin.listUsers.useQuery({ search: search || undefined });
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success("Rol actualizado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const adjustRLC = trpc.admin.adjustRLC.useMutation({
    onSuccess: () => { toast.success("RLC ajustado"); setRlcForm(null); refetch(); },
    onError: e => toast.error(e.message),
  });

  const roleColors: Record<string, string> = {
    admin: "bg-yellow-500/20 text-yellow-400 border-yellow-600/40",
    premium: "bg-red-500/20 text-red-400 border-red-600/40",
    user: "bg-gray-500/20 text-gray-400 border-gray-600/40",
  };

  return (
    <div className="space-y-4">
      <SectionHeader icon={Users} title="GESTIÓN DE USUARIOS" subtitle="Administra roles y balances de RLC" />
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre o email..."
        className="w-full bg-black border border-red-900/50 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
      />
      <div className="space-y-2">
        {users?.map(u => (
          <div key={u.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
              <UserAvatar avatar={u.avatar} name={u.name} size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-rajdhani font-semibold truncate">{u.nickname ?? u.name ?? "Sin nombre"}</p>
              <p className="text-gray-500 text-xs truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`font-orbitron text-xs border ${roleColors[u.role] ?? roleColors.user}`}>
                {u.role.toUpperCase()}
              </Badge>
              <span className="text-yellow-400 text-xs font-orbitron">{u.rlcBalance ?? 0} RLC</span>
              <Select
                value={u.role}
                onValueChange={role => updateRole.mutate({ userId: u.id, role: role as any })}
              >
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRlcForm({ userId: u.id, amount: "", reason: "" })}
                className="h-7 text-xs border-yellow-700 text-yellow-400 hover:bg-yellow-950/40"
              >
                <Coins className="w-3 h-3 mr-1" />
                RLC
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* RLC Modal */}
      {rlcForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-orbitron text-red-400 text-sm tracking-widest">AJUSTAR RLC COINS</h3>
            <p className="text-gray-400 text-xs">Usa valores positivos para agregar y negativos para quitar.</p>
            <input
              type="number"
              value={rlcForm.amount}
              onChange={e => setRlcForm(f => f ? { ...f, amount: e.target.value } : null)}
              placeholder="Cantidad (ej: 500 o -100)"
              className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            />
            <input
              value={rlcForm.reason}
              onChange={e => setRlcForm(f => f ? { ...f, reason: e.target.value } : null)}
              placeholder="Motivo (ej: Premio torneo)"
              className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => adjustRLC.mutate({ userId: rlcForm.userId, amount: parseInt(rlcForm.amount), reason: rlcForm.reason })}
                disabled={!rlcForm.amount || !rlcForm.reason || adjustRLC.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs flex-1"
              >
                APLICAR
              </Button>
              <Button onClick={() => setRlcForm(null)} variant="outline" className="border-gray-700 text-gray-400 font-orbitron text-xs">
                CANCELAR
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shop Tab ─────────────────────────────────────────────────────────────────
function ShopTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", price: "", stock: "", category: "digital" as any });
  const [uploadingImg, setUploadingImg] = useState(false);
  const { data: orders, refetch: refetchOrders } = trpc.admin.listOrders.useQuery();
  const uploadImage = trpc.admin.uploadImage.useMutation();
  const createItem = trpc.admin.createShopItem.useMutation({
    onSuccess: () => { toast.success("Producto creado"); setShowForm(false); setForm({ name: "", description: "", imageUrl: "", price: "", stock: "", category: "digital" }); },
    onError: e => toast.error(e.message),
  });
  const updateOrder = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => { toast.success("Pedido actualizado"); refetchOrders(); },
    onError: e => toast.error(e.message),
  });

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5MB"); return; }
    setUploadingImg(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadImage.mutateAsync({ base64, mimeType: file.type as any, folder: "shop/products" });
        setForm(f => ({ ...f, imageUrl: result.url }));
        setUploadingImg(false);
      };
      reader.onerror = () => { toast.error("Error al leer el archivo"); setUploadingImg(false); };
      reader.readAsDataURL(file);
    } catch { toast.error("Error al subir imagen"); setUploadingImg(false); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={ShoppingBag} title="TIENDA DE PRODUCTOS" subtitle="Gestiona productos y pedidos" />

      {/* Create product */}
      <div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs mb-4"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          NUEVO PRODUCTO
        </Button>
        {showForm && (
          <div className="bg-gray-900/60 border border-red-900/40 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Nombre</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nombre del producto"
                  className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              {/* Image upload */}
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Imagen del producto</label>
                <div className="flex items-center gap-3">
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-700 flex-shrink-0" />
                  )}
                  <label className="cursor-pointer flex-1">
                    <div className="bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 hover:border-red-500 rounded-lg px-3 py-3 text-gray-400 text-xs font-rajdhani flex items-center justify-center gap-2 transition-colors">
                      {uploadingImg
                        ? <><div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> Subiendo...</>
                        : <><Plus className="w-3.5 h-3.5" /> {form.imageUrl ? "Cambiar imagen" : "Subir imagen"}</>}
                    </div>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingImg} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Precio (RLC)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="500"
                  className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Stock (-1 = ilimitado)</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="-1"
                  className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Categoría</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Físico</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="limited">Edición Limitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción del producto..."
                  rows={2}
                  className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => createItem.mutate({ ...form, price: parseInt(form.price), stock: parseInt(form.stock) || -1 })}
                disabled={!form.name || !form.price || createItem.isPending || uploadingImg}
                className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs"
              >
                CREAR PRODUCTO
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="border-gray-700 text-gray-400 font-orbitron text-xs">
                CANCELAR
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Orders */}
      <div>
        <h3 className="font-orbitron text-gray-400 text-xs tracking-widest mb-3">PEDIDOS PENDIENTES</h3>
        <div className="space-y-2">
          {orders?.filter(o => o.status === "pending").map(order => (
            <div key={order.id} className="bg-gray-900/60 border border-yellow-900/30 rounded-xl p-4 flex items-center gap-4 flex-wrap">
              <Package className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-rajdhani font-semibold text-sm">Pedido #{order.id}</p>
                <p className="text-gray-500 text-xs">
                  {new Date(order.createdAt).toLocaleString("es")} · {order.quantity}x item
                </p>
                {order.deliveryNote && <p className="text-gray-400 text-xs mt-0.5">Nota: {order.deliveryNote}</p>}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateOrder.mutate({ orderId: order.id, status: "delivered" })}
                  className="bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-700/40 font-orbitron text-xs h-7"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  ENTREGADO
                </Button>
                <Button
                  size="sm"
                  onClick={() => updateOrder.mutate({ orderId: order.id, status: "cancelled" })}
                  className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-700/40 font-orbitron text-xs h-7"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  CANCELAR
                </Button>
              </div>
            </div>
          ))}
          {!orders?.filter(o => o.status === "pending").length && (
            <p className="text-gray-600 text-sm font-rajdhani text-center py-6">Sin pedidos pendientes</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Ads Tab ──────────────────────────────────────────────────────────────────
const AD_TYPE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  featured: { label: "DESTACADO", color: "bg-red-500/20 text-red-400 border-red-600/40", desc: "Carousel hero auto-slide (imagen grande)" },
  card: { label: "CARD", color: "bg-zinc-500/20 text-zinc-300 border-zinc-600/40", desc: "Grid de cards pequeñas (imagen vertical)" },
  wide: { label: "ANCHO", color: "bg-blue-500/20 text-blue-400 border-blue-600/40", desc: "Banner horizontal ancho" },
};

function AdsTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    brand: "", title: "", tagline: "", description: "", imageUrl: "",
    linkUrl: "", ctaLabel: "Ver más", adType: "card" as "featured" | "card" | "wide",
    sortOrder: 0, isPremium: false, isFeatured: false,
  });
  const { data: ads, refetch } = trpc.admin.listAds.useQuery();
  const createAd = trpc.admin.createAd.useMutation({
    onSuccess: () => { toast.success("Publicidad creada"); setShowForm(false); setForm({ brand: "", title: "", tagline: "", description: "", imageUrl: "", linkUrl: "", ctaLabel: "Ver más", adType: "card", sortOrder: 0, isPremium: false, isFeatured: false }); refetch(); },
    onError: e => toast.error(e.message),
  });
  const updateAd = trpc.admin.updateAd.useMutation({
    onSuccess: () => { toast.success("Actualizado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const deleteAd = trpc.admin.deleteAd.useMutation({
    onSuccess: () => { toast.success("Eliminado"); refetch(); },
    onError: e => toast.error(e.message),
  });

  const adsByType = {
    featured: ads?.filter(a => a.adType === "featured") ?? [],
    card: ads?.filter(a => a.adType === "card") ?? [],
    wide: ads?.filter(a => a.adType === "wide") ?? [],
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={Megaphone} title="PUBLICIDAD DE MARCAS" subtitle="Gestiona los anuncios de la plataforma" />

      {/* Type guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(AD_TYPE_LABELS).map(([type, info]) => (
          <div key={type} className={`rounded-lg border p-3 ${info.color.includes("red") ? "border-red-900/40 bg-red-900/10" : info.color.includes("blue") ? "border-blue-900/40 bg-blue-900/10" : "border-zinc-700/40 bg-zinc-900/40"}`}>
            <Badge className={`text-xs mb-1 ${info.color}`}>{info.label}</Badge>
            <p className="text-xs text-gray-400">{info.desc}</p>
            <p className="text-xs text-gray-600 mt-1">{adsByType[type as keyof typeof adsByType].length} anuncio(s)</p>
          </div>
        ))}
      </div>

      <Button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        NUEVO ANUNCIO
      </Button>

      {showForm && (
        <div className="bg-gray-900/60 border border-red-900/40 rounded-xl p-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-rajdhani uppercase">Tipo de anuncio</label>
            <div className="flex gap-2 flex-wrap">
              {(["featured", "card", "wide"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setForm(f => ({ ...f, adType: type }))}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                    form.adType === type
                      ? type === "featured" ? "bg-red-600 border-red-500 text-white" : type === "wide" ? "bg-blue-600 border-blue-500 text-white" : "bg-zinc-600 border-zinc-500 text-white"
                      : "bg-black border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {AD_TYPE_LABELS[type].label}
                  <span className="ml-1 font-normal opacity-60">— {AD_TYPE_LABELS[type].desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "brand", label: "Marca", placeholder: "Nombre de la marca" },
              { key: "title", label: "Título", placeholder: "Título del anuncio" },
              { key: "tagline", label: "Tagline / Subtítulo", placeholder: "Frase corta descriptiva" },
              { key: "linkUrl", label: "URL de destino", placeholder: "https://..." },
              { key: "ctaLabel", label: "Texto del botón (CTA)", placeholder: "Ver más" },
              { key: "sortOrder", label: "Orden (número)", placeholder: "0 = primero" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">{label}</label>
                <input
                  value={form[key as keyof typeof form] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: key === "sortOrder" ? parseInt(e.target.value) || 0 : e.target.value }))}
                  placeholder={placeholder}
                  type={key === "sortOrder" ? "number" : "text"}
                  className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <ImageUploader
                label={form.adType === "featured" ? "Imagen destacada (16:9 o más ancha)" : form.adType === "card" ? "Imagen card (3:4 vertical recomendado)" : "Imagen ancha (16:9 o panorámica)"}
                value={form.imageUrl}
                onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
                folder="ads"
                aspectRatio={form.adType === "card" ? "3/4" : "16/9"}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Descripción (opcional)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => createAd.mutate(form)}
              disabled={!form.brand || !form.title || !form.imageUrl || createAd.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs"
            >
              PUBLICAR ANUNCIO
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="border-gray-700 text-gray-400 font-orbitron text-xs">
              CANCELAR
            </Button>
          </div>
        </div>
      )}

      {/* Ads list grouped by type */}
      {(["featured", "card", "wide"] as const).map(type => (
        adsByType[type].length > 0 && (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`text-xs ${AD_TYPE_LABELS[type].color}`}>{AD_TYPE_LABELS[type].label}</Badge>
              <span className="text-xs text-gray-500">{adsByType[type].length} anuncio(s)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adsByType[type].map(ad => (
                <div key={ad.id} className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
                  {ad.bannerImage && (
                    <div className={`overflow-hidden ${type === "card" ? "h-40" : "h-32"}`}>
                      <img src={ad.bannerImage} alt={ad.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500 font-rajdhani">{ad.brandName}</p>
                        <p className="text-white font-rajdhani font-semibold">{ad.title}</p>
                        {ad.tagline && <p className="text-gray-500 text-xs mt-0.5">{ad.tagline}</p>}
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        <Badge className={`text-xs ${AD_TYPE_LABELS[type].color}`}>{AD_TYPE_LABELS[type].label}</Badge>
                        {ad.isFeatured && <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-600/40">HERO</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs ${ad.isActive ? "text-green-400" : "text-gray-500"}`}>
                        {ad.isActive ? "● Activo" : "○ Inactivo"}
                      </span>
                      <span className="text-gray-600 text-xs">Orden: {ad.sortOrder ?? 0}</span>
                      <span className="text-gray-600 text-xs">{ad.clickCount ?? 0} clicks</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => updateAd.mutate({ id: ad.id, isActive: !ad.isActive })}
                        className="h-6 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 font-orbitron"
                      >
                        {ad.isActive ? "PAUSAR" : "ACTIVAR"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => deleteAd.mutate({ id: ad.id })}
                        className="h-6 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 font-orbitron"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {(!ads || ads.length === 0) && (
        <div className="text-center py-10 text-gray-600 text-sm font-mono">No hay anuncios creados aún</div>
      )}
    </div>
  );
}

// ─── Image Uploader Component ───────────────────────────────────────────────
function ImageUploader({
  label,
  value,
  onChange,
  folder = "rewards",
  aspectRatio = "16/9",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  aspectRatio?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadImage = trpc.admin.uploadImage.useMutation({
    onSuccess: (data) => { onChange(data.url); toast.success("Imagen subida"); },
    onError: (e) => toast.error(e.message),
  });

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imágenes"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadImage.mutate({ base64, mimeType: file.type as any, folder });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">{label}</label>
      <div
        className="relative rounded-lg border-2 border-dashed border-red-900/50 hover:border-red-600/70 transition-colors cursor-pointer overflow-hidden"
        style={{ aspectRatio, background: "#0a0a0a" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        {value ? (
          <>
            <img src={value} alt="preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-700 transition-colors"
            >
              <X size={12} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 py-1 text-center text-xs text-white/70 bg-black/50">
              Click para cambiar
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {uploadImage.isPending ? (
              <span className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <>
                <Upload size={20} className="text-red-900/70" />
                <span className="text-xs text-gray-600">Click o arrastra una imagen</span>
              </>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

// ─── Rewards Tab ──────────────────────────────────────────────────────────────
function RewardsTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "video" as any, rewardAmount: "", contentUrl: "", durationSeconds: "", thumbnailUrl: "", sponsorName: "", sponsorLogoUrl: "", expiresAt: "" });
  const { data: rewards, refetch } = trpc.admin.listRewards.useQuery();
  const createReward = trpc.admin.createReward.useMutation({
    onSuccess: () => { toast.success("Reward creado"); setShowForm(false); refetch(); },
    onError: e => toast.error(e.message),
  });
  const updateReward = trpc.admin.updateReward.useMutation({
    onSuccess: () => { toast.success("Actualizado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const deleteReward = trpc.admin.deleteReward.useMutation({
    onSuccess: () => { toast.success("Eliminado"); refetch(); },
    onError: e => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <SectionHeader icon={Gift} title="SISTEMA DE REWARDS" subtitle="Gestiona videos y tareas para ganar RLC" />
      <Button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        NUEVA TAREA
      </Button>
      {showForm && (
        <div className="bg-gray-900/60 border border-red-900/40 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Título</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título de la tarea"
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Tipo</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="ad">Anuncio</SelectItem>
                  <SelectItem value="survey">Encuesta</SelectItem>
                  <SelectItem value="daily">Diario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Recompensa (RLC)</label>
              <input type="number" value={form.rewardAmount} onChange={e => setForm(f => ({ ...f, rewardAmount: e.target.value }))} placeholder="50"
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Duración (segundos)</label>
              <input type="number" value={form.durationSeconds} onChange={e => setForm(f => ({ ...f, durationSeconds: e.target.value }))} placeholder="30"
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">URL del contenido (YouTube, etc.)</label>
              <input value={form.contentUrl} onChange={e => setForm(f => ({ ...f, contentUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div className="md:col-span-2">
              <ImageUploader
                label="Thumbnail (imagen de portada 16:9)"
                value={form.thumbnailUrl}
                onChange={(url) => setForm(f => ({ ...f, thumbnailUrl: url }))}
                folder="rewards/thumbnails"
                aspectRatio="16/9"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Nombre del Sponsor</label>
              <input value={form.sponsorName} onChange={e => setForm(f => ({ ...f, sponsorName: e.target.value }))} placeholder="Ej: Blizzard Entertainment"
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <ImageUploader
                label="Logo del Sponsor"
                value={form.sponsorLogoUrl}
                onChange={(url) => setForm(f => ({ ...f, sponsorLogoUrl: url }))}
                folder="rewards/logos"
                aspectRatio="1/1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Fecha de Expiración</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Descripción</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => createReward.mutate({ ...form, rewardAmount: parseInt(form.rewardAmount), durationSeconds: parseInt(form.durationSeconds) || undefined, thumbnailUrl: form.thumbnailUrl || undefined, sponsorName: form.sponsorName || undefined, sponsorLogoUrl: form.sponsorLogoUrl || undefined, expiresAt: form.expiresAt || undefined })}
              disabled={!form.title || !form.rewardAmount || createReward.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs"
            >
              CREAR TAREA
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="border-gray-700 text-gray-400 font-orbitron text-xs">
              CANCELAR
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {rewards?.map(r => (
          <div key={r.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-center gap-4 flex-wrap">
            <Gift className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-rajdhani font-semibold">{r.title}</p>
              <p className="text-gray-500 text-xs capitalize">{r.type} · {r.durationSeconds ?? 0}s · {r.reward} RLC</p>
              {r.contentUrl && (
                <a href={r.contentUrl} target="_blank" rel="noreferrer" className="text-red-400 text-xs hover:underline truncate block max-w-xs">
                  {r.contentUrl}
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => updateReward.mutate({ id: r.id, isActive: !r.isActive })}
                className={`h-7 text-xs font-orbitron ${r.isActive ? "bg-gray-800 text-gray-300" : "bg-green-900/30 text-green-400"}`}
              >
                {r.isActive ? "PAUSAR" : "ACTIVAR"}
              </Button>
              <Button
                size="sm"
                onClick={() => deleteReward.mutate({ id: r.id })}
                className="h-7 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 font-orbitron"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── News Tab ─────────────────────────────────────────────────────────────────
function NewsTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", coverImage: "", category: "general" as any, published: false });
  const { data: newsList, refetch } = trpc.admin.listNews.useQuery();
  const createNews = trpc.admin.createNews.useMutation({
    onSuccess: () => { toast.success("Noticia creada"); setShowForm(false); refetch(); },
    onError: e => toast.error(e.message),
  });
  const updateNews = trpc.admin.updateNews.useMutation({
    onSuccess: () => { toast.success("Actualizado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const deleteNews = trpc.admin.deleteNews.useMutation({
    onSuccess: () => { toast.success("Eliminado"); refetch(); },
    onError: e => toast.error(e.message),
  });

  const autoSlug = (title: string) => title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <div className="space-y-6">
      <SectionHeader icon={Newspaper} title="PORTAL DE NOTICIAS" subtitle="Crea y gestiona artículos" />
      <Button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        NUEVA NOTICIA
      </Button>
      {showForm && (
        <div className="bg-gray-900/60 border border-red-900/40 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Título</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: autoSlug(e.target.value) }))}
                placeholder="Título de la noticia"
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Slug (URL)</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="titulo-de-la-noticia"
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Categoría</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="torneos">Torneos</SelectItem>
                  <SelectItem value="equipos">Equipos</SelectItem>
                  <SelectItem value="juegos">Juegos</SelectItem>
                  <SelectItem value="plataforma">Plataforma</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <ImageUploader
                label="Imagen de portada"
                value={form.coverImage}
                onChange={url => setForm(f => ({ ...f, coverImage: url }))}
                folder="news"
                aspectRatio="16/9"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Resumen</label>
              <input value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Resumen corto..."
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Contenido</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} placeholder="Contenido completo de la noticia..."
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none" />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} className="accent-red-500" />
                <span className="text-xs text-gray-400 font-rajdhani">PUBLICAR AHORA</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => createNews.mutate(form)}
              disabled={!form.title || !form.content || createNews.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs"
            >
              CREAR NOTICIA
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="border-gray-700 text-gray-400 font-orbitron text-xs">
              CANCELAR
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {newsList?.map(n => (
          <div key={n.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-center gap-4 flex-wrap">
            {n.coverImage && <img src={n.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-white font-rajdhani font-semibold truncate">{n.title}</p>
              <p className="text-gray-500 text-xs">{n.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${n.publishedAt ? "text-green-400" : "text-yellow-400"}`}>
                {n.publishedAt ? "● Publicado" : "○ Borrador"}
              </span>
              <Button
                size="sm"
                onClick={() => updateNews.mutate({ id: n.id, published: !n.publishedAt })}
                className="h-7 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 font-orbitron"
              >
                {n.publishedAt ? "DESPUBLICAR" : "PUBLICAR"}
              </Button>
              <Button
                size="sm"
                onClick={() => deleteNews.mutate({ id: n.id })}
                className="h-7 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 font-orbitron"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tournaments Tab ──────────────────────────────────────────────────────────
function TournamentsTab() {
  const { data: pending, refetch } = trpc.admin.pendingTournaments.useQuery();
  const approve = trpc.admin.approveTournament.useMutation({
    onSuccess: () => { toast.success("Torneo aprobado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const reject = trpc.admin.rejectTournament.useMutation({
    onSuccess: () => { toast.success("Torneo rechazado"); refetch(); },
    onError: e => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <SectionHeader icon={Trophy} title="TORNEOS PENDIENTES" subtitle="Aprueba o rechaza torneos enviados por creadores" />
      {pending?.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-gray-500 font-rajdhani">Sin torneos pendientes de aprobación</p>
        </div>
      )}
      <div className="space-y-3">
        {pending?.map(t => (
          <div key={t.id} className="bg-gray-900/60 border border-yellow-900/30 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-rajdhani font-bold text-lg">{t.name}</h3>
                <p className="text-gray-500 text-xs mt-1">
                  Creador: <span className="text-gray-300">{t.organizerName ?? "Desconocido"}</span>
                  {t.organizerEmail && ` · ${t.organizerEmail}`}
                </p>
                <p className="text-gray-500 text-xs">
                  Juego: <span className="text-red-400">{t.game}</span>
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href={`/tournaments/${t.id}`}>
                  <Button size="sm" variant="outline" className="h-8 text-xs border-gray-700 text-gray-400 font-orbitron">
                    <Eye className="w-3 h-3 mr-1" />
                    VER
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => approve.mutate({ id: t.id })}
                  disabled={approve.isPending}
                  className="h-8 text-xs bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-700/40 font-orbitron"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  APROBAR
                </Button>
                <Button
                  size="sm"
                  onClick={() => reject.mutate({ id: t.id })}
                  disabled={reject.isPending}
                  className="h-8 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-700/40 font-orbitron"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  RECHAZAR
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────
function TeamsTab() {
  const { data: teams, refetch } = trpc.admin.listTeams.useQuery();
  const verifyTeam = trpc.admin.verifyTeam.useMutation({
    onSuccess: () => { toast.success("Estado actualizado"); refetch(); },
    onError: e => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <SectionHeader icon={Shield} title="GESTIÓN DE EQUIPOS" subtitle="Verifica y administra equipos" />
      <div className="space-y-2">
        {!teams || teams.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8 font-rajdhani">Sin equipos registrados</p>
        ) : teams.map((team: any) => (
          <div key={team.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {team.logo ? <img src={team.logo} alt="" className="w-full h-full object-cover" /> : <Shield className="w-5 h-5 text-gray-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-rajdhani font-semibold truncate">{team.name}</p>
                {team.tag && <span className="text-xs font-mono text-gray-500">[{team.tag}]</span>}
                {team.isVerified && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-gray-500 text-xs">{team.game ?? "Multi-juego"}</span>
                <span className="text-yellow-400 text-xs font-orbitron">{team.wins}V / {team.losses}D</span>
                <span className="text-gray-600 text-xs">{team.tournamentsPlayed ?? 0} torneos</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/teams/${team.id}`}>
                <Button size="sm" variant="outline" className="h-7 text-xs border-gray-700 text-gray-400">
                  <Eye className="w-3 h-3 mr-1" /> Ver
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => verifyTeam.mutate({ teamId: team.id, verified: !team.isVerified })}
                disabled={verifyTeam.isPending}
                className={`h-7 text-xs font-orbitron border ${
                  team.isVerified
                    ? "bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border-blue-700/40"
                    : "bg-green-600/20 hover:bg-green-600/40 text-green-400 border-green-700/40"
                }`}
              >
                {team.isVerified ? "QUITAR VERIFICACIÓN" : "VERIFICAR"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Games Tab ───────────────────────────────────────────────────────────────
// ─── Sortable game card ──────────────────────────────────────────────────────
function SortableGameCard({ g, onEdit, onDelete }: { g: any; onEdit: (g: any) => void; onDelete: (g: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: g.slug });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative group rounded-xl overflow-hidden border border-gray-800 bg-gray-900/60">
      {/* Drag handle */}
      <div {...attributes} {...listeners} className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-black/60 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3 text-gray-400" />
      </div>
      {g.bannerUrl ? (
        <img src={g.bannerUrl} alt={g.name} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-32 bg-gray-800 flex items-center justify-center"><Gamepad2 className="w-8 h-8 text-gray-600" /></div>
      )}
      <div className="p-3">
        <p className="text-white font-rajdhani font-semibold text-sm truncate">{g.name}</p>
        {g.genre && <p className="text-gray-500 text-xs">{g.genre}</p>}
        <p className="text-gray-700 text-xs mt-0.5">Orden: {g.sortOrder ?? 0}</p>
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(g)} className="bg-black/80 hover:bg-gray-800 rounded p-1"><Edit3 className="w-3 h-3 text-gray-300" /></button>
        <button onClick={() => onDelete(g)} className="bg-black/80 hover:bg-red-900/80 rounded p-1"><Trash2 className="w-3 h-3 text-red-400" /></button>
      </div>
    </div>
  );
}

function GamesTab() {
  const { data: games, refetch } = trpc.games.list.useQuery();
  const [localGames, setLocalGames] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", banner: "", logo: "", genre: "", description: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"banner" | "logo" | null>(null);
  const uploadImage = trpc.profile.uploadImage.useMutation();
  const upsert = trpc.games.upsert.useMutation({
    onSuccess: () => { toast.success("Juego guardado"); refetch(); setForm({ name: "", slug: "", banner: "", logo: "", genre: "", description: "" }); setEditing(null); },
    onError: e => toast.error(e.message),
  });
  const del = trpc.games.delete.useMutation({
    onSuccess: () => { toast.success("Juego eliminado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const reorder = trpc.games.reorder.useMutation({
    onSuccess: () => { toast.success("Orden guardado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  useEffect(() => {
    if (games) setLocalGames(games);
  }, [games]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localGames.findIndex((g: any) => g.slug === active.id);
    const newIndex = localGames.findIndex((g: any) => g.slug === over.id);
    const reordered = arrayMove(localGames, oldIndex, newIndex);
    setLocalGames(reordered);
    reorder.mutate({ items: reordered.map((g: any, i: number) => ({ slug: g.slug, sortOrder: i })) });
  };
  const handleUpload = async (field: "banner" | "logo", file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5MB"); return; }
    setUploading(field);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadImage.mutateAsync({ base64, mimeType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp", type: "banner" });
        setForm(f => ({ ...f, [field]: result.url }));
        setUploading(null);
      };
      reader.onerror = () => { toast.error("Error al leer el archivo"); setUploading(null); };
      reader.readAsDataURL(file);
    } catch { toast.error("Error al subir imagen"); setUploading(null); }
  };
  const startEdit = (g: any) => { setEditing(g.slug); setForm({ name: g.name, slug: g.slug, banner: g.bannerUrl ?? "", logo: g.logo ?? "", genre: g.genre ?? "", description: g.description ?? "" }); };
  const cancelEdit = () => { setEditing(null); setForm({ name: "", slug: "", banner: "", logo: "", genre: "", description: "" }); };
  const autoSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return (
    <div className="space-y-6">
      <SectionHeader icon={Gamepad2} title="GESTIÓN DE JUEGOS" subtitle="Agrega y administra los juegos disponibles en la plataforma" />

      {/* Form */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 space-y-4">
        <p className="text-white font-orbitron text-sm">{editing ? "EDITAR JUEGO" : "AGREGAR JUEGO"}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">NOMBRE *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : autoSlug(e.target.value) }))}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="Ej: Valorant" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">SLUG (ID único)</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="Ej: valorant" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">GÉNERO</label>
            <input value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="Ej: FPS, MOBA, Battle Royale" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">DESCRIPCIÓN</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="Descripción corta" />
          </div>
        </div>

        {/* Image uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">PORTADA / BANNER *</label>
            <div className="flex items-center gap-3">
              {form.banner && <img src={form.banner} alt="" className="w-16 h-10 object-cover rounded border border-gray-700" />}
              <label className="cursor-pointer">
                <div className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-gray-400 text-xs font-rajdhani flex items-center gap-2">
                  {uploading === "banner" ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3 h-3" />}
                  {uploading === "banner" ? "Subiendo..." : "Subir imagen"}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("banner", e.target.files[0])} />
              </label>
              {form.banner && <input value={form.banner} onChange={e => setForm(f => ({ ...f, banner: e.target.value }))} className="flex-1 bg-black border border-gray-700 rounded px-2 py-1 text-gray-400 text-xs outline-none" placeholder="O pega URL" />}
            </div>
            {!form.banner && <input value={form.banner} onChange={e => setForm(f => ({ ...f, banner: e.target.value }))} className="mt-2 w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-gray-400 text-xs outline-none" placeholder="O pega URL de imagen" />}
          </div>
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">LOGO (opcional)</label>
            <div className="flex items-center gap-3">
              {form.logo && <img src={form.logo} alt="" className="w-10 h-10 object-cover rounded border border-gray-700" />}
              <label className="cursor-pointer">
                <div className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-gray-400 text-xs font-rajdhani flex items-center gap-2">
                  {uploading === "logo" ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3 h-3" />}
                  {uploading === "logo" ? "Subiendo..." : "Subir logo"}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("logo", e.target.files[0])} />
              </label>
              {form.logo && <input value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} className="flex-1 bg-black border border-gray-700 rounded px-2 py-1 text-gray-400 text-xs outline-none" placeholder="O pega URL" />}
            </div>
            {!form.logo && <input value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} className="mt-2 w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-gray-400 text-xs outline-none" placeholder="O pega URL de logo" />}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => upsert.mutate({ name: form.name, slug: form.slug || autoSlug(form.name), banner: form.banner, logo: form.logo, genre: form.genre, description: form.description })} disabled={!form.name || upsert.isPending} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
            {upsert.isPending ? "Guardando..." : editing ? "ACTUALIZAR" : "AGREGAR JUEGO"}
          </Button>
          {editing && <Button variant="outline" onClick={cancelEdit} className="border-gray-700 text-gray-400 font-orbitron text-xs">CANCELAR</Button>}
        </div>
      </div>

      {/* Games list with drag-and-drop */}
      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="w-4 h-4 text-gray-500" />
        <p className="text-gray-500 text-xs font-rajdhani">Arrastra las tarjetas para reordenar. El orden se guarda automáticamente.</p>
        {reorder.isPending && <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />}
      </div>
      {!localGames || localGames.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8 font-rajdhani">Sin juegos registrados</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localGames.map((g: any) => g.slug)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {localGames.map((g: any) => (
                <SortableGameCard
                  key={g.slug}
                  g={g}
                  onEdit={startEdit}
                  onDelete={(g) => { if (confirm(`¿Eliminar ${g.name}?`)) del.mutate({ slug: g.slug }); }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// ─── Audit Tab ───────────────────────────────────────────────────────────────
function AuditTab() {
  const [enabled, setEnabled] = useState(false);
  const { data, isFetching, refetch } = trpc.games.auditConsistency.useQuery(undefined, {
    enabled,
    staleTime: 0,
  });

  const handleRun = () => {
    if (!enabled) {
      setEnabled(true);
    } else {
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Database}
        title="AUDITORÍA DE CONSISTENCIA"
        subtitle="Verifica que gameSlug esté correctamente poblado en torneos y equipos"
      />

      {/* Run button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleRun}
          disabled={isFetching}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-orbitron rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "EJECUTANDO..." : enabled ? "VOLVER A EJECUTAR" : "EJECUTAR AUDITORÍA"}
        </button>
        {data && !isFetching && (
          <span className="text-xs text-gray-400">
            Última ejecución completada
          </span>
        )}
      </div>

      {/* Results */}
      {data && !isFetching && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Torneos", value: data.summary.totalTournaments, color: "text-white" },
              { label: "Torneos Inconsistentes", value: data.summary.inconsistentTournaments, color: data.summary.inconsistentTournaments > 0 ? "text-red-400" : "text-green-400" },
              { label: "Total Equipos", value: data.summary.totalTeams, color: "text-white" },
              { label: "Equipos Inconsistentes", value: data.summary.inconsistentTeams, color: data.summary.inconsistentTeams > 0 ? "text-red-400" : "text-green-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900/60 border border-red-900/20 rounded-xl p-4 text-center">
                <div className={`text-3xl font-orbitron font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Global status badge */}
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
            data.summary.inconsistentTournaments === 0 && data.summary.inconsistentTeams === 0
              ? "bg-green-900/20 border-green-700/40 text-green-400"
              : "bg-red-900/20 border-red-700/40 text-red-400"
          }`}>
            {data.summary.inconsistentTournaments === 0 && data.summary.inconsistentTeams === 0 ? (
              <><CheckCircle2 className="w-5 h-5" /><span className="text-sm font-semibold">Sin inconsistencias — todos los registros tienen gameSlug correcto</span></>
            ) : (
              <><AlertTriangle className="w-5 h-5" /><span className="text-sm font-semibold">Se encontraron inconsistencias. Revisar los detalles abajo.</span></>
            )}
          </div>

          {/* Inconsistent tournaments */}
          {data.tournaments.length > 0 && (
            <div>
              <h3 className="text-sm font-orbitron text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> TORNEOS INCONSISTENTES ({data.tournaments.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-900/30 text-gray-400 text-xs">
                      <th className="text-left py-2 pr-4">ID</th>
                      <th className="text-left py-2 pr-4">Nombre</th>
                      <th className="text-left py-2 pr-4">game (legacy)</th>
                      <th className="text-left py-2 pr-4">gameSlug actual</th>
                      <th className="text-left py-2">gameSlug esperado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tournaments.map((t: any) => (
                      <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-2 pr-4 text-gray-400">{t.id}</td>
                        <td className="py-2 pr-4 text-white">{t.name}</td>
                        <td className="py-2 pr-4 text-yellow-400">{t.game ?? "—"}</td>
                        <td className="py-2 pr-4 text-red-400">{t.gameSlug ?? <span className="text-gray-500">NULL</span>}</td>
                        <td className="py-2 text-green-400">{t.expectedSlug ?? <span className="text-gray-500">sin juego registrado</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inconsistent teams */}
          {data.teams.length > 0 && (
            <div>
              <h3 className="text-sm font-orbitron text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> EQUIPOS INCONSISTENTES ({data.teams.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-900/30 text-gray-400 text-xs">
                      <th className="text-left py-2 pr-4">ID</th>
                      <th className="text-left py-2 pr-4">Nombre</th>
                      <th className="text-left py-2 pr-4">game (legacy)</th>
                      <th className="text-left py-2 pr-4">gameSlug actual</th>
                      <th className="text-left py-2">gameSlug esperado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teams.map((t: any) => (
                      <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-2 pr-4 text-gray-400">{t.id}</td>
                        <td className="py-2 pr-4 text-white">{t.name}</td>
                        <td className="py-2 pr-4 text-yellow-400">{t.game ?? "—"}</td>
                        <td className="py-2 pr-4 text-red-400">{t.gameSlug ?? <span className="text-gray-500">NULL</span>}</td>
                        <td className="py-2 text-green-400">{t.expectedSlug ?? <span className="text-gray-500">sin juego registrado</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All clean */}
          {data.tournaments.length === 0 && data.teams.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500/40" />
              <p className="text-sm">No hay registros inconsistentes. La base de datos está limpia.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state before first run */}
      {!data && !isFetching && (
        <div className="text-center py-12 text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Haz clic en "Ejecutar Auditoría" para analizar la consistencia de gameSlug.</p>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats } = trpc.admin.stats.useQuery();

  if (!stats) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHeader icon={BarChart3} title="RESUMEN GENERAL" subtitle="Métricas globales de la plataforma" />

      {/* Global Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Usuarios" value={stats.totalUsers} icon={Users} color="text-blue-400" />
        <StatCard label="Total Equipos" value={stats.totalTeams} icon={Shield} color="text-purple-400" />
        <StatCard label="Total Torneos" value={stats.totalTournaments} icon={Trophy} color="text-red-400" />
        <StatCard label="Torneos Activos" value={stats.activeTournaments} icon={Star} color="text-yellow-400" />
        <StatCard label="Torneos Pendientes" value={stats.pendingTournaments} icon={Eye} color="text-orange-400" />
        <StatCard label="Total Apuestas" value={stats.totalBets} icon={BarChart3} color="text-green-400" />
        <StatCard label="Total Pedidos" value={stats.totalOrders} icon={Package} color="text-cyan-400" />
        <StatCard label="Pedidos Pendientes" value={stats.pendingOrders} icon={ShoppingBag} color="text-pink-400" />
      </div>

      {/* Recent Users */}
      <div>
        <h3 className="font-orbitron text-sm text-gray-400 tracking-wider mb-3">USUARIOS RECIENTES</h3>
        <div className="space-y-2">
          {stats.recentUsers?.map((u: any) => (
            <div key={u.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <UserAvatar avatar={u.avatar} name={u.name} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-rajdhani font-semibold truncate">{u.nickname ?? u.name ?? "Sin nombre"}</p>
                <p className="text-gray-600 text-xs">{new Date(u.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <Badge className={`font-orbitron text-xs border ${
                u.role === "admin" ? "bg-yellow-500/20 text-yellow-400 border-yellow-600/40" :
                u.role === "premium" ? "bg-red-500/20 text-red-400 border-red-600/40" :
                "bg-gray-500/20 text-gray-400 border-gray-600/40"
              }`}>
                {u.role.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: pending } = trpc.admin.pendingTournaments.useQuery();

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-800 mx-auto mb-4" />
          <p className="text-red-400 font-orbitron text-sm">ACCESO RESTRINGIDO</p>
          <p className="text-gray-500 text-xs mt-2 font-rajdhani">Solo administradores pueden acceder a este panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 py-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center">
          <Shield className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-white tracking-wider">PANEL MAESTRO</h1>
          <p className="text-gray-500 text-sm font-rajdhani">Control total de Red Level Circle</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Usuarios" value={stats?.totalUsers ?? 0} icon={Users} color="text-blue-400" />
        <StatCard label="Equipos" value={stats?.totalTeams ?? 0} icon={Shield} color="text-purple-400" />
        <StatCard label="Torneos activos" value={stats?.activeTournaments ?? 0} icon={Trophy} color="text-red-400" />
        <StatCard label="Pendientes aprobación" value={pending?.length ?? 0} icon={Eye} color="text-yellow-400" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-gray-900/60 border border-red-900/30 rounded-xl p-1 flex-wrap h-auto gap-1">
          {[
            { value: "overview", label: "RESUMEN", icon: BarChart3 },
            { value: "tournaments", label: "TORNEOS", icon: Trophy },
            { value: "users", label: "USUARIOS", icon: Users },
            { value: "teams", label: "EQUIPOS", icon: Shield },
            { value: "shop", label: "TIENDA", icon: ShoppingBag },
            { value: "ads", label: "PUBLICIDAD", icon: Megaphone },
            { value: "rewards", label: "REWARDS", icon: Gift },
            { value: "news", label: "NOTICIAS", icon: Newspaper },
            { value: "creators", label: "CREADORES", icon: Crown },
            { value: "games", label: "JUEGOS", icon: Gamepad2 },
            { value: "cosmetics", label: "COSMÉTICOS", icon: Star },
            { value: "verifications", label: "VERIFICACIONES", icon: BadgeCheck },
            { value: "banners", label: "BANNERS", icon: Layout },
            { value: "audit", label: "AUDITORÍA", icon: Database },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="font-orbitron text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="tournaments"><TournamentsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="teams"><TeamsTab /></TabsContent>
          <TabsContent value="shop"><ShopTab /></TabsContent>
          <TabsContent value="ads"><AdsTab /></TabsContent>
          <TabsContent value="rewards"><RewardsTab /></TabsContent>
          <TabsContent value="news"><NewsTab /></TabsContent>
          <TabsContent value="creators"><CreatorsTab /></TabsContent>
          <TabsContent value="games"><GamesTab /></TabsContent>
          <TabsContent value="cosmetics"><CosmeticsAdminTab /></TabsContent>
          <TabsContent value="verifications"><VerificationsTab /></TabsContent>
          <TabsContent value="banners"><BannersTab /></TabsContent>
          <TabsContent value="audit"><AuditTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ─── Creators Tab ────────────────────────────────────────────────────────────
function CreatorsTab() {
  const { data: pending, refetch } = trpc.creators.listPending.useQuery();
  const review = trpc.creators.review.useMutation({
    onSuccess: () => { toast.success("Solicitud actualizada"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const [note, setNote] = useState<Record<number, string>>({});

  const byStatus = {
    pending: pending?.filter(c => c.status === "pending") ?? [],
    approved: pending?.filter(c => c.status === "approved") ?? [],
    rejected: pending?.filter(c => c.status === "rejected") ?? [],
  };

  const CreatorRow = ({ c }: { c: any }) => (
    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
      <div className="flex items-start gap-4">
        {c.avatar ? (
          <UserAvatar avatar={c.avatar} name={c.name} size={48} />
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-red-500">{(c.nickname ?? c.userName ?? "?").charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{c.nickname ?? c.userName}</span>
            {c.category && <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{c.category}</span>}
            {c.subscribers > 0 && <span className="text-xs text-zinc-500">{c.subscribers.toLocaleString()} seguidores</span>}
          </div>
          {c.bio && <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{c.bio}</p>}
          <div className="flex items-center gap-3 mt-2">
            {c.youtube && <span className="text-xs text-zinc-600 flex items-center gap-1"><Youtube size={10} /> {c.youtube}</span>}
            {c.twitch && <span className="text-xs text-zinc-600 flex items-center gap-1"><Twitch size={10} /> {c.twitch}</span>}
            {c.twitter && <span className="text-xs text-zinc-600 flex items-center gap-1"><Twitter size={10} /> {c.twitter}</span>}
            {c.instagram && <span className="text-xs text-zinc-600 flex items-center gap-1"><Instagram size={10} /> {c.instagram}</span>}
          </div>
          <p className="text-zinc-700 text-xs mt-1">Aplicó: {new Date(c.appliedAt).toLocaleDateString("es")}</p>
        </div>
        {c.status === "pending" && (
          <div className="flex flex-col gap-2 shrink-0">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
              onClick={() => review.mutate({ id: c.id, status: "approved" })}>
              <CheckCircle size={12} className="mr-1" /> Aprobar
            </Button>
            <Button size="sm" variant="outline" className="border-red-600/40 text-red-400 hover:bg-red-600/20 text-xs h-8"
              onClick={() => review.mutate({ id: c.id, status: "rejected", adminNote: note[c.id] })}>
              <XCircle size={12} className="mr-1" /> Rechazar
            </Button>
            <input
              type="text"
              placeholder="Motivo (opcional)"
              value={note[c.id] ?? ""}
              onChange={e => setNote(n => ({ ...n, [c.id]: e.target.value }))}
              className="text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-300 placeholder-zinc-600 w-32 focus:outline-none"
            />
          </div>
        )}
        {c.status === "approved" && (
          <div className="flex flex-col gap-1 items-end shrink-0">
            <span className="flex items-center gap-1 text-xs text-green-400 font-mono"><CheckCircle size={10} /> Aprobado</span>
            <Button size="sm" variant="outline" className="border-red-600/40 text-red-400 hover:bg-red-600/20 text-xs h-7"
              onClick={() => review.mutate({ id: c.id, status: "rejected" })}>
              Revocar
            </Button>
          </div>
        )}
        {c.status === "rejected" && (
          <div className="flex flex-col gap-1 items-end shrink-0">
            <span className="flex items-center gap-1 text-xs text-red-400 font-mono"><XCircle size={10} /> Rechazado</span>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7"
              onClick={() => review.mutate({ id: c.id, status: "approved" })}>
              Aprobar
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHeader icon={Crown} title="CREADORES DE CONTENIDO" subtitle="Gestiona las solicitudes de creadores oficiales" />
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
          <p className="font-orbitron font-black text-2xl text-yellow-400">{byStatus.pending.length}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><Clock size={10} /> En revisión</p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="font-orbitron font-black text-2xl text-green-400">{byStatus.approved.length}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><CheckCircle size={10} /> Aprobados</p>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="font-orbitron font-black text-2xl text-red-400">{byStatus.rejected.length}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><XCircle size={10} /> Rechazados</p>
        </div>
      </div>
      {byStatus.pending.length > 0 && (
        <div>
          <h3 className="font-orbitron text-sm text-yellow-400 mb-3 flex items-center gap-2"><Clock size={14} /> PENDIENTES ({byStatus.pending.length})</h3>
          <div className="space-y-3">{byStatus.pending.map(c => <CreatorRow key={c.id} c={c} />)}</div>
        </div>
      )}
      {byStatus.approved.length > 0 && (
        <div>
          <h3 className="font-orbitron text-sm text-green-400 mb-3 flex items-center gap-2"><CheckCircle size={14} /> APROBADOS ({byStatus.approved.length})</h3>
          <div className="space-y-3">{byStatus.approved.map(c => <CreatorRow key={c.id} c={c} />)}</div>
        </div>
      )}
      {byStatus.rejected.length > 0 && (
        <div>
          <h3 className="font-orbitron text-sm text-red-400 mb-3 flex items-center gap-2"><XCircle size={14} /> RECHAZADOS ({byStatus.rejected.length})</h3>
          <div className="space-y-3">{byStatus.rejected.map(c => <CreatorRow key={c.id} c={c} />)}</div>
        </div>
      )}
      {(pending?.length ?? 0) === 0 && (
        <div className="text-center py-12">
          <Crown size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 font-mono text-sm">No hay solicitudes de creadores aún</p>
        </div>
      )}
    </div>
  );
}

// ─── Cosmetics Admin Tab ──────────────────────────────────────────────────────
function CosmeticsAdminTab() {
  const emptyForm = { name: "", description: "", type: "frame" as any, rarity: "common" as any, previewImage: "", frameImage: "", price: "", originalPrice: "", isActive: true, isFeatured: false, isLimited: false, collection: "", sortOrder: "0" };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingFrame, setUploadingFrame] = useState(false);

  const { data: cosmetics, refetch } = trpc.cosmetics.list.useQuery({});
  const uploadImage = trpc.admin.uploadImage.useMutation();
  const create = trpc.cosmetics.adminCreate.useMutation({
    onSuccess: () => { toast.success("Cosmético creado"); setForm(emptyForm); refetch(); },
    onError: e => toast.error(e.message),
  });
  const update = trpc.cosmetics.adminUpdate.useMutation({
    onSuccess: () => { toast.success("Cosmético actualizado"); setEditing(null); setForm(emptyForm); refetch(); },
    onError: e => toast.error(e.message),
  });
  const del = trpc.cosmetics.adminDelete.useMutation({
    onSuccess: () => { toast.success("Cosmético eliminado"); refetch(); },
    onError: e => toast.error(e.message),
  });

  const handleUpload = async (field: "previewImage" | "frameImage", file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5MB"); return; }
    if (field === "previewImage") setUploadingPreview(true);
    else setUploadingFrame(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadImage.mutateAsync({ base64, mimeType: file.type as any, folder: "cosmetics" });
        setForm(f => ({ ...f, [field]: result.url }));
        if (field === "previewImage") setUploadingPreview(false);
        else setUploadingFrame(false);
      };
      reader.onerror = () => { toast.error("Error al leer el archivo"); setUploadingPreview(false); setUploadingFrame(false); };
      reader.readAsDataURL(file);
    } catch { toast.error("Error al subir imagen"); setUploadingPreview(false); setUploadingFrame(false); }
  };

  const startEdit = (c: any) => {
    setEditing(c.id);
    setForm({ name: c.name, description: c.description ?? "", type: c.type, rarity: c.rarity, previewImage: c.previewImage ?? "", frameImage: c.frameImage ?? "", price: String(c.price), originalPrice: c.originalPrice ? String(c.originalPrice) : "", isActive: c.isActive, isFeatured: c.isFeatured, isLimited: c.isLimited, collection: c.collection ?? "", sortOrder: String(c.sortOrder) });
  };

  const handleSubmit = () => {
    const data = { name: form.name, description: form.description || undefined, type: form.type, rarity: form.rarity, previewImage: form.previewImage || undefined, frameImage: form.frameImage || undefined, price: parseInt(form.price) || 0, originalPrice: form.originalPrice ? parseInt(form.originalPrice) : undefined, isActive: form.isActive, isFeatured: form.isFeatured, isLimited: form.isLimited, collection: form.collection || undefined, sortOrder: parseInt(form.sortOrder) || 0 };
    if (editing !== null) update.mutate({ id: editing, ...data });
    else create.mutate(data);
  };

  const rarityColors: Record<string, string> = { common: "text-gray-400", rare: "text-blue-400", epic: "text-purple-400", legendary: "text-yellow-400" };

  return (
    <div className="space-y-6">
      <SectionHeader icon={Star} title="GESTIÓN DE COSMÉTICOS" subtitle="Crea y administra marcos, auras y badges de perfil" />

      {/* Form */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 space-y-4">
        <p className="text-white font-orbitron text-sm">{editing !== null ? "EDITAR COSMÉTICO" : "NUEVO COSMÉTICO"}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">NOMBRE *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="Ej: Marco Neon Rojo" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">COLECCIÓN</label>
            <input value={form.collection} onChange={e => setForm(f => ({ ...f, collection: e.target.value }))}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="Ej: Red Level Pack" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">TIPO</label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="frame">Marco</SelectItem>
                <SelectItem value="aura">Aura</SelectItem>
                <SelectItem value="badge">Badge</SelectItem>
                <SelectItem value="background">Fondo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">RAREZA</label>
            <Select value={form.rarity} onValueChange={v => setForm(f => ({ ...f, rarity: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="common">Común</SelectItem>
                <SelectItem value="rare">Raro</SelectItem>
                <SelectItem value="epic">Épico</SelectItem>
                <SelectItem value="legendary">Legendario</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">PRECIO (RLC) *</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">PRECIO ORIGINAL (opcional)</label>
            <input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="800 (para mostrar descuento)" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">DESCRIPCIÓN</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="Descripción breve del cosmético" />
          </div>
        </div>

        {/* Image uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Preview Image */}
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">IMAGEN DE PREVIEW (tarjeta en la tienda)</label>
            <div className="flex items-center gap-3">
              {form.previewImage && (
                <img src={form.previewImage} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-700 flex-shrink-0" />
              )}
              <label className="cursor-pointer flex-1">
                <div className="bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 hover:border-red-500 rounded-lg px-3 py-3 text-gray-400 text-xs font-rajdhani flex items-center justify-center gap-2 transition-colors">
                  {uploadingPreview
                    ? <><div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> Subiendo...</>
                    : <><Plus className="w-3.5 h-3.5" /> {form.previewImage ? "Cambiar preview" : "Subir preview"}</>}
                </div>
                <input type="file" accept="image/*" className="hidden" disabled={uploadingPreview} onChange={e => e.target.files?.[0] && handleUpload("previewImage", e.target.files[0])} />
              </label>
            </div>
          </div>

          {/* Frame PNG */}
          <div>
            <label className="text-gray-400 text-xs font-rajdhani mb-1 block">PNG DEL MARCO/AURA (overlay transparente)</label>
            <div className="flex items-center gap-3">
              {form.frameImage && (
                <div className="w-16 h-16 rounded-lg border border-gray-700 flex-shrink-0 bg-gray-800/50 flex items-center justify-center overflow-hidden">
                  <img src={form.frameImage} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <label className="cursor-pointer flex-1">
                <div className="bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 hover:border-red-500 rounded-lg px-3 py-3 text-gray-400 text-xs font-rajdhani flex items-center justify-center gap-2 transition-colors">
                  {uploadingFrame
                    ? <><div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> Subiendo...</>
                    : <><Plus className="w-3.5 h-3.5" /> {form.frameImage ? "Cambiar PNG" : "Subir PNG"}</>}
                </div>
                <input type="file" accept="image/png,image/webp" className="hidden" disabled={uploadingFrame} onChange={e => e.target.files?.[0] && handleUpload("frameImage", e.target.files[0])} />
              </label>
            </div>
            <p className="text-gray-600 text-xs mt-1 font-rajdhani">Recomendado: PNG con fondo transparente, 512×512px</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-6 flex-wrap">
          {[
            { key: "isActive", label: "Activo" },
            { key: "isFeatured", label: "Destacado" },
            { key: "isLimited", label: "Edición Limitada" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 accent-red-500" />
              <span className="text-gray-400 text-xs font-rajdhani">{label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={!form.name || !form.price || create.isPending || update.isPending} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
            {create.isPending || update.isPending ? "Guardando..." : editing !== null ? "ACTUALIZAR" : "CREAR COSMÉTICO"}
          </Button>
          {editing !== null && (
            <Button variant="outline" onClick={() => { setEditing(null); setForm(emptyForm); }} className="border-gray-700 text-gray-400 font-orbitron text-xs">
              CANCELAR
            </Button>
          )}
        </div>
      </div>

      {/* Cosmetics list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {!cosmetics || cosmetics.length === 0 ? (
          <p className="text-gray-500 text-sm col-span-4 text-center py-8 font-rajdhani">Sin cosméticos registrados</p>
        ) : cosmetics.map((c: any) => (
          <div key={c.id} className="relative group rounded-xl overflow-hidden border border-gray-800 bg-gray-900/60">
            {c.previewImage ? (
              <img src={c.previewImage} alt={c.name} className="w-full h-32 object-cover" />
            ) : (
              <div className="w-full h-32 bg-gray-800 flex items-center justify-center">
                <Star className="w-8 h-8 text-gray-600" />
              </div>
            )}
            <div className="p-3">
              <p className="text-white font-rajdhani font-semibold text-sm truncate">{c.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-orbitron ${rarityColors[c.rarity] ?? "text-gray-400"}`}>{c.rarity?.toUpperCase()}</span>
                <span className="text-yellow-400 text-xs font-orbitron">{c.price} RLC</span>
              </div>
              {c.frameImage && (
                <p className="text-green-500 text-xs font-rajdhani mt-0.5">✓ PNG cargado</p>
              )}
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(c)} className="bg-black/80 hover:bg-gray-800 rounded p-1"><Edit3 className="w-3 h-3 text-gray-300" /></button>
              <button onClick={() => { if (confirm(`¿Eliminar ${c.name}?`)) del.mutate({ id: c.id }); }} className="bg-black/80 hover:bg-red-900/80 rounded p-1"><Trash2 className="w-3 h-3 text-red-400" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Verifications Tab ────────────────────────────────────────────────────────
function VerificationsTab() {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const { data: requests, refetch } = trpc.verification.list.useQuery({ status: filter });
  const review = trpc.verification.review.useMutation({
    onSuccess: () => { toast.success("Solicitud actualizada"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const [notes, setNotes] = useState<Record<number, string>>({});

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-600/40",
    approved: "bg-blue-500/20 text-blue-400 border-blue-600/40",
    rejected: "bg-red-500/20 text-red-400 border-red-600/40",
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={BadgeCheck} title="VERIFICACIONES DE USUARIOS" subtitle="Aprueba o rechaza solicitudes de verificación" />

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-orbitron tracking-wider transition-all border ${
              filter === s ? "bg-red-600 text-white border-red-600" : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            {s === "pending" ? "PENDIENTES" : s === "approved" ? "APROBADOS" : s === "rejected" ? "RECHAZADOS" : "TODOS"}
          </button>
        ))}
      </div>

      {/* Requests list */}
      <div className="space-y-3">
        {!requests || requests.length === 0 ? (
          <div className="text-center py-12">
            <BadgeCheck className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-rajdhani">No hay solicitudes {filter !== "all" ? `con estado "${filter}"` : ""}</p>
          </div>
        ) : requests.map((req: any) => (
          <div key={req.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 space-y-3">
            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0 overflow-hidden">
                {req.avatar ? (
                  <img src={req.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-rajdhani font-semibold">{req.nickname ?? req.userName ?? "Usuario"}</p>
                  {req.userIsVerified && (
                    <BadgeCheck className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <p className="text-gray-500 text-xs font-mono">
                  Solicitado: {new Date(req.requestedAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                  {req.reviewedAt && ` · Revisado: ${new Date(req.reviewedAt).toLocaleDateString("es", { day: "numeric", month: "short" })}`}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-orbitron border ${statusColors[req.status] ?? statusColors.pending}`}>
                {req.status === "pending" ? "PENDIENTE" : req.status === "approved" ? "APROBADO" : "RECHAZADO"}
              </span>
            </div>

            {/* Reason */}
            {req.reason && (
              <div className="bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-700/50">
                <p className="text-xs text-gray-500 font-mono mb-1">MOTIVO DEL USUARIO:</p>
                <p className="text-gray-300 text-sm">{req.reason}</p>
              </div>
            )}

            {/* Admin note if already reviewed */}
            {req.adminNote && (
              <div className="bg-red-900/20 rounded-lg px-4 py-3 border border-red-700/30">
                <p className="text-xs text-red-400 font-mono mb-1">NOTA DEL ADMIN:</p>
                <p className="text-gray-300 text-sm">{req.adminNote}</p>
              </div>
            )}

            {/* Actions (only for pending) */}
            {req.status === "pending" && (
              <div className="space-y-2">
                <input
                  value={notes[req.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [req.id]: e.target.value }))}
                  placeholder="Nota opcional para el usuario..."
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => review.mutate({ requestId: req.id, status: "approved", adminNote: notes[req.id] })}
                    disabled={review.isPending}
                    className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-700/40 font-orbitron text-xs h-8"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    VERIFICAR
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => review.mutate({ requestId: req.id, status: "rejected", adminNote: notes[req.id] })}
                    disabled={review.isPending}
                    className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-700/40 font-orbitron text-xs h-8"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    RECHAZAR
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Banners Tab ──────────────────────────────────────────────────────────────
const SECTION_DEFS = [
  { key: "home", label: "Inicio", description: "Banner principal del home" },
  { key: "news", label: "Noticias", description: "Header de la sección de noticias" },
  { key: "tournaments", label: "Torneos", description: "Header de la sección de torneos" },
  { key: "rewards", label: "Rewards", description: "Header de la sección de rewards" },
  { key: "creators", label: "Creadores", description: "Header de la sección de creadores" },
  { key: "games", label: "Juegos", description: "Header de la sección de juegos" },
  { key: "cosmetics", label: "Cosméticos", description: "Header de la sección de cosméticos" },
  { key: "shop", label: "Tienda", description: "Header de la tienda" },
];

function BannersTab() {
  const { data: allBanners, refetch } = trpc.banners.listAll.useQuery();
  const uploadBannerImage = trpc.banners.uploadImage.useMutation({
    onError: e => toast.error(e.message),
  });
  const upsertBanner = trpc.banners.upsert.useMutation({
    onSuccess: () => { toast.success("Banner guardado"); refetch(); },
    onError: e => toast.error(e.message),
  });

  const getBanner = (key: string) => allBanners?.find(b => b.sectionKey === key);

  const handleUpload = async (sectionKey: string, file: File, isMobile = false) => {
    if (!file.type.startsWith("image/")) { toast.error("Solo imágenes"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      const result = await uploadBannerImage.mutateAsync({ base64, mimeType: file.type as any, sectionKey, isMobile });
      const existing = getBanner(sectionKey);
      await upsertBanner.mutateAsync({
        sectionKey,
        imageUrl: isMobile ? (existing?.imageUrl ?? null) : result.url,
        mobileImageUrl: isMobile ? result.url : (existing?.mobileImageUrl ?? null),
        title: existing?.title ?? null,
        subtitle: existing?.subtitle ?? null,
        linkUrl: existing?.linkUrl ?? null,
        isActive: existing?.isActive ?? true,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (sectionKey: string, isMobile = false) => {
    const existing = getBanner(sectionKey);
    upsertBanner.mutate({
      sectionKey,
      imageUrl: isMobile ? (existing?.imageUrl ?? null) : null,
      mobileImageUrl: isMobile ? null : (existing?.mobileImageUrl ?? null),
      title: existing?.title ?? null,
      subtitle: existing?.subtitle ?? null,
      linkUrl: existing?.linkUrl ?? null,
      isActive: existing?.isActive ?? true,
    });
  };

  const handleToggle = (sectionKey: string) => {
    const existing = getBanner(sectionKey);
    upsertBanner.mutate({
      sectionKey,
      imageUrl: existing?.imageUrl ?? null,
      mobileImageUrl: existing?.mobileImageUrl ?? null,
      title: existing?.title ?? null,
      subtitle: existing?.subtitle ?? null,
      linkUrl: existing?.linkUrl ?? null,
      isActive: !(existing?.isActive ?? true),
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={Layout} title="BANNERS DE SECCIONES" subtitle="Personaliza las imágenes de cabecera de cada sección" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTION_DEFS.map(({ key, label, description }) => {
          const banner = getBanner(key);
          const isActive = banner?.isActive ?? true;
          return (
            <div key={key} className={`bg-gray-900/60 border rounded-xl overflow-hidden transition-colors ${isActive ? "border-red-900/40" : "border-gray-800 opacity-60"}`}>
              {/* Desktop banner preview */}
              <div className="relative w-full" style={{ aspectRatio: "16/5", background: "#0a0a0a" }}>
                {banner?.imageUrl ? (
                  <>
                    <img src={banner.imageUrl} alt={label} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemove(key)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-700 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-colors">
                    <Upload size={24} className="text-red-900/50" />
                    <span className="text-xs text-gray-600 font-rajdhani">Subir banner desktop (16:5)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(key, e.target.files[0])} />
                  </label>
                )}
                {banner?.imageUrl && (
                  <label className="absolute bottom-2 left-2 cursor-pointer">
                    <div className="bg-black/70 hover:bg-red-700/80 transition-colors rounded px-2 py-1 text-xs text-white/70 flex items-center gap-1">
                      <Upload size={10} /> Cambiar
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(key, e.target.files[0])} />
                  </label>
                )}
              </div>
              {/* Info + controls */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-orbitron text-white text-sm tracking-wider">{label.toUpperCase()}</p>
                    <p className="text-gray-500 text-xs font-rajdhani">{description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(key)}
                    className={`text-xs font-orbitron px-2 py-1 rounded border transition-colors ${isActive ? "border-green-700/50 text-green-400 bg-green-900/20 hover:bg-green-900/40" : "border-gray-700 text-gray-500 bg-gray-900/40 hover:bg-gray-800"}`}
                  >
                    {isActive ? "● ACTIVO" : "○ INACTIVO"}
                  </button>
                </div>
                {/* Mobile banner */}
                <div>
                  <p className="text-xs text-gray-500 font-rajdhani mb-1">BANNER MÓVIL (opcional)</p>
                  <div className="flex items-center gap-3">
                    {banner?.mobileImageUrl ? (
                      <div className="relative w-20 h-12 rounded overflow-hidden flex-shrink-0">
                        <img src={banner.mobileImageUrl} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => handleRemove(key, true)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
                          <X size={8} className="text-white" />
                        </button>
                      </div>
                    ) : null}
                    <label className="cursor-pointer flex-1">
                      <div className="bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-700 hover:border-red-500 rounded px-3 py-2 text-gray-500 text-xs font-rajdhani flex items-center justify-center gap-1.5 transition-colors">
                        <Upload size={12} /> {banner?.mobileImageUrl ? "Cambiar móvil" : "Subir versión móvil"}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(key, e.target.files[0], true)} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
