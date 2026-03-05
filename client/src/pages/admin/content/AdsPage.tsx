/**
 * AdsPage — Gestión de publicidades del carrusel principal de la home.
 * Permite crear, editar, activar/desactivar y eliminar anuncios.
 *
 * MEDIDAS EXACTAS DEL BANNER:
 *   PC (≥1024px):     1200 × 480 px  (proporción 2.5:1)
 *   Tablet (768–1023px): 1024 × 410 px  (proporción 2.5:1)
 *   Móvil (<768px):   800 × 320 px   (proporción 2.5:1)
 *
 * El banner usa la misma proporción en todos los dispositivos (clamp 50vw).
 * Se recomienda subir UNA imagen de 1200×480px para desktop/tablet,
 * y una imagen de 800×320px para móvil (se carga la correcta según dispositivo).
 */
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Trash2, Upload, ToggleLeft, ToggleRight, Edit2, X, Check, ExternalLink, Megaphone, Monitor, Smartphone, Image } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

interface AdForm {
  brandName: string;
  destinationUrl: string;
  bannerImage: string;
  mobileImage: string;
  logoImage: string;
  isFeatured: boolean;
}

const EMPTY_FORM: AdForm = {
  brandName: "",
  destinationUrl: "",
  bannerImage: "",
  mobileImage: "",
  logoImage: "",
  isFeatured: true,
};

