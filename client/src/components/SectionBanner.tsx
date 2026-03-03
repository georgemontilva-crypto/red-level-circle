import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ReactNode, useRef, useState } from "react";
import { Pencil, X, Upload, Loader2, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface SectionBannerProps {
  sectionKey: string;
  /** Altura del banner en clases Tailwind, ej: "h-40" o "h-56" */
  height?: string;
  /** Clase extra para el contenedor */
  className?: string;
  /** Contenido superpuesto sobre la imagen (título, descripción, etc.) */
  children?: ReactNode;
}

/**
 * Muestra el banner configurado por el admin para una sección específica.
 * Si no hay banner activo, muestra un fondo degradado oscuro.
 * Los children se renderizan superpuestos sobre la imagen.
 * Los admins ven un botón de edición inline en la esquina superior derecha.
 * Mientras se edita, el título y subtítulo se previsualiza en tiempo real sobre el banner.
 */
export function SectionBanner({
  sectionKey,
  height = "h-48 sm:h-64 lg:h-72",
  className = "",
  children,
}: SectionBannerProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const { data: banner } = trpc.banners.getSection.useQuery({ sectionKey });
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.banners.uploadImage.useMutation();
  const upsertMutation = trpc.banners.upsert.useMutation({
    onSuccess: () => {
      toast.success("Banner actualizado");
      utils.banners.getSection.invalidate({ sectionKey });
      setEditing(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const openEditor = () => {
    setTitle(banner?.title ?? "");
    setSubtitle(banner?.subtitle ?? "");
    setLinkUrl(banner?.linkUrl ?? "");
    setIsActive(banner?.isActive ?? true);
    setPreviewUrl(banner?.imageUrl ?? null);
    setEditing(true);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Solo imágenes"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Máximo 10MB"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const mimeType = file.type as any;
        const { url } = await uploadMutation.mutateAsync({ sectionKey, base64, mimeType });
        setPreviewUrl(url);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch { toast.error("Error al subir imagen"); setUploading(false); }
  };

  const handleSave = () => {
    upsertMutation.mutate({
      sectionKey,
      imageUrl: previewUrl ?? undefined,
      title: title || undefined,
      subtitle: subtitle || undefined,
      linkUrl: linkUrl || undefined,
      isActive,
    });
  };

  // When editing: show live preview values; otherwise show saved banner values
  const displayImageUrl = editing ? (previewUrl ?? (banner?.isActive ? banner?.imageUrl : null)) : (banner?.isActive ? banner?.imageUrl : null);
  const displayTitle = editing ? title : (banner?.title ?? "");
  const displaySubtitle = editing ? subtitle : (banner?.subtitle ?? "");

  return (
    <>
      <div className={`relative w-full overflow-hidden rounded-xl mb-6 ${height} ${className}`}>
        {/* Background */}
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={displayTitle || sectionKey}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            {/* Fondo base oscuro con degradado rojo en esquina izquierda */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-950/70 via-zinc-950 to-black" />
            {/* Patrón diagonal rojo sutil */}
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #dc2626 0, #dc2626 1px, transparent 0, transparent 50%)",
                backgroundSize: "20px 20px",
              }}
            />
          </>
        )}

        {/* Gradient overlay for text readability */}
        {(children || displayTitle || displaySubtitle) && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Optional link covering entire banner */}
        {banner?.linkUrl && !children && !editing && (
          <a
            href={banner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0"
            aria-label={displayTitle || "Ver más"}
          />
        )}

        {/* Children (custom overlay content per page) */}
        {children && (
          <div className="absolute inset-0 flex items-center px-6 sm:px-10">
            {children}
          </div>
        )}

        {/* Title/subtitle — live preview when editing, saved data otherwise */}
        {!children && (displayTitle || displaySubtitle) && (
          <div className="absolute bottom-0 left-0 p-4 sm:p-6">
            {displayTitle && (
              <h2 className="font-orbitron font-black text-xl sm:text-3xl text-white tracking-wider drop-shadow-lg transition-all duration-150">
                {displayTitle}
              </h2>
            )}
            {displaySubtitle && (
              <p className="text-secondary-foreground text-sm font-rajdhani mt-1 drop-shadow transition-all duration-150">{displaySubtitle}</p>
            )}
          </div>
        )}

        {/* Editing indicator border */}
        {editing && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ border: "2px solid oklch(0.55 0.22 25 / 0.6)", boxShadow: "inset 0 0 20px oklch(0.55 0.22 25 / 0.1)" }}
          />
        )}

        {/* Admin edit button — inline, top-right corner */}
        {isAdmin && (
          <button
            onClick={openEditor}
            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 backdrop-blur-sm"
            style={{
              background: editing ? "oklch(0.55 0.22 25 / 0.8)" : "rgba(0,0,0,0.55)",
              border: `1px solid ${editing ? "oklch(0.65 0.22 25)" : "rgba(255,255,255,0.15)"}`,
              color: "rgba(255,255,255,0.95)",
            }}
            title="Editar banner"
          >
            <Pencil size={12} />
            <span className="hidden sm:inline">{editing ? "Editando..." : "Editar banner"}</span>
          </button>
        )}
      </div>

      {/* ── Inline Editor Panel ── */}
      {editing && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(false); }}
        >
          <div
            className="w-full sm:w-[480px] rounded-t-2xl sm:rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300"
            style={{ background: "var(--bg-card)", border: "1px solid oklch(0.22 0.01 0)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono font-black text-white text-sm tracking-widest">EDITAR BANNER</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">Sección: {sectionKey} · Los cambios se previsualiza en vivo</p>
              </div>
              <button onClick={() => setEditing(false)} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Image upload */}
            <div
              className="relative rounded-xl overflow-hidden cursor-pointer group"
              style={{ height: "120px", border: "1px dashed oklch(0.30 0.01 0)", background: "var(--bg-main)" }}
              onClick={() => fileRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <Upload size={20} style={{ color: "oklch(0.40 0.005 0)" }} />
                  <span className="text-xs font-mono" style={{ color: "oklch(0.40 0.005 0)" }}>SUBIR IMAGEN</span>
                  <span className="text-xs" style={{ color: "oklch(0.30 0.005 0)" }}>JPG, PNG, WebP · máx 10MB</span>
                </div>
              )}
              <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {uploading ? (
                  <Loader2 size={20} className="text-white animate-spin" />
                ) : (
                  <><Upload size={16} className="text-white" /><span className="text-xs text-white font-mono">CAMBIAR IMAGEN</span></>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">TÍTULO (opcional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título del banner"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white"
                  style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)", outline: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "oklch(0.55 0.22 25)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "oklch(0.22 0.01 0)"; }}
                />
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">SUBTÍTULO (opcional)</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Descripción corta"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white"
                  style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)", outline: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "oklch(0.55 0.22 25)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "oklch(0.22 0.01 0)"; }}
                />
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">LINK (opcional)</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white"
                  style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)", outline: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "oklch(0.55 0.22 25)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "oklch(0.22 0.01 0)"; }}
                />
              </div>
            </div>

            {/* Active toggle + Save */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setIsActive(!isActive)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all"
                style={{
                  background: isActive ? "oklch(0.55 0.22 25 / 0.15)" : "oklch(0.15 0.005 0)",
                  border: `1px solid ${isActive ? "oklch(0.55 0.22 25 / 0.4)" : "oklch(0.22 0.01 0)"}`,
                  color: isActive ? "oklch(0.65 0.22 25)" : "oklch(0.45 0.005 0)",
                }}
              >
                {isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                {isActive ? "Activo" : "Inactivo"}
              </button>

              <button
                onClick={handleSave}
                disabled={upsertMutation.isPending || uploading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-mono font-bold transition-all disabled:opacity-50"
                style={{ background: "oklch(0.55 0.22 25)", color: "white" }}
              >
                {upsertMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                GUARDAR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
