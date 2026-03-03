import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Star, Plus, Edit3, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "../components/AdminUI";

export function CosmeticsPage() {
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
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
    if (field === "previewImage") setUploadingPreview(true); else setUploadingFrame(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const result = await uploadImage.mutateAsync({ base64, mimeType: file.type as any, folder: "cosmetics" });
      setForm(f => ({ ...f, [field]: result.url }));
      if (field === "previewImage") setUploadingPreview(false); else setUploadingFrame(false);
    };
    reader.readAsDataURL(file);
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

  const rarityColors: Record<string, string> = { common: "text-zinc-400", rare: "text-blue-400", epic: "text-purple-400", legendary: "text-yellow-400" };
  const inputCls = "w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none";

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader icon={Star} title="COSMÉTICOS" subtitle="Crea y administra marcos, auras y badges de perfil" />

      {/* Form */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-5 space-y-4">
        <p className="text-white font-orbitron text-sm">{editing !== null ? "EDITAR COSMÉTICO" : "NUEVO COSMÉTICO"}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">NOMBRE *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Ej: Marco Neon Rojo" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">COLECCIÓN</label>
            <input value={form.collection} onChange={e => setForm(f => ({ ...f, collection: e.target.value }))} className={inputCls} placeholder="Ej: Red Level Pack" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">TIPO</label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="frame">Marco</SelectItem>
                <SelectItem value="aura">Aura</SelectItem>
                <SelectItem value="badge">Insignia</SelectItem>
                <SelectItem value="background">Fondo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">RAREZA</label>
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
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">PRECIO (RLC) *</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputCls} placeholder="500" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">PRECIO ORIGINAL (opcional)</label>
            <input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} className={inputCls} placeholder="800 (para mostrar descuento)" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">DESCRIPCIÓN</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Descripción breve del cosmético" />
          </div>
        </div>

        {/* Image uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">IMAGEN DE PREVIEW (tarjeta en la tienda)</label>
            <div className="flex items-center gap-3">
              {form.previewImage && <img src={form.previewImage} alt="" className="w-16 h-16 object-cover rounded-lg border border-white/10 flex-shrink-0" />}
              <label className="cursor-pointer flex-1">
                <div className="bg-zinc-800 hover:bg-zinc-700 border border-dashed border-white/10 hover:border-red-500 rounded-lg px-3 py-3 text-zinc-500 text-xs font-rajdhani flex items-center justify-center gap-2 transition-colors">
                  {uploadingPreview ? <><div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> Subiendo...</> : <><Plus className="w-3.5 h-3.5" /> {form.previewImage ? "Cambiar preview" : "Subir preview"}</>}
                </div>
                <input type="file" accept="image/*" className="hidden" disabled={uploadingPreview} onChange={e => e.target.files?.[0] && handleUpload("previewImage", e.target.files[0])} />
              </label>
            </div>
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">PNG DEL MARCO/AURA (overlay transparente)</label>
            <div className="flex items-center gap-3">
              {form.frameImage && <div className="w-16 h-16 rounded-lg border border-white/10 flex-shrink-0 bg-zinc-800/50 flex items-center justify-center overflow-hidden"><img src={form.frameImage} alt="" className="w-full h-full object-contain" /></div>}
              <label className="cursor-pointer flex-1">
                <div className="bg-zinc-800 hover:bg-zinc-700 border border-dashed border-white/10 hover:border-red-500 rounded-lg px-3 py-3 text-zinc-500 text-xs font-rajdhani flex items-center justify-center gap-2 transition-colors">
                  {uploadingFrame ? <><div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> Subiendo...</> : <><Plus className="w-3.5 h-3.5" /> {form.frameImage ? "Cambiar PNG" : "Subir PNG"}</>}
                </div>
                <input type="file" accept="image/png,image/webp" className="hidden" disabled={uploadingFrame} onChange={e => e.target.files?.[0] && handleUpload("frameImage", e.target.files[0])} />
              </label>
            </div>
            <p className="text-zinc-600 text-xs mt-1 font-rajdhani">Recomendado: PNG con fondo transparente, 512×512px</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-6 flex-wrap">
          {[{ key: "isActive", label: "Activo" }, { key: "isFeatured", label: "Destacado" }, { key: "isLimited", label: "Edición Limitada" }].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 accent-red-500" />
              <span className="text-zinc-400 text-xs font-rajdhani">{label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={!form.name || !form.price || create.isPending || update.isPending} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
            {create.isPending || update.isPending ? "Guardando..." : editing !== null ? "ACTUALIZAR" : "CREAR COSMÉTICO"}
          </Button>
          {editing !== null && <Button variant="outline" onClick={() => { setEditing(null); setForm(emptyForm); }} className="border-white/10 text-zinc-400 font-orbitron text-xs">CANCELAR</Button>}
        </div>
      </div>

      {/* Cosmetics list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {!cosmetics || cosmetics.length === 0 ? (
          <p className="text-zinc-500 text-sm col-span-4 text-center py-8 font-rajdhani">Sin cosméticos registrados</p>
        ) : cosmetics.map((c: any) => (
          <div key={c.id} className="relative group rounded-xl overflow-hidden border border-white/8 bg-zinc-900/60">
            {c.previewImage ? <img src={c.previewImage} alt={c.name} className="w-full h-32 object-cover" /> : <div className="w-full h-32 bg-zinc-800 flex items-center justify-center"><Star className="w-8 h-8 text-zinc-600" /></div>}
            <div className="p-3">
              <p className="text-white font-rajdhani font-semibold text-sm truncate">{c.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-orbitron ${rarityColors[c.rarity] ?? "text-zinc-400"}`}>{c.rarity?.toUpperCase()}</span>
                <span className="text-yellow-400 text-xs font-orbitron">{c.price} RLC</span>
              </div>
              {c.frameImage && <p className="text-green-500 text-xs font-rajdhani mt-0.5 flex items-center gap-0.5"><CheckCircle2 size={11} /> PNG cargado</p>}
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(c)} className="bg-black/60 hover:bg-zinc-800 rounded p-1"><Edit3 className="w-3 h-3 text-white" /></button>
              <button onClick={() => { if (confirm(`¿Eliminar ${c.name}?`)) del.mutate({ id: c.id }); }} className="bg-black/60 hover:bg-red-900/80 rounded p-1"><Trash2 className="w-3 h-3 text-red-400" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
