import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Star, Plus, Edit3, Trash2, CheckCircle2, Sparkles, Package, Clock, Eye, EyeOff, CalendarClock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "../components/AdminUI";

// Convierte un datetime-local string (hora local) a ISO string UTC
function localToISO(val: string): string | undefined {
  if (!val) return undefined;
  return new Date(val).toISOString();
}

// Convierte una fecha ISO/DB a string para datetime-local (hora local del navegador)
function isoToLocal(val: string | Date | null | undefined): string {
  if (!val) return "";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return "";
  // Ajustar a hora local
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

type PublishMode = "visible" | "hidden" | "scheduled" | "limited";

export function CosmeticsPage() {
  const emptyForm = {
    name: "",
    description: "",
    type: "frame" as any,
    rarity: "common" as any,
    previewImage: "",
    frameImage: "",
    price: "",
    originalPrice: "",
    isActive: true,
    isFeatured: false,
    isLimited: false,
    maxSupply: "",
    dropStart: "",
    dropEnd: "",
    collection: "",
    sortOrder: "0",
    // Publicación unificada
    publishMode: "visible" as PublishMode,
    catalogVisible: true,
    catalogFeatured: false,
    catalogWeeklyFeatured: false,
    catalogFeaturedPriority: "0",
    catalogCollectionId: undefined as number | undefined,
    catalogPublishDate: "",   // para modo "scheduled"
    catalogVisibleFrom: "",   // para modo "limited" (inicio)
    catalogVisibleUntil: "",  // para modo "limited" (fin)
  };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingFrame, setUploadingFrame] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  // Usar el nuevo endpoint que incluye datos del catálogo
  const { data: cosmetics, refetch } = trpc.cosmetics.adminListWithCatalog.useQuery();
  const uploadImage = trpc.admin.uploadImage.useMutation();
  const suggestPrice = trpc.admin.suggestPrice.useMutation({
    onSuccess: (data) => { setAiReport(data); toast.success("Precio sugerido por IA"); },
    onError: e => toast.error("Error IA: " + e.message),
  });
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

  // Determinar el publishMode a partir de los datos del catálogo
  function inferPublishMode(cat: any): PublishMode {
    if (!cat) return "visible";
    if (!cat.isVisible) return "hidden";
    if (cat.publishDate) return "scheduled";
    if (cat.visibleFrom || cat.visibleUntil) return "limited";
    return "visible";
  }

  const startEdit = (c: any) => {
    setEditing(c.id);
    const cat = c.catalog;
    const mode = inferPublishMode(cat);
    setForm({
      name: c.name,
      description: c.description ?? "",
      type: c.type,
      rarity: c.rarity,
      previewImage: c.previewImage ?? "",
      frameImage: c.frameImage ?? "",
      price: String(c.price),
      originalPrice: c.originalPrice ? String(c.originalPrice) : "",
      isActive: c.isActive,
      isFeatured: c.isFeatured,
      isLimited: c.isLimited,
      maxSupply: c.maxSupply ? String(c.maxSupply) : "",
      dropStart: isoToLocal(c.dropStart),
      dropEnd: isoToLocal(c.dropEnd),
      collection: c.collection ?? "",
      sortOrder: String(c.sortOrder),
      publishMode: mode,
      catalogVisible: cat?.isVisible ?? true,
      catalogFeatured: cat?.isFeatured ?? false,
      catalogWeeklyFeatured: cat?.weeklyFeatured ?? false,
      catalogFeaturedPriority: String(cat?.featuredPriority ?? 0),
      catalogCollectionId: cat?.collectionId ?? undefined,
      catalogPublishDate: isoToLocal(cat?.publishDate),
      catalogVisibleFrom: isoToLocal(cat?.visibleFrom),
      catalogVisibleUntil: isoToLocal(cat?.visibleUntil),
    });
  };

  const handleSubmit = () => {
    // Calcular campos del catálogo según el modo de publicación
    let catalogVisible = true;
    let catalogPublishDate: string | undefined;
    let catalogVisibleFrom: string | undefined;
    let catalogVisibleUntil: string | undefined;

    if (form.publishMode === "hidden") {
      catalogVisible = false;
    } else if (form.publishMode === "scheduled") {
      catalogVisible = true;
      catalogPublishDate = localToISO(form.catalogPublishDate);
    } else if (form.publishMode === "limited") {
      catalogVisible = true;
      catalogVisibleFrom = localToISO(form.catalogVisibleFrom) || undefined;
      catalogVisibleUntil = localToISO(form.catalogVisibleUntil) || undefined;
    }
    // modo "visible": todo null, visible = true

    const data = {
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      rarity: form.rarity,
      previewImage: form.previewImage || undefined,
      frameImage: form.frameImage || undefined,
      price: parseInt(form.price) || 0,
      originalPrice: form.originalPrice ? parseInt(form.originalPrice) : undefined,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isLimited: form.isLimited,
      maxSupply: form.maxSupply ? parseInt(form.maxSupply) : undefined,
      dropStart: localToISO(form.dropStart),
      dropEnd: localToISO(form.dropEnd),
      collection: form.collection || undefined,
      sortOrder: parseInt(form.sortOrder) || 0,
      catalogVisible,
      catalogFeatured: form.catalogFeatured,
      catalogWeeklyFeatured: form.catalogWeeklyFeatured,
      catalogFeaturedPriority: parseInt(form.catalogFeaturedPriority) || 0,
      catalogCollectionId: form.catalogCollectionId,
      catalogPublishDate,
      catalogVisibleFrom,
      catalogVisibleUntil,
    };
    if (editing !== null) update.mutate({ id: editing, ...data });
    else create.mutate(data);
  };

  const rarityColors: Record<string, string> = {
    common: "text-zinc-400",
    rare: "text-blue-400",
    epic: "text-purple-400",
    legendary: "text-yellow-400",
    mythic: "text-red-400",
  };
  const inputCls = "w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none";

  // Opciones del modo de publicación
  const publishModes: { id: PublishMode; icon: React.ReactNode; label: string; desc: string; color: string }[] = [
    { id: "visible", icon: <Globe className="w-4 h-4" />, label: "Publicado", desc: "Visible ahora mismo en la tienda", color: "green" },
    { id: "hidden", icon: <EyeOff className="w-4 h-4" />, label: "Oculto", desc: "No aparece en la tienda", color: "zinc" },
    { id: "scheduled", icon: <CalendarClock className="w-4 h-4" />, label: "Programado", desc: "Se publica en una fecha y hora específica", color: "blue" },
    { id: "limited", icon: <Clock className="w-4 h-4" />, label: "Ventana de tiempo", desc: "Visible solo entre dos fechas", color: "orange" },
  ];

  const colorMap: Record<string, string> = {
    green: "border-green-500/50 bg-green-500/10 text-green-400",
    zinc: "border-zinc-500/50 bg-zinc-500/10 text-zinc-400",
    blue: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    orange: "border-orange-500/50 bg-orange-500/10 text-orange-400",
  };
  const colorMapInactive = "border-white/8 bg-transparent text-zinc-500";

  return (
    <div className="space-y-6 w-full">
      <PageHeader icon={Star} title="COSMÉTICOS" subtitle="Crea y administra marcos, auras y badges de perfil" />

      {/* Form */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-5 space-y-5">
        <p className="text-white font-orbitron text-sm">{editing !== null ? "EDITAR COSMÉTICO" : "NUEVO COSMÉTICO"}</p>

        {/* Campos básicos */}
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
                <SelectItem value="decoration">Decoración</SelectItem>
                <SelectItem value="effect">Efecto</SelectItem>
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
                <SelectItem value="mythic">Mítico</SelectItem>
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

        {/* Imágenes */}
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

        {/* RLC Economy Architect */}
        <div className="flex items-center justify-between bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs font-orbitron text-red-400 uppercase tracking-wider">✦ RLC Economy Architect</p>
            <p className="text-xs text-zinc-500 font-rajdhani mt-0.5">Escribe el nombre y selecciona la rareza para obtener un precio sugerido por IA</p>
          </div>
          <Button
            type="button"
            disabled={!form.name || suggestPrice.isPending}
            onClick={() => suggestPrice.mutate({ name: form.name, description: form.description || undefined, category: "digital", rarity: form.rarity })}
            className="flex-shrink-0 ml-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-orbitron text-xs px-4 py-2 h-auto"
          >
            {suggestPrice.isPending
              ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Analizando...</>
              : <><Sparkles className="w-3.5 h-3.5 mr-2" />SUGERIR PRECIO IA</>}
          </Button>
        </div>
        {aiReport && (
          <div className="bg-gradient-to-br from-red-950/40 to-zinc-900/80 border border-red-700/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" />
              <span className="text-xs font-orbitron text-red-400 uppercase tracking-wider">RLC Economy Architect</span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-red-600/10 border border-red-600/30 rounded-xl p-3">
              <div>
                <p className="text-xs text-zinc-500 font-mono">PRECIO SUGERIDO</p>
                <p className="text-2xl font-orbitron font-bold text-red-400">{aiReport.suggestedPriceRLC?.toLocaleString()} <span className="text-sm text-zinc-500">RLC</span></p>
                <p className="text-xs text-zinc-500 font-rajdhani mt-1">{aiReport.effortHours?.toFixed(1)}h de actividad · {aiReport.rarity}</p>
              </div>
              <Button onClick={() => { setForm(f => ({ ...f, price: String(aiReport.suggestedPriceRLC) })); setAiReport(null); }} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs flex-shrink-0">APLICAR</Button>
            </div>
            <p className="text-xs text-zinc-500 font-rajdhani leading-relaxed">{aiReport.justification}</p>
          </div>
        )}

        {/* Toggles básicos */}
        <div className="flex gap-6 flex-wrap">
          {[
            { key: "isActive", label: "Activo" },
            { key: "isFeatured", label: "Destacado" },
            { key: "isLimited", label: "Edición Limitada" },
            { key: "catalogFeatured", label: "Featured en portada" },
            { key: "catalogWeeklyFeatured", label: "⭐ Destacado semanal" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 accent-red-500" />
              <span className="text-zinc-400 text-xs font-rajdhani">{label}</span>
            </label>
          ))}
        </div>

        {/* Supply & Drop Window */}
        <div className="border border-white/5 rounded-xl p-4 space-y-3 bg-zinc-800/20">
          <p className="text-xs font-orbitron text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> Supply & Drop Window
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">SUPPLY MÁXIMO</label>
              <input type="number" value={form.maxSupply} onChange={e => setForm(f => ({ ...f, maxSupply: e.target.value }))} className={inputCls} placeholder="Vacío = ilimitado" min={1} />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">INICIO DEL DROP</label>
              <input type="datetime-local" value={form.dropStart} onChange={e => setForm(f => ({ ...f, dropStart: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">FIN DEL DROP</label>
              <input type="datetime-local" value={form.dropEnd} onChange={e => setForm(f => ({ ...f, dropEnd: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <p className="text-zinc-600 text-xs font-rajdhani">Si defines un drop window, el cosmético solo estará disponible durante ese período.</p>
        </div>

        {/* ── Panel de publicación unificado ────────────────────────────────── */}
        <div className="border border-white/5 rounded-xl p-4 space-y-4 bg-zinc-800/20">
          <p className="text-xs font-orbitron text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" /> Publicación en la tienda
          </p>

          {/* Selector de modo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {publishModes.map(mode => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, publishMode: mode.id }))}
                className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-150 ${form.publishMode === mode.id ? colorMap[mode.color] : colorMapInactive}`}
              >
                <span className="flex items-center gap-1.5 font-semibold text-xs">{mode.icon} {mode.label}</span>
                <span className="text-[10px] leading-tight opacity-70">{mode.desc}</span>
              </button>
            ))}
          </div>

          {/* Campos condicionales según el modo */}
          {form.publishMode === "scheduled" && (
            <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3 space-y-2">
              <p className="text-xs text-blue-300 font-rajdhani">El cosmético aparecerá en la tienda automáticamente en la fecha y hora indicada.</p>
              <div>
                <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">FECHA Y HORA DE PUBLICACIÓN *</label>
                <input
                  type="datetime-local"
                  value={form.catalogPublishDate}
                  onChange={e => setForm(f => ({ ...f, catalogPublishDate: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {form.publishMode === "limited" && (
            <div className="bg-orange-950/20 border border-orange-500/20 rounded-xl p-3 space-y-3">
              <p className="text-xs text-orange-300 font-rajdhani">El cosmético solo será visible en la tienda durante el período indicado. Fuera de ese rango quedará oculto automáticamente.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">VISIBLE DESDE</label>
                  <input
                    type="datetime-local"
                    value={form.catalogVisibleFrom}
                    onChange={e => setForm(f => ({ ...f, catalogVisibleFrom: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">VISIBLE HASTA</label>
                  <input
                    type="datetime-local"
                    value={form.catalogVisibleUntil}
                    onChange={e => setForm(f => ({ ...f, catalogVisibleUntil: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={!form.name || !form.price || create.isPending || update.isPending} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
            {create.isPending || update.isPending ? "Guardando..." : editing !== null ? "ACTUALIZAR" : "CREAR COSMÉTICO"}
          </Button>
          {editing !== null && <Button variant="outline" onClick={() => { setEditing(null); setForm(emptyForm); }} className="border-white/10 text-zinc-400 font-orbitron text-xs">CANCELAR</Button>}
        </div>
      </div>

      {/* Lista de cosméticos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {!cosmetics || cosmetics.length === 0 ? (
          <p className="text-zinc-500 text-sm col-span-4 text-center py-8 font-rajdhani">Sin cosméticos registrados</p>
        ) : cosmetics.map((c: any) => {
          const cat = c.catalog;
          const now = new Date();
          const isScheduled = cat?.publishDate && new Date(cat.publishDate) > now;
          const isLimited = cat?.visibleFrom || cat?.visibleUntil;
          const isHidden = cat && !cat.isVisible;
          return (
            <div key={c.id} className="relative group rounded-xl overflow-hidden border border-white/8 bg-zinc-900/60">
              {c.previewImage ? <img src={c.previewImage} alt={c.name} className="w-full h-32 object-cover" /> : <div className="w-full h-32 bg-zinc-800 flex items-center justify-center"><Star className="w-8 h-8 text-zinc-600" /></div>}
              {/* Badge de estado */}
              <div className="absolute top-2 left-2">
                {isHidden && <span className="bg-zinc-800/90 text-zinc-400 text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5"><EyeOff className="w-2.5 h-2.5" /> Oculto</span>}
                {isScheduled && <span className="bg-blue-900/90 text-blue-300 text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5"><CalendarClock className="w-2.5 h-2.5" /> Programado</span>}
                {!isHidden && !isScheduled && isLimited && <span className="bg-orange-900/90 text-orange-300 text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> Limitado</span>}
                {!isHidden && !isScheduled && !isLimited && cat?.isVisible && <span className="bg-green-900/90 text-green-300 text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5"><Globe className="w-2.5 h-2.5" /> Publicado</span>}
              </div>
              <div className="p-3">
                <p className="text-white font-rajdhani font-semibold text-sm truncate">{c.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-orbitron ${rarityColors[c.rarity] ?? "text-zinc-400"}`}>{c.rarity?.toUpperCase()}</span>
                  <span className="text-yellow-400 text-xs font-orbitron">{c.price} RLC</span>
                </div>
                {c.frameImage && <p className="text-green-500 text-xs font-rajdhani mt-0.5 flex items-center gap-0.5"><CheckCircle2 size={11} /> PNG cargado</p>}
                {c.maxSupply && (
                  <p className="text-orange-400 text-xs font-rajdhani mt-0.5 flex items-center gap-0.5">
                    <Package size={10} /> {c.currentSupply ?? 0}/{c.maxSupply} vendidos
                  </p>
                )}
                {isScheduled && cat?.publishDate && (
                  <p className="text-blue-400 text-xs font-rajdhani mt-0.5 flex items-center gap-0.5">
                    <CalendarClock size={10} /> {new Date(cat.publishDate).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                )}
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(c)} className="bg-black/60 hover:bg-zinc-800 rounded p-1"><Edit3 className="w-3 h-3 text-white" /></button>
                <button onClick={() => { if (confirm(`¿Eliminar ${c.name}?`)) del.mutate({ id: c.id }); }} className="bg-black/60 hover:bg-red-900/80 rounded p-1"><Trash2 className="w-3 h-3 text-red-400" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
