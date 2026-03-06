import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Newspaper, Plus, Trash2, Edit3, Eye, EyeOff, ExternalLink, Image as ImageIcon, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "../components/AdminUI";
import { ImageUploader } from "../components/ImageUploader";

const EMPTY_FORM = {
  title: "", slug: "", content: "", excerpt: "",
  coverImage: "", category: "general" as const,
  isPublished: false, isFeatured: false,
  referenceUrl: "", gallery: [] as string[],
};

export function NewsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const utils = trpc.useUtils();
  const { data: newsList } = trpc.news.adminList.useQuery();

  const createNews = trpc.news.create.useMutation({
    onSuccess: () => { toast.success("Noticia creada"); setShowForm(false); setForm({ ...EMPTY_FORM }); utils.news.adminList.invalidate(); },
    onError: e => toast.error(e.message),
  });
  const updateNews = trpc.news.update.useMutation({
    onSuccess: () => { toast.success("Noticia actualizada"); setEditingId(null); setShowForm(false); setForm({ ...EMPTY_FORM }); utils.news.adminList.invalidate(); },
    onError: e => toast.error(e.message),
  });
  const deleteNews = trpc.news.delete.useMutation({
    onSuccess: () => { toast.success("Noticia eliminada"); setDeleteConfirm(null); utils.news.adminList.invalidate(); },
    onError: e => toast.error(e.message),
  });
  const uploadImage = trpc.admin.uploadImage.useMutation();

  const autoSlug = (title: string) =>
    title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 100);

  const startEdit = (n: any) => {
    setEditingId(n.id);
    setForm({
      title: n.title, slug: n.slug ?? "", content: n.content ?? "",
      excerpt: n.excerpt ?? "", coverImage: n.coverImage ?? "",
      category: n.category ?? "general",
      isPublished: !!n.isPublished, isFeatured: !!n.isFeatured,
      referenceUrl: n.referenceUrl ?? "",
      gallery: Array.isArray(n.gallery) ? n.gallery : [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    const payload = {
      title: form.title,
      slug: form.slug,
      content: form.content,
      excerpt: form.excerpt || undefined,
      coverImage: form.coverImage || undefined,
      category: form.category,
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
      referenceUrl: form.referenceUrl || undefined,
      gallery: form.gallery.length > 0 ? form.gallery : undefined,
    };
    if (editingId !== null) {
      updateNews.mutate({ id: editingId, ...payload });
    } else {
      createNews.mutate(payload);
    }
  };

  const togglePublish = (n: any) => {
    updateNews.mutate({ id: n.id, isPublished: !n.isPublished });
  };

  const handleDelete = (id: number) => {
    if (deleteConfirm === id) {
      deleteNews.mutate({ id });
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(c => c === id ? null : c), 3000);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 4 - form.gallery.length;
    if (remaining <= 0) { toast.error("Máximo 4 imágenes en la galería"); return; }
    const toUpload = files.slice(0, remaining);
    setUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve((ev.target?.result as string).split(",")[1]);
          reader.readAsDataURL(file);
        });
        const result = await uploadImage.mutateAsync({ base64, mimeType: file.type as any, folder: "news-gallery" });
        urls.push(result.url);
      }
      setForm(f => ({ ...f, gallery: [...f.gallery, ...urls].slice(0, 4) }));
    } catch {
      toast.error("Error al subir imágenes de galería");
    } finally {
      setUploadingGallery(false);
    }
  };

  const inputCls = "w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition-colors";

  return (
    <div className="space-y-6 w-full">
      <PageHeader icon={Newspaper} title="NOTICIAS" subtitle="Crea y gestiona artículos del portal de Red Level Circle" />

      <Button
        onClick={() => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowForm(!showForm); }}
        className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        NUEVA NOTICIA
      </Button>

      {showForm && (
        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-5 space-y-4">
          <p className="font-orbitron text-sm text-white">{editingId !== null ? "EDITAR NOTICIA" : "NUEVA NOTICIA"}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Título *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: editingId ? f.slug : autoSlug(e.target.value) }))}
                placeholder="Título de la noticia"
                className={inputCls}
              />
            </div>
            {!editingId && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Slug (URL)</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="titulo-de-la-noticia"
                  className={inputCls}
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Categoría</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                <SelectTrigger className="bg-zinc-800/60 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
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
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Resumen (extracto)</label>
              <input
                value={form.excerpt}
                onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                placeholder="Breve descripción que aparece en la lista de noticias..."
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Contenido *</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={8}
                placeholder="Contenido completo de la noticia..."
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Reference URL */}
            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Enlace de referencia (opcional)
              </label>
              <input
                value={form.referenceUrl}
                onChange={e => setForm(f => ({ ...f, referenceUrl: e.target.value }))}
                type="url"
                placeholder="https://ejemplo.com/lanzamiento-del-juego"
                className={inputCls}
              />
              <p className="text-xs text-zinc-600 mt-1">Ideal para noticias de lanzamientos: enlaza al sitio oficial, trailer, tienda, etc.</p>
            </div>

            {/* Gallery */}
            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-2 font-rajdhani uppercase flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Galería de imágenes (máx. 4)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {form.gallery.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt={`gallery-${idx}`} className="w-full h-20 object-cover rounded-lg border border-white/10" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, gallery: f.gallery.filter((_, i) => i !== idx) }))}
                      className="absolute top-1 right-1 bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {form.gallery.length < 4 && (
                  <label className={`cursor-pointer border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg h-20 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors ${uploadingGallery ? "opacity-50 pointer-events-none" : ""}`}>
                    <Upload className="w-4 h-4" />
                    <span className="text-xs">{uploadingGallery ? "Subiendo..." : "Agregar"}</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} disabled={uploadingGallery} />
                  </label>
                )}
              </div>
              <p className="text-xs text-zinc-600">{form.gallery.length}/4 imágenes en la galería</p>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="accent-red-500 w-4 h-4" />
                <span className="text-xs text-zinc-400 font-rajdhani">PUBLICAR AHORA</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="accent-yellow-500 w-4 h-4" />
                <span className="text-xs text-zinc-400 font-rajdhani">DESTACADA</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!form.title || !form.content || createNews.isPending || updateNews.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs"
            >
              {createNews.isPending || updateNews.isPending ? "Guardando..." : editingId !== null ? "ACTUALIZAR" : "CREAR NOTICIA"}
            </Button>
            <Button
              onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); }}
              variant="outline"
              className="border-white/10 text-zinc-400 font-orbitron text-xs"
            >
              CANCELAR
            </Button>
          </div>
        </div>
      )}

      {/* News list */}
      <div className="space-y-3">
        {newsList?.map((n: any) => (
          <div key={n.id} className="bg-zinc-900/60 border border-white/8 rounded-xl p-4 flex items-center gap-4 flex-wrap">
            {n.coverImage
              ? <img src={n.coverImage} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              : <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0"><Newspaper className="w-6 h-6 text-zinc-600" /></div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-rajdhani font-semibold truncate">{n.title}</p>
                {n.isFeatured && <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-orbitron">DESTACADA</span>}
                {n.referenceUrl && (
                  <a href={n.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors" title="Ver enlace de referencia">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {Array.isArray(n.gallery) && n.gallery.length > 0 && (
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />{n.gallery.length}
                  </span>
                )}
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">
                {n.category} · {n.publishedAt ? `Publicado ${new Date(n.publishedAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}` : "Borrador"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono ${n.isPublished ? "text-green-400" : "text-yellow-400"}`}>
                {n.isPublished ? "● Publicado" : "○ Borrador"}
              </span>
              <Button
                size="sm"
                onClick={() => togglePublish(n)}
                disabled={updateNews.isPending}
                className="h-7 text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-orbitron"
              >
                {n.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span className="ml-1">{n.isPublished ? "OCULTAR" : "PUBLICAR"}</span>
              </Button>
              <Button
                size="sm"
                onClick={() => startEdit(n)}
                className="h-7 text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-orbitron"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleDelete(n.id)}
                disabled={deleteNews.isPending}
                className={`h-7 text-xs font-orbitron transition-colors ${deleteConfirm === n.id ? "bg-red-600 hover:bg-red-700 text-white" : "bg-zinc-800 hover:bg-red-900/40 text-zinc-400 hover:text-red-400"}`}
                title={deleteConfirm === n.id ? "Confirmar eliminación" : "Eliminar"}
              >
                <Trash2 className="w-3 h-3" />
                {deleteConfirm === n.id && <span className="ml-1">¿CONFIRMAR?</span>}
              </Button>
            </div>
          </div>
        ))}
        {(newsList?.length ?? 0) === 0 && (
          <div className="text-center py-12 text-zinc-600">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-orbitron text-sm">No hay noticias aún</p>
            <p className="text-xs mt-1">Haz clic en "Nueva Noticia" para crear la primera</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsPage;
