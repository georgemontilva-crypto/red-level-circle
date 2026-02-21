import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Newspaper, Clock, Eye, ChevronRight, Tag } from "lucide-react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { SectionBanner } from "@/components/SectionBanner";

const CATEGORIES = [
  { value: "", label: "TODAS" },
  { value: "torneos", label: "TORNEOS" },
  { value: "equipos", label: "EQUIPOS" },
  { value: "juegos", label: "JUEGOS" },
  { value: "plataforma", label: "PLATAFORMA" },
  { value: "general", label: "GENERAL" },
];


// ─── News List ────────────────────────────────────────────────────────────────
export function NewsList() {
  const { data: news, isLoading } = trpc.news.list.useQuery({ limit: 50 });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-6 pb-16 max-w-5xl mx-auto px-4">
        <SectionBanner sectionKey="news" height="h-36 sm:h-48" />


        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-zinc-900/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : news && news.length > 0 ? (
          <>
            {/* Featured */}
            {news[0] && (
              <Link href={`/news/${news[0].slug}`}>
                <div className="group relative bg-zinc-900/80 border border-zinc-800 hover:border-red-500/50 rounded-xl overflow-hidden mb-6 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.1)]">
                  <div className="md:flex">
                    {news[0].coverImage && (
                      <div className="md:w-2/5 h-48 md:h-auto overflow-hidden">
                        <img src={news[0].coverImage} alt={news[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
                          {news[0].category.toUpperCase()}
                        </span>
                        {news[0].isFeatured && (
                          <span className="text-xs font-mono bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded">DESTACADO</span>
                        )}
                      </div>
                      <h2 className="font-orbitron font-bold text-xl text-white group-hover:text-red-400 transition-colors mb-3">{news[0].title}</h2>
                      {news[0].excerpt && <p className="text-zinc-400 font-rajdhani text-sm line-clamp-3 mb-4">{news[0].excerpt}</p>}
                      <div className="flex items-center gap-4 text-xs text-zinc-600">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{news[0].publishedAt ? new Date(news[0].publishedAt).toLocaleDateString("es-ES") : ""}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{news[0].viewCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {news.slice(1).map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`}>
                  <div className="group flex gap-3 bg-zinc-900/80 border border-zinc-800 hover:border-red-500/30 rounded-xl p-4 transition-all cursor-pointer">
                    {article.coverImage && (
                      <img src={article.coverImage} alt={article.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-mono text-zinc-500">{article.category.toUpperCase()}</span>
                      <h3 className="font-rajdhani font-bold text-sm text-white group-hover:text-red-400 transition-colors line-clamp-2 mt-1">{article.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("es-ES") : ""}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.viewCount}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition-colors flex-shrink-0 self-center" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <h3 className="font-orbitron font-bold text-xl text-zinc-600 mb-2">SIN NOTICIAS</h3>
            <p className="text-zinc-600 font-rajdhani">No hay noticias publicadas aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── News Article ─────────────────────────────────────────────────────────────
export function NewsArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = trpc.news.bySlug.useQuery({ slug: slug ?? "" }, { enabled: !!slug });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="pt-6 max-w-3xl mx-auto px-4">
          <div className="h-64 bg-zinc-900/50 rounded-xl animate-pulse mb-6" />
          <div className="h-8 bg-zinc-900/50 rounded animate-pulse mb-4 w-3/4" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-4 bg-zinc-900/50 rounded animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-orbitron text-2xl text-zinc-600 mb-4">ARTÍCULO NO ENCONTRADO</h2>
          <Link href="/news"><Button className="bg-red-600 hover:bg-red-700 font-orbitron text-xs">VOLVER A NOTICIAS</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-6 pb-16 max-w-3xl mx-auto px-4">
        {article.coverImage && (
          <img src={article.coverImage} alt={article.title} className="w-full h-64 object-cover rounded-xl mb-6" />
        )}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">{article.category.toUpperCase()}</span>
          <span className="flex items-center gap-1 text-xs text-zinc-600"><Clock className="w-3 h-3" />{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
          <span className="flex items-center gap-1 text-xs text-zinc-600"><Eye className="w-3 h-3" />{article.viewCount} vistas</span>
        </div>
        <h1 className="font-orbitron font-black text-3xl text-white mb-4">{article.title}</h1>
        {article.excerpt && <p className="text-zinc-400 font-rajdhani text-lg mb-6 border-l-2 border-red-500 pl-4">{article.excerpt}</p>}
        <div className="prose prose-invert prose-sm max-w-none font-rajdhani text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {article.content}
        </div>
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <Link href="/news">
            <Button variant="outline" className="border-zinc-700 text-zinc-400 hover:border-red-500 font-orbitron text-xs">
              ← VOLVER A NOTICIAS
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NewsList;