// Tarjeta informativa de medidas
function SizeGuide() {
  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/40 p-4 mb-5">
      <p className="text-xs font-bold text-zinc-300 font-mono mb-3 uppercase tracking-wider flex items-center gap-2">
        <Image size={13} /> Guía de medidas exactas
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Monitor, label: "PC / Desktop", size: "1200 × 480 px", ratio: "2.5 : 1", note: "≥ 1024px de pantalla" },
          { icon: Monitor, label: "Tablet", size: "1024 × 410 px", ratio: "2.5 : 1", note: "768 – 1023px" },
          { icon: Smartphone, label: "Móvil", size: "800 × 320 px", ratio: "2.5 : 1", note: "< 768px de pantalla" },
        ].map(({ icon: Icon, label, size, ratio, note }) => (
          <div key={label} className="flex items-start gap-3 bg-zinc-800/50 rounded-lg p-3">
            <Icon size={16} className="text-zinc-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">{label}</p>
              <p className="text-sm font-bold text-red-400 font-mono mt-0.5">{size}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Proporción {ratio} · {note}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
        El banner se adapta automáticamente al ancho de pantalla. Usa la imagen de PC para desktop y tablet, y la imagen móvil para teléfonos.
        <strong className="text-zinc-400"> No se superpone ningún texto sobre la imagen</strong> — el diseño debe estar completamente incluido en la imagen.
      </p>
    </div>
  );
}

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
    if (file.size > 8 * 1024 * 1024) { toast.error("Máx 8MB"); return; }
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
    if (!form.bannerImage) { toast.error("La imagen de PC/desktop es requerida"); return; }
    createAd.mutate({
      brand: form.brandName,
      title: form.brandName, // título interno = nombre de marca
      tagline: undefined,
      ctaLabel: undefined,
      linkUrl: form.destinationUrl || undefined,
      accentColor: undefined,
      imageUrl: form.bannerImage,
      mobileImageUrl: form.mobileImage || undefined,
      logoImage: form.logoImage || undefined,
      adType: "featured",
      isFeatured: form.isFeatured,
    });
  };

  const handleSaveEdit = (id: number) => {
    updateAd.mutate({
      id,
      linkUrl: editForm.destinationUrl,
      imageUrl: editForm.bannerImage,
      mobileImageUrl: editForm.mobileImage || undefined,
      logoImage: editForm.logoImage || undefined,
      isFeatured: editForm.isFeatured,
    });
  };

  const startEdit = (ad: any) => {
    setEditingId(ad.id);
    setEditForm({
      brandName: ad.brandName ?? "",
      destinationUrl: ad.destinationUrl ?? "",
      bannerImage: ad.bannerImage ?? "",
      mobileImage: ad.mobileImage ?? "",
      logoImage: ad.logoImage ?? "",
      isFeatured: ad.isFeatured ?? true,
    });
  };

  // Componente reutilizable para zona de subida de imagen
  const ImageUploadZone = ({
    field,
    value,
    label,
    sublabel,
    aspectLabel,
    height = 160,
    isEdit = false,
  }: {
    field: "bannerImage" | "mobileImage" | "logoImage";
    value: string;
    label: string;
    sublabel: string;
    aspectLabel: string;
    height?: number;
    isEdit?: boolean;
  }) => {
    const setter = isEdit
      ? (url: string) => setEditForm(f => ({ ...f, [field]: url }))
      : (url: string) => setForm(f => ({ ...f, [field]: url }));

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-zinc-400 font-mono">{label}</label>
          <span className="text-xs font-bold text-red-400 font-mono bg-red-950/30 border border-red-900/40 px-2 py-0.5 rounded">{aspectLabel}</span>
        </div>
        <p className="text-xs text-zinc-600 mb-2">{sublabel}</p>
        <div
          className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-zinc-700 hover:border-red-500 transition-colors"
          style={{ height: `${height}px`, background: value ? `url(${value}) center/cover` : "#18181b" }}
        >
          {!value && (
            <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer">
              <Upload size={24} className="text-zinc-600" />
              <span className="text-xs text-zinc-500 font-mono">Clic para subir imagen</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(field, e.target.files[0], isEdit)} />
            </label>
          )}
          {value && (
            <div className="absolute bottom-2 right-2 flex gap-2">
              <label className="cursor-pointer bg-black/70 hover:bg-red-700/80 transition-colors rounded px-2 py-1 text-xs text-white flex items-center gap-1">
                <Upload size={10} /> Cambiar
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(field, e.target.files[0], isEdit)} />
              </label>
              <button onClick={() => setter("")} className="bg-black/70 hover:bg-red-700/80 transition-colors rounded px-2 py-1 text-xs text-white flex items-center gap-1">
                <X size={10} /> Quitar
              </button>
            </div>
          )}
          {uploading === field && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-xs text-white font-mono animate-pulse">Subiendo...</span>
            </div>
          )}
        </div>
      </div>
    );
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

          <SizeGuide />

          {/* Nombre de la marca y URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 font-mono mb-1 block">Nombre de la marca *</label>
              <input
                value={form.brandName}
                onChange={e => setForm(f => ({ ...f, brandName: e.target.value }))}
                placeholder="Ej: AMD Ryzen"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-mono mb-1 block">URL de destino (opcional)</label>
              <input
                value={form.destinationUrl}
                onChange={e => setForm(f => ({ ...f, destinationUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Imágenes — PC y Móvil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUploadZone
              field="bannerImage"
              value={form.bannerImage}
              label="Imagen PC / Desktop *"
              sublabel="También se usa en tablet"
              aspectLabel="1200 × 480 px"
              height={170}
            />
            <ImageUploadZone
              field="mobileImage"
              value={form.mobileImage}
              label="Imagen Móvil (opcional)"
              sublabel="Si no se sube, se usa la de PC"
              aspectLabel="800 × 320 px"
              height={170}
            />
          </div>

          {/* Logo */}
          <div>
            <label className="text-xs text-zinc-400 font-mono mb-2 block">Logo de la marca (aparece en la miniatura lateral)</label>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl overflow-hidden border-2 border-dashed border-zinc-700 hover:border-red-500 transition-colors flex-shrink-0 flex items-center justify-center"
                style={{ background: form.logoImage ? `url(${form.logoImage}) center/cover` : "#18181b" }}
              >
                {!form.logoImage && <span className="text-zinc-600 text-xs font-mono text-center leading-tight px-1">Sin logo</span>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-red-500 transition-colors rounded-lg px-3 py-2 text-xs text-white flex items-center gap-2">
                  <Upload size={13} /> Subir logo
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("logoImage", e.target.files[0])} />
                </label>
                {form.logoImage && (
                  <button onClick={() => setForm(f => ({ ...f, logoImage: "" }))} className="bg-zinc-800 hover:bg-red-900/40 border border-zinc-600 hover:border-red-500 transition-colors rounded-lg px-3 py-2 text-xs text-zinc-400 hover:text-red-400 flex items-center gap-2">
                    <X size={13} /> Quitar logo
                  </button>
                )}
                {uploading === "logoImage" && <span className="text-xs text-zinc-400 font-mono animate-pulse">Subiendo...</span>}
              </div>
            </div>
          </div>

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

                  <SizeGuide />

                  {/* URL en edición */}
                  <div>
                    <label className="text-xs text-zinc-500 font-mono mb-1 block">URL de destino</label>
                    <input
                      value={editForm.destinationUrl ?? ""}
                      onChange={e => setEditForm(f => ({ ...f, destinationUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Imágenes en edición */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ImageUploadZone
                      field="bannerImage"
                      value={editForm.bannerImage ?? ""}
                      label="Imagen PC / Desktop"
                      sublabel="También se usa en tablet"
                      aspectLabel="1200 × 480 px"
                      height={130}
                      isEdit
                    />
                    <ImageUploadZone
                      field="mobileImage"
                      value={editForm.mobileImage ?? ""}
                      label="Imagen Móvil"
                      sublabel="Si no se sube, se usa la de PC"
                      aspectLabel="800 × 320 px"
                      height={130}
                      isEdit
                    />
                  </div>

                  {/* Logo en edición */}
                  <div>
                    <label className="text-xs text-zinc-500 font-mono mb-2 block">Logo de la marca</label>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-700 flex-shrink-0 flex items-center justify-center"
                        style={{ background: editForm.logoImage ? `url(${editForm.logoImage}) center/cover` : "#18181b" }}
                      >
                        {!editForm.logoImage && <span className="text-zinc-600 text-xs">Sin logo</span>}
                      </div>
                      <div className="flex gap-2">
                        <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-red-500 transition-colors rounded px-2 py-1.5 text-xs text-white flex items-center gap-1">
                          <Upload size={11} /> {editForm.logoImage ? "Cambiar" : "Subir logo"}
                          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("logoImage", e.target.files[0], true)} />
                        </label>
                        {editForm.logoImage && (
                          <button onClick={() => setEditForm(f => ({ ...f, logoImage: "" }))} className="bg-zinc-800 hover:bg-red-900/40 border border-zinc-600 rounded px-2 py-1.5 text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1">
                            <X size={11} /> Quitar
                          </button>
                        )}
                        {uploading === "logoImage" && <span className="text-xs text-zinc-400 font-mono animate-pulse self-center">Subiendo...</span>}
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
                      {ad.mobileImage && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-950/30 text-blue-400 border border-blue-900/40 flex items-center gap-1">
                          <Smartphone size={10} /> Móvil
                        </span>
                      )}
                    </div>
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
