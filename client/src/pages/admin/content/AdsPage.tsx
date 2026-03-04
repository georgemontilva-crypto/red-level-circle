/**
 * AdsPage — Gestión de publicidades del carrusel principal de la home.
 * Permite crear, editar, activar/desactivar y eliminar anuncios.
 */
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Trash2, Upload, ToggleLeft, ToggleRight, Edit2, X, Check, ExternalLink, Megaphone } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

interface AdForm {
  brandName: string;
  title: string;
  tagline: string;
  ctaLabel: string;
  destinationUrl: string;
  accentColor: string;
  bannerImage: string;
  mobileImage: string;
  logoImage: string;
  isFeatured: boolean;
}

const EMPTY_FORM: AdForm = {
  brandName: "",
  title: "",
  tagline: "",
  ctaLabel: "Ver más",
  destinationUrl: "",
  accentColor: "#dc2626",
  bannerImage: "",
  mobileImage: "",
  logoImage: "",
  isFeatured: true,
};

export function AdsPage() {
  const { data: ads, refetch } = trpc.admin.listAds.useQuery();
  const createAd = trpc.admin.createAd.useMutation({
    onSuccess: () => { toast.success("Publicidad creada"); refetch(); setShowCreate(false); setForm(EMPTY_FORM); },
    onError: e => toast.error(e.message),
  });
  const updateAd = trpc.admin.updateAd.useMutation({
    onSuccess: () => { toast.success("Guardado"); refetch(); setEditingId(null); },
    onError: e => toast.error(e.message),
  });
  const deleteAd = trpc.admin.deleteAd.useMutation({
    onSuccess: () => { toast.success("Eliminado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const uploadImage = trpc.admin.uploadImage.useMutation({
    onError: e => toast.error(e.message),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<AdForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdForm>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = async (field: "bannerImage" | "mobileImage" | "logoImage", file: File, isEdit = false) => {
    if (!file.type.startsWith("image/")) { toast.error("Solo imágenes"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
    setUploading(field);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      const mimeType = file.type as any;
      try {
        const { url } = await uploadImage.mutateAsync({ base64, mimeType, folder: "ads" });
        if (isEdit) setEditForm(f => ({ ...f, [field]: url }));
        else setForm(f => ({ ...f, [field]: url }));
        toast.success("Imagen subida");
      } finally {
        setUploading(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (!form.brandName.trim()) { toast.error("El nombre de la marca es requerido"); return; }
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    if (!form.bannerImage) { toast.error("La imagen del banner es requerida"); return; }
    createAd.mutate({
      brand: form.brandName,
      title: form.title,
      tagline: form.tagline || undefined,
      ctaLabel: form.ctaLabel || undefined,
      linkUrl: form.destinationUrl || undefined,
      accentColor: form.accentColor || undefined,
      imageUrl: form.bannerImage,
      adType: "featured",
      isFeatured: form.isFeatured,
    });

  };

  const handleSaveEdit = (id: number) => {
    updateAd.mutate({
      id,
      title: editForm.title,
      tagline: editForm.tagline,
      ctaLabel: editForm.ctaLabel,
      linkUrl: editForm.destinationUrl,
      accentColor: editForm.accentColor,
      imageUrl: editForm.bannerImage,
      mobileImageUrl: editForm.mobileImage || undefined,
      isFeatured: editForm.isFeatured,
    });
  };

  const startEdit = (ad: any) => {
    setEditingId(ad.id);
    setEditForm({
      brandName: ad.brandName ?? "",
      title: ad.title ?? "",
      tagline: ad.tagline ?? "",
      ctaLabel: ad.ctaLabel ?? "Ver más",
      destinationUrl: ad.destinationUrl ?? "",
      accentColor: ad.accentColor ?? "#dc2626",
      bannerImage: ad.bannerImage ?? "",
      mobileImage: ad.logoImage ?? "",
      logoImage: ad.logoImage ?? "",
      isFeatured: ad.isFeatured ?? true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <PageHeader
          title="Publicidades"
          subtitle="Gestiona los banners del carrusel principal de la home"
          icon={Megaphone}
        />
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          <Plus size={16} /> Nueva publicidad
        </button>
      </div>

      {/* ── Formulario de creación ── */}
      {showCreate && (
        <div className="rounded-xl border border-red-600/30 bg-zinc-900/80 p-6 space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-orbitron text-white font-bold text-sm tracking-wider">NUEVA PUBLICIDAD</h3>
            <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }} className="text-zinc-500 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 font-mono mb-1 block">Nombre de la marca *</label>
              <input
                value={form.brandName}
                onChange={e => setForm(f => ({ ...f, brandName: e.target.value }))}
                placeholder="Ej: Zona Game"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-mono mb-1 block">Título del slide *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ej: ¡Nuevo patrocinador oficial!"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-mono mb-1 block">Tagline (subtítulo)</label>
              <input
                value={form.tagline}
                onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                placeholder="Ej: Aliado oficial de RLC"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-mono mb-1 block">Texto del botón CTA</label>
              <input
                value={form.ctaLabel}
                onChange={e => setForm(f => ({ ...f, ctaLabel: e.target.value }))}
                placeholder="Ver más"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-mono mb-1 block">URL de destino</label>
              <input
                value={form.destinationUrl}
                onChange={e => setForm(f => ({ ...f, destinationUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-mono mb-1 block">Color de acento</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  value={form.accentColor}
                  onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                  placeholder="#dc2626"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Imágenes — desktop y móvil en 2 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Imagen del banner desktop */}
          <div>
            <label className="text-xs text-zinc-400 font-mono mb-2 block">Imagen desktop * (recomendado: 1920×540px)</label>
            <div
              className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-zinc-700 hover:border-red-500 transition-colors"
              style={{ height: "160px", background: form.bannerImage ? `url(${form.bannerImage}) center/cover` : "#18181b" }}
            >
              {!form.bannerImage && (
                <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <Upload size={28} className="text-zinc-600" />
                  <span className="text-xs text-zinc-500">Subir imagen del banner</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("bannerImage", e.target.files[0])} />
                </label>
              )}
              {form.bannerImage && (
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <label className="cursor-pointer bg-black/70 hover:bg-red-700/80 transition-colors rounded px-2 py-1 text-xs text-white flex items-center gap-1">
                    <Upload size={10} /> Cambiar
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("bannerImage", e.target.files[0])} />
                  </label>
                  <button onClick={() => setForm(f => ({ ...f, bannerImage: "" }))} className="bg-black/70 hover:bg-red-700/80 transition-colors rounded px-2 py-1 text-xs text-white flex items-center gap-1">
                    <X size={10} /> Quitar
                  </button>
                </div>
              )}
              {uploading === "bannerImage" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="text-xs text-white font-mono animate-pulse">Subiendo...</span>
                </div>
              )}
            </div>
          </div>

          {/* Imagen móvil */}
          <div>
            <label className="text-xs text-zinc-400 font-mono mb-2 block">Imagen móvil (recomendado: 640×360px)</label>
            <div
              className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-zinc-700 hover:border-red-500 transition-colors"
              style={{ height: "160px", background: form.mobileImage ? `url(${form.mobileImage}) center/cover` : "#18181b" }}
            >
              {!form.mobileImage && (
                <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <Upload size={22} className="text-zinc-600" />
                  <span className="text-xs text-zinc-500">Subir imagen para teléfono</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("mobileImage", e.target.files[0])} />
                </label>
              )}
              {form.mobileImage && (
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <label className="cursor-pointer bg-black/70 hover:bg-red-700/80 transition-colors rounded px-2 py-1 text-xs text-white flex items-center gap-1">
                    <Upload size={10} /> Cambiar
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("mobileImage", e.target.files[0])} />
                  </label>
                  <button onClick={() => setForm(f => ({ ...f, mobileImage: "" }))} className="bg-black/70 hover:bg-red-700/80 transition-colors rounded px-2 py-1 text-xs text-white flex items-center gap-1">
                    <X size={10} /> Quitar
                  </button>
                </div>
              )}
              {uploading === "mobileImage" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="text-xs text-white font-mono animate-pulse">Subiendo...</span>
                </div>
              )}
            </div>
          </div>
          </div>{/* end grid imágenes */}

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-xs text-zinc-400 font-mono">Activo en el carrusel</span>
            </label>
            <button
              onClick={handleCreate}
              disabled={createAd.isPending || !!uploading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
            >
              <Check size={15} /> {createAd.isPending ? "Creando..." : "Crear publicidad"}
            </button>
          </div>
        </div>
      )}

      {/* ── Lista de publicidades ── */}
      {!ads || ads.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="font-mono text-sm">No hay publicidades creadas aún.</p>
          <p className="text-xs mt-1">Crea la primera para activar el carrusel en la home.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad: any) => (
            <div
              key={ad.id}
              className="rounded-xl border overflow-hidden transition-all"
              style={{ borderColor: ad.isActive ? "oklch(0.45 0.22 25 / 0.30)" : "oklch(0.20 0.01 0)", background: "oklch(0.11 0.005 0)" }}
            >
              {editingId === ad.id ? (
                /* ── Modo edición ── */
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-orbitron text-white text-xs tracking-wider">EDITANDO: {ad.brandName}</h4>
                    <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "title", label: "Título", placeholder: "Título del slide" },
                      { key: "tagline", label: "Tagline", placeholder: "Subtítulo" },
                      { key: "ctaLabel", label: "Botón CTA", placeholder: "Ver más" },
                      { key: "destinationUrl", label: "URL destino", placeholder: "https://..." },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs text-zinc-500 font-mono mb-1 block">{label}</label>
                        <input
                          value={(editForm as any)[key] ?? ""}
                          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500"
                        />
                      </div>
                    ))}
                  </div>
                  {/* Imágenes en edición — desktop y móvil */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-500 font-mono mb-2 block">Imagen desktop</label>
                      <div
                        className="relative w-full rounded-xl overflow-hidden border border-zinc-700"
                        style={{ height: "110px", background: editForm.bannerImage ? `url(${editForm.bannerImage}) center/cover` : "#18181b" }}
                      >
                        {!editForm.bannerImage && <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">Sin imagen</div>}
                        <label className="absolute bottom-2 right-2 cursor-pointer bg-black/70 hover:bg-red-700/80 transition-colors rounded px-2 py-1 text-xs text-white flex items-center gap-1">
                          <Upload size={10} /> {editForm.bannerImage ? "Cambiar" : "Subir"}
                          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("bannerImage", e.target.files[0], true)} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 font-mono mb-2 block">Imagen móvil</label>
                      <div
                        className="relative w-full rounded-xl overflow-hidden border border-zinc-700"
                        style={{ height: "110px", background: editForm.mobileImage ? `url(${editForm.mobileImage}) center/cover` : "#18181b" }}
                      >
                        {!editForm.mobileImage && (
                          <label className="absolute inset-0 flex flex-col items-center justify-center gap-1 cursor-pointer">
                            <Upload size={16} className="text-zinc-600" />
                            <span className="text-xs text-zinc-600">Subir móvil</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("mobileImage", e.target.files[0], true)} />
                          </label>
                        )}
                        {editForm.mobileImage && (
                          <>
                            <label className="absolute bottom-2 right-2 cursor-pointer bg-black/70 hover:bg-red-700/80 transition-colors rounded px-2 py-1 text-xs text-white flex items-center gap-1">
                              <Upload size={10} /> Cambiar
                              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("mobileImage", e.target.files[0], true)} />
                            </label>
                            <button onClick={() => setEditForm(f => ({ ...f, mobileImage: "" }))} className="absolute top-2 right-2 bg-black/70 hover:bg-red-700/80 rounded p-0.5">
                              <X size={10} className="text-white" />
                            </button>
                          </>
                        )}
                        {uploading === "mobileImage" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <span className="text-xs text-white font-mono animate-pulse">Subiendo...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg text-xs font-mono text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors">
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveEdit(ad.id)}
                      disabled={updateAd.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                    >
                      <Check size={13} /> Guardar
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Vista normal ── */
                <div className="flex gap-4 p-4 items-start">
                  {/* Miniatura */}
                  <div className="w-32 h-20 rounded-lg overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                    {ad.bannerImage ? (
                      <img src={ad.bannerImage} alt={ad.brandName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-zinc-600 text-xs font-mono">Sin imagen</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-orbitron text-white text-sm font-bold">{ad.brandName}</span>
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded-full"
                        style={{
                          background: ad.isActive ? "oklch(0.25 0.10 145 / 0.20)" : "oklch(0.18 0.005 0 / 0.50)",
                          color: ad.isActive ? "oklch(0.65 0.18 145)" : "oklch(0.45 0.005 0)",
                          border: `1px solid ${ad.isActive ? "oklch(0.45 0.15 145 / 0.40)" : "oklch(0.28 0.005 0)"}`,
                        }}
                      >
                        {ad.isActive ? "● Activo" : "○ Inactivo"}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-xs truncate mb-0.5">{ad.title}</p>
                    {ad.tagline && <p className="text-zinc-500 text-xs truncate">{ad.tagline}</p>}
                    {ad.destinationUrl && (
                      <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 mt-1 transition-colors">
                        <ExternalLink size={10} /> {ad.destinationUrl}
                      </a>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-600 font-mono">
                      <span>{ad.impressionCount ?? 0} impresiones</span>
                      <span>{ad.clickCount ?? 0} clics</span>
                    </div>
                  </div>
                  {/* Acciones */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateAd.mutate({ id: ad.id, isActive: !ad.isActive })}
                      title={ad.isActive ? "Desactivar" : "Activar"}
                      className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      {ad.isActive
                        ? <ToggleRight size={20} className="text-green-400" />
                        : <ToggleLeft size={20} className="text-zinc-500" />
                      }
                    </button>
                    <button
                      onClick={() => startEdit(ad)}
                      title="Editar"
                      className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`¿Eliminar "${ad.brandName}"?`)) deleteAd.mutate({ id: ad.id }); }}
                      title="Eliminar"
                      className="p-2 rounded-lg hover:bg-red-900/30 transition-colors text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
