import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import {
  MapPin, CheckCircle, XCircle, Star, Trash2, Clock,
  Edit3, Upload, Instagram, Twitter, Facebook, Globe,
  Phone, Mail, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "../components/AdminUI";

type AllyEditForm = {
  name: string;
  description: string;
  website: string;
  country: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  instagram: string;
  twitter: string;
  facebook: string;
  adminNote: string;
  logo: string;
  coverImage: string;
};

function AllyRow({ a, onUpdate, onDelete }: { a: any; onUpdate: (data: any) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [form, setForm] = useState<AllyEditForm>({
    name: a.name ?? "",
    description: a.description ?? "",
    website: a.website ?? "",
    country: a.country ?? "",
    city: a.city ?? "",
    address: a.address ?? "",
    email: a.email ?? "",
    phone: a.phone ?? "",
    instagram: a.instagram ?? "",
    twitter: a.twitter ?? "",
    facebook: a.facebook ?? "",
    adminNote: a.adminNote ?? "",
    logo: a.logo ?? "",
    coverImage: a.coverImage ?? "",
  });

  const uploadAllyImage = trpc.allies.uploadImage.useMutation();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setter = type === "logo" ? setUploadingLogo : setUploadingCover;
    setter(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target?.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      const mimeType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/avif";
      const result = await uploadAllyImage.mutateAsync({ base64, mimeType, allyId: a.id, type });
      const field = type === "logo" ? "logo" : "coverImage";
      setForm(f => ({ ...f, [field]: result.url }));
      toast.success(`${type === "logo" ? "Logo" : "Banner"} actualizado`);
    } catch {
      toast.error("Error al subir imagen");
    } finally {
      setter(false);
    }
  };

  const handleSave = () => {
    onUpdate({
      id: a.id,
      name: form.name || undefined,
      description: form.description || undefined,
      website: form.website || undefined,
      country: form.country || undefined,
      city: form.city || undefined,
      address: form.address || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      instagram: form.instagram || undefined,
      twitter: form.twitter || undefined,
      facebook: form.facebook || undefined,
      adminNote: form.adminNote || undefined,
      logo: form.logo || undefined,
      coverImage: form.coverImage || undefined,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      onDelete();
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  const inputCls = "w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600";

  return (
    <div className="bg-zinc-900/60 border border-white/8 rounded-xl overflow-hidden">
      {/* Compact row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Logo thumbnail */}
        {a.logo ? (
          <img src={a.logo} alt={a.name} className="w-9 h-9 rounded-lg object-contain bg-zinc-800 border border-white/10 p-0.5 flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10 flex-shrink-0">
            <MapPin className="w-4 h-4 text-red-500" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-white">{a.name}</span>
            {a.isFeatured && <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 rounded font-mono leading-5">DESTACADO</span>}
            <span className={`text-xs px-1.5 rounded font-mono leading-5 border ${
              a.status === "approved" ? "bg-green-500/20 text-green-400 border-green-500/30" :
              a.status === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30" :
              "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            }`}>
              {a.status === "approved" ? "APROBADO" : a.status === "rejected" ? "RECHAZADO" : "PENDIENTE"}
            </span>
          </div>
          <p className="text-zinc-500 text-xs truncate">
            {[a.city, a.country].filter(Boolean).join(", ")}
            {a.email && ` · ${a.email}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {a.status !== "approved" && (
            <button onClick={() => onUpdate({ id: a.id, status: "approved" })}
              className="p-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white transition-colors" title="Aprobar">
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {a.status !== "rejected" && (
            <button onClick={() => onUpdate({ id: a.id, status: "rejected" })}
              className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors" title="Rechazar">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => onUpdate({ id: a.id, isFeatured: !a.isFeatured })}
            className={`p-1.5 rounded-lg transition-colors ${a.isFeatured ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40" : "text-zinc-500 hover:bg-zinc-700 hover:text-yellow-400"}`}
            title={a.isFeatured ? "Quitar destacado" : "Destacar"}>
            <Star className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setEditing(v => !v)}
            className={`p-1.5 rounded-lg transition-colors ${editing ? "bg-blue-500/20 text-blue-400" : "text-zinc-500 hover:bg-zinc-700 hover:text-white"}`}
            title="Editar">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDelete}
            className={`p-1.5 rounded-lg transition-colors ${deleteConfirm ? "bg-red-600 text-white" : "text-zinc-500 hover:bg-red-900/40 hover:text-red-400"}`}
            title={deleteConfirm ? "Confirmar eliminación" : "Eliminar"}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="border-t border-white/8 px-4 py-4 bg-zinc-950/30 space-y-4">
          <p className="font-orbitron text-xs text-white">EDITAR ALIADO</p>

          {/* Images */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Logo / Ícono</label>
              <div className="relative group border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg overflow-hidden transition-colors cursor-pointer">
                {form.logo ? (
                  <img src={form.logo} alt="logo" className="w-full h-24 object-contain bg-zinc-900 p-2" />
                ) : (
                  <div className="w-full h-24 bg-zinc-900 flex flex-col items-center justify-center gap-1 text-zinc-600">
                    <MapPin className="w-6 h-6" />
                    <span className="text-xs">Sin logo</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center gap-1">
                  <Upload className="w-4 h-4 text-white" />
                  <span className="text-xs text-white">{uploadingLogo ? "Subiendo..." : "Cambiar logo"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "logo")} disabled={uploadingLogo} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Banner / Portada</label>
              <div className="relative group border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg overflow-hidden transition-colors cursor-pointer">
                {form.coverImage ? (
                  <img src={form.coverImage} alt="cover" className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-zinc-900 flex flex-col items-center justify-center gap-1 text-zinc-600">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-xs">Sin banner</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center gap-1">
                  <Upload className="w-4 h-4 text-white" />
                  <span className="text-xs text-white">{uploadingCover ? "Subiendo..." : "Cambiar banner"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "cover")} disabled={uploadingCover} />
                </label>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Nombre</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Nombre del aliado" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase flex items-center gap-1"><Globe className="w-3 h-3" /> Sitio web</label>
              <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className={inputCls} placeholder="https://..." type="url" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Descripción</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} resize-none`} rows={3} placeholder="Descripción del aliado..." />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">País</label>
              <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className={inputCls} placeholder="Colombia" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Ciudad</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} placeholder="Bogotá" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Dirección</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} placeholder="Calle 123..." />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="contacto@tienda.com" type="email" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} placeholder="+57 300 000 0000" />
            </div>
          </div>

          {/* Social networks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</label>
              <input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} className={inputCls} placeholder="@usuario" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase flex items-center gap-1"><Twitter className="w-3 h-3" /> Twitter / X</label>
              <input value={form.twitter} onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))} className={inputCls} placeholder="@usuario" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase flex items-center gap-1"><Facebook className="w-3 h-3" /> Facebook</label>
              <input value={form.facebook} onChange={e => setForm(f => ({ ...f, facebook: e.target.value }))} className={inputCls} placeholder="facebook.com/pagina" />
            </div>
          </div>

          {/* Admin note */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Nota admin (interna)</label>
            <input value={form.adminNote} onChange={e => setForm(f => ({ ...f, adminNote: e.target.value }))} className={inputCls} placeholder="Nota interna visible solo para admins..." />
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-3 pt-1">
            <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs h-8">
              GUARDAR CAMBIOS
            </Button>
            <Button onClick={() => setEditing(false)} variant="outline" className="border-white/10 text-zinc-400 font-orbitron text-xs h-8">
              CANCELAR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AlliesPage() {
  const utils = trpc.useUtils();
  const { data: allies } = trpc.allies.adminList.useQuery();
  const updateAlly = trpc.allies.update.useMutation({
    onSuccess: () => { toast.success("Aliado actualizado"); utils.allies.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteAlly = trpc.allies.delete.useMutation({
    onSuccess: () => { toast.success("Aliado eliminado"); utils.allies.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const byStatus = {
    pending: (allies ?? []).filter((a: any) => a.status === "pending"),
    approved: (allies ?? []).filter((a: any) => a.status === "approved"),
    rejected: (allies ?? []).filter((a: any) => a.status === "rejected"),
  };

  const Section = ({ label, color, icon: Icon, items }: { label: string; color: string; icon: any; items: any[] }) =>
    items.length > 0 ? (
      <div>
        <h3 className={`font-orbitron text-xs mb-2 flex items-center gap-1.5 ${color}`}>
          <Icon className="w-3.5 h-3.5" /> {label} ({items.length})
        </h3>
        <div className="space-y-2">
          {items.map((a: any) => (
            <AllyRow key={a.id} a={a}
              onUpdate={data => updateAlly.mutate(data)}
              onDelete={() => deleteAlly.mutate({ id: a.id })}
            />
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-5 w-full">
      <PageHeader icon={MapPin} title="ALIADOS" subtitle="Gestiona el directorio de tiendas y sponsors" />
      <Section label="Pendientes" color="text-yellow-400" icon={Clock} items={byStatus.pending} />
      <Section label="Aprobados" color="text-green-400" icon={CheckCircle} items={byStatus.approved} />
      <Section label="Rechazados" color="text-red-400" icon={XCircle} items={byStatus.rejected} />
      {(allies?.length ?? 0) === 0 && (
        <EmptyState icon={MapPin} title="No hay solicitudes de aliados aún" />
      )}
    </div>
  );
}

export default AlliesPage;
