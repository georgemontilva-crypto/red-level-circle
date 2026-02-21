import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users, ShoppingBag, Star, Megaphone, Gift, Newspaper,
  Trophy, Coins, Shield, CheckCircle, XCircle, Edit3,
  Trash2, Plus, Package, Eye, BarChart3
} from "lucide-react";
import { useState } from "react";
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
              {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : <Users className="w-5 h-5 text-gray-500" />}
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
  const { data: orders, refetch: refetchOrders } = trpc.admin.listOrders.useQuery();
  const createItem = trpc.admin.createShopItem.useMutation({
    onSuccess: () => { toast.success("Producto creado"); setShowForm(false); },
    onError: e => toast.error(e.message),
  });
  const updateOrder = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => { toast.success("Pedido actualizado"); refetchOrders(); },
    onError: e => toast.error(e.message),
  });

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400 border-yellow-600/40",
    delivered: "text-green-400 border-green-600/40",
    cancelled: "text-red-400 border-red-600/40",
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
              {[
                { key: "name", label: "Nombre", placeholder: "Nombre del producto" },
                { key: "imageUrl", label: "URL de imagen", placeholder: "https://..." },
                { key: "price", label: "Precio (RLC)", placeholder: "500", type: "number" },
                { key: "stock", label: "Stock (-1 = ilimitado)", placeholder: "-1", type: "number" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">{label}</label>
                  <input
                    type={type ?? "text"}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              ))}
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
                disabled={!form.name || !form.price || createItem.isPending}
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
function AdsTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ brand: "", title: "", description: "", imageUrl: "", linkUrl: "", isPremium: false, isFeatured: false });
  const { data: ads, refetch } = trpc.admin.listAds.useQuery();
  const createAd = trpc.admin.createAd.useMutation({
    onSuccess: () => { toast.success("Publicidad creada"); setShowForm(false); refetch(); },
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

  return (
    <div className="space-y-6">
      <SectionHeader icon={Megaphone} title="PUBLICIDAD DE MARCAS" subtitle="Gestiona los anuncios de la plataforma" />
      <Button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        NUEVO ANUNCIO
      </Button>
      {showForm && (
        <div className="bg-gray-900/60 border border-red-900/40 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "brand", label: "Marca", placeholder: "Nombre de la marca" },
              { key: "title", label: "Título", placeholder: "Título del anuncio" },
              { key: "imageUrl", label: "URL de imagen", placeholder: "https://..." },
              { key: "linkUrl", label: "URL de destino", placeholder: "https://..." },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">{label}</label>
                <input
                  value={form[key as keyof typeof form] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPremium} onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))} className="accent-red-500" />
                <span className="text-xs text-gray-400 font-rajdhani">PREMIUM</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="accent-red-500" />
                <span className="text-xs text-gray-400 font-rajdhani">DESTACADO</span>
              </label>
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

      {/* Ads list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ads?.map(ad => (
          <div key={ad.id} className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
            {ad.bannerImage && (
              <div className="h-32 overflow-hidden">
                <img src={ad.bannerImage} alt={ad.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500 font-rajdhani">{ad.brandName}</p>
                  <p className="text-white font-rajdhani font-semibold">{ad.title}</p>
                </div>
                <div className="flex gap-1">
                  {ad.isFeatured && <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-600/40">DEST.</Badge>}
                  {ad.isPremium && <Badge className="text-xs bg-red-500/20 text-red-400 border-red-600/40">PREM.</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-xs ${ad.isActive ? "text-green-400" : "text-gray-500"}`}>
                  {ad.isActive ? "● Activo" : "○ Inactivo"}
                </span>
                <span className="text-gray-600 text-xs">{ad.clickCount ?? 0} clicks · {ad.impressionCount ?? 0} impresiones</span>
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
  );
}

// ─── Rewards Tab ──────────────────────────────────────────────────────────────
function RewardsTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "video" as any, rewardAmount: "", contentUrl: "", durationSeconds: "" });
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
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Descripción</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => createReward.mutate({ ...form, rewardAmount: parseInt(form.rewardAmount), durationSeconds: parseInt(form.durationSeconds) || undefined })}
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
              <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase">Imagen de portada (URL)</label>
              <input value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="https://..."
                className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
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

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();

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

  const { data: users } = trpc.admin.listUsers.useQuery({ search: undefined });
  const { data: orders } = trpc.admin.listOrders.useQuery();
  const { data: pending } = trpc.admin.pendingTournaments.useQuery();

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Usuarios" value={users?.length ?? 0} icon={Users} color="text-blue-400" />
        <StatCard label="Pedidos pendientes" value={orders?.filter(o => o.status === "pending").length ?? 0} icon={Package} color="text-yellow-400" />
        <StatCard label="Torneos pendientes" value={pending?.length ?? 0} icon={Trophy} color="text-red-400" />
        <StatCard label="Usuarios premium" value={users?.filter(u => u.role === "premium" || u.role === "admin").length ?? 0} icon={Crown} color="text-purple-400" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tournaments">
        <TabsList className="bg-gray-900/60 border border-red-900/30 rounded-xl p-1 flex-wrap h-auto gap-1">
          {[
            { value: "tournaments", label: "TORNEOS", icon: Trophy },
            { value: "users", label: "USUARIOS", icon: Users },
            { value: "shop", label: "TIENDA", icon: ShoppingBag },
            { value: "ads", label: "PUBLICIDAD", icon: Megaphone },
            { value: "rewards", label: "REWARDS", icon: Gift },
            { value: "news", label: "NOTICIAS", icon: Newspaper },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="font-orbitron text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="tournaments"><TournamentsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="shop"><ShopTab /></TabsContent>
          <TabsContent value="ads"><AdsTab /></TabsContent>
          <TabsContent value="rewards"><RewardsTab /></TabsContent>
          <TabsContent value="news"><NewsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Need Crown import
function Crown(props: any) {
  return <Star {...props} />;
}
