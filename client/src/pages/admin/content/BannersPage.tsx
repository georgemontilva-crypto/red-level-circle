import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Layout, Upload, X } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

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

export function BannersPage() {
  const { data: allBanners, refetch } = trpc.banners.listAll.useQuery();
  const uploadBannerImage = trpc.banners.uploadImage.useMutation({ onError: e => toast.error(e.message) });
  const upsertBanner = trpc.banners.upsert.useMutation({
    onSuccess: () => { toast.success("Banner guardado"); refetch(); },
    onError: e => toast.error(e.message),
  });

  const [textFields, setTextFields] = useState<Record<string, { title: string; subtitle: string; linkUrl: string }>>({});
  const getFields = (key: string) => textFields[key] ?? { title: "", subtitle: "", linkUrl: "" };
  const setField = (key: string, field: "title" | "subtitle" | "linkUrl", value: string) =>
    setTextFields(f => ({ ...f, [key]: { ...getFields(key), [field]: value } }));

  const getBanner = (key: string) => allBanners?.find(b => b.sectionKey === key);

  useEffect(() => {
    if (!allBanners) return;
    const init: Record<string, { title: string; subtitle: string; linkUrl: string }> = {};
    allBanners.forEach(b => {
      init[b.sectionKey] = { title: b.title ?? "", subtitle: b.subtitle ?? "", linkUrl: b.linkUrl ?? "" };
    });
    setTextFields(init);
  }, [allBanners?.length]);

  const handleSaveText = (sectionKey: string) => {
    const existing = getBanner(sectionKey);
    const fields = getFields(sectionKey);
    upsertBanner.mutate({
      sectionKey,
      imageUrl: existing?.imageUrl ?? null,
      mobileImageUrl: existing?.mobileImageUrl ?? null,
      title: fields.title || null,
      subtitle: fields.subtitle || null,
      linkUrl: fields.linkUrl || null,
      isActive: existing?.isActive ?? true,
    });
  };

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
    <div className="space-y-6 max-w-5xl">
      <PageHeader icon={Layout} title="BANNERS" subtitle="Personaliza las imágenes de cabecera de cada sección" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTION_DEFS.map(({ key, label, description }) => {
          const banner = getBanner(key);
          const isActive = banner?.isActive ?? true;
          return (
            <div key={key} className={`bg-zinc-900/60 border rounded-xl overflow-hidden transition-colors ${isActive ? "border-red-900/40" : "border-white/5 opacity-60"}`}>
              {/* Desktop banner preview */}
              <div className="relative w-full" style={{ aspectRatio: "16/5", background: "#111" }}>
                {banner?.imageUrl ? (
                  <>
                    <img src={banner.imageUrl} alt={label} className="w-full h-full object-cover" />
                    <button onClick={() => handleRemove(key)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-700 transition-colors">
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-colors">
                    <Upload size={24} className="text-zinc-600" />
                    <span className="text-xs text-zinc-500 font-rajdhani">Subir banner desktop (16:5)</span>
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
                    <p className="text-zinc-500 text-xs font-rajdhani">{description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(key)}
                    className={`text-xs font-orbitron px-2 py-1 rounded border transition-colors ${isActive ? "border-green-700/50 text-green-400 bg-green-900/20 hover:bg-green-900/40" : "border-white/10 text-zinc-500 bg-zinc-800/40 hover:bg-zinc-800"}`}
                  >
                    {isActive ? "● ACTIVO" : "○ INACTIVO"}
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 font-rajdhani">TEXTO SUPERPUESTO (opcional)</p>
                  <input type="text" value={getFields(key).title} onChange={e => setField(key, "title", e.target.value)} placeholder="Título del banner"
                    className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:border-red-500 outline-none" />
                  <input type="text" value={getFields(key).subtitle} onChange={e => setField(key, "subtitle", e.target.value)} placeholder="Subtítulo o descripción"
                    className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:border-red-500 outline-none" />
                  <input type="url" value={getFields(key).linkUrl} onChange={e => setField(key, "linkUrl", e.target.value)} placeholder="URL de destino (opcional)"
                    className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:border-red-500 outline-none" />
                  <button onClick={() => handleSaveText(key)} disabled={upsertBanner.isPending}
                    className="w-full py-1.5 rounded-lg text-xs font-orbitron font-bold transition-colors bg-red-700/40 hover:bg-red-700/70 text-red-300 border border-red-700/40 disabled:opacity-50">
                    GUARDAR TEXTO
                  </button>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-rajdhani mb-1">BANNER MÓVIL (opcional)</p>
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
                      <div className="bg-zinc-800 hover:bg-zinc-700 border border-dashed border-white/10 hover:border-red-500 rounded px-3 py-2 text-zinc-500 text-xs font-rajdhani flex items-center justify-center gap-1.5 transition-colors">
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
