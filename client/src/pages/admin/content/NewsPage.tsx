import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Newspaper, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "../components/AdminUI";
import { ImageUploader } from "../components/ImageUploader";

export function NewsPage() {
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
    <div className="space-y-6 max-w-4xl">
      <PageHeader icon={Newspaper} title="NOTICIAS" subtitle="Crea y gestiona artículos del portal" />
      <Button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        NUEVA NOTICIA
      </Button>
      {showForm && (
        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Título</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: autoSlug(e.target.value) }))}
                placeholder="Título de la noticia"
                className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Slug (URL)</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="titulo-de-la-noticia"
                className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Categoría</label>
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
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Resumen</label>
              <input value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Resumen corto..."
                className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1 font-rajdhani uppercase">Contenido</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} placeholder="Contenido completo de la noticia..."
                className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none" />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} className="accent-red-500" />
                <span className="text-xs text-zinc-400 font-rajdhani">PUBLICAR AHORA</span>
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
            <Button onClick={() => setShowForm(false)} variant="outline" className="border-white/10 text-zinc-400 font-orbitron text-xs">
              CANCELAR
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {newsList?.map(n => (
          <div key={n.id} className="bg-zinc-900/60 border border-white/8 rounded-xl p-4 flex items-center gap-4 flex-wrap">
            {n.coverImage && <img src={n.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-white font-rajdhani font-semibold truncate">{n.title}</p>
              <p className="text-zinc-500 text-xs">{n.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${n.publishedAt ? "text-green-400" : "text-yellow-400"}`}>
                {n.publishedAt ? "● Publicado" : "○ Borrador"}
              </span>
              <Button
                size="sm"
                onClick={() => updateNews.mutate({ id: n.id, published: !n.publishedAt })}
                className="h-7 text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-orbitron"
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
        {(newsList?.length ?? 0) === 0 && (
          <div className="text-center py-12 text-zinc-600">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-orbitron text-sm">No hay noticias aún</p>
          </div>
        )}
      </div>
    </div>
  );
}
