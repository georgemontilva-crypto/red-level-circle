import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Newspaper, Clock, Eye, ChevronRight } from "lucide-react";
import { Link, useParams } from "wouter";
import { SectionBanner } from "@/components/SectionBanner";

const CATEGORIES = [
  { value: "", label: "TODAS" },
  { value: "torneos", label: "TORNEOS" },
  { value: "equipos", label: "EQUIPOS" },
  { value: "juegos", label: "JUEGOS" },
  { value: "plataforma", label: "PLATAFORMA" },
  { value: "general", label: "GENERAL" },
];

// ─── Shared card component ────────────────────────────────────────────────────
type NewsItem = {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category: string;
  isFeatured?: boolean | null;
  publishedAt?: string | Date | null;
  viewCount?: number | null;
};

function NewsCard({ article, full = false }: { article: NewsItem; full?: boolean }) {
  return (
    <Link href={`/news/${article.slug}`}>
      <div
        className={`group relative bg-card/80 border border-border hover:border-red-500/40 rounded-xl overflow-hidden transition-all cursor-pointer hover:shadow-[0_0_16px_rgba(220,38,38,0.08)] ${
          full ? "flex md:flex-row flex-col" : "flex flex-col"
        }`}
      >
        {/* Image */}
        {article.coverImage ? (
          <div className={`overflow-hidden flex-shrink-0 ${full ? "md:w-2/5 h-52 md:h-60" : "h-44"}`}>
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div
            className={`bg-zinc-900 flex items-center justify-center flex-shrink-0 ${
              full ? "md:w-2/5 h-52 md:h-60" : "h-44"
            }`}
          >
            <Newspaper className="w-10 h-10 text-zinc-700" />
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
                {article.category.toUpperCase()}
              </span>
              {article.isFeatured && (
                <span className="text-xs font-mono bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded">
                  DESTACADO
                </span>
              )}
            </div>
            <h3
              className={`font-orbitron font-bold text-white group-hover:text-red-400 transition-colors line-clamp-2 ${
                full ? "text-xl mb-2" : "text-sm mb-1"
              }`}
            >
              {article.title}
            </h3>
            {full && article.excerpt && (
              <p className="text-muted-foreground font-rajdhani text-sm line-clamp-2 mb-3">
                {article.excerpt}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString("es-ES")
                : ""}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.viewCount ?? 0}
            </span>
            <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-red-400 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Dynamic layout: pair | full | pair | full ... ───────────────────────────
function NewsGrid({ items }: { items: NewsItem[] }) {
  const rows: React.ReactNode[] = [];
  let i = 0;

  while (i < items.length) {
    // Positions within repeating group of 3: [0,1] = pair, [2] = full
    const groupPos = Math.floor(i / 1) % 3; // recalculate below

    // Simpler: track position in group manually
    const posInGroup = i % 3;

    if (posInGroup === 2) {
      // Full width
      rows.push(
        <div key={`full-${i}`}>
          <NewsCard article={items[i]} full />
        </div>
      );
      i++;
    } else {
      // Pair (positions 0 and 1 in group)
      const pair = items.slice(i, i + 2);
      rows.push(
        <div key={`pair-${i}`} className="grid md:grid-cols-2 gap-4">
          {pair.map((a) => (
            <NewsCard key={a.id} article={a} full={false} />
          ))}
        </div>
      );
      i += pair.length;
    }
  }

  return <div className="flex flex-col gap-4">{rows}</div>;
}

// ─── News List ────────────────────────────────────────────────────────────────
export function NewsList() {
  const { data: news, isLoading } = trpc.news.list.useQuery({ limit: 50 });

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="pt-6 pb-16">
        <SectionBanner sectionKey="news" height="h-48 sm:h-64 lg:h-72">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-widest text-red-400">
              Red Level Circle
            </span>
            <h1 className="font-orbitron font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight drop-shadow-lg">
              NOTICIAS
            </h1>
          </div>
        </SectionBanner>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-card/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : news && news.length > 0 ? (
          <div className="mt-6">
            <NewsGrid items={news} />
          </div>
        ) : (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <h3 className="font-orbitron font-bold text-xl text-muted-foreground mb-2">
              SIN NOTICIAS
            </h3>
            <p className="text-muted-foreground font-rajdhani">
              No hay noticias publicadas aún.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── News Article ─────────────────────────────────────────────────────────────
export function NewsArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = trpc.news.bySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white">
        <div className="pt-6">
          <div className="h-64 bg-card/50 rounded-xl animate-pulse mb-6" />
          <div className="h-8 bg-card/50 rounded animate-pulse mb-4 w-3/4" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-card/50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-orbitron text-2xl text-muted-foreground mb-4">
            ARTÍCULO NO ENCONTRADO
          </h2>
          <Link href="/news">
            <Button className="bg-red-600 hover:bg-red-700 font-orbitron text-xs">
              VOLVER A NOTICIAS
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="pt-6 pb-16">
        {article.coverImage && (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-64 object-cover rounded-xl mb-6"
          />
        )}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
            {article.category.toUpperCase()}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : ""}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            {article.viewCount} vistas
          </span>
        </div>
        <h1 className="font-orbitron font-black text-3xl text-white mb-4">{article.title}</h1>
        {article.excerpt && (
          <p className="text-muted-foreground font-rajdhani text-lg mb-6 border-l-2 border-red-500 pl-4">
            {article.excerpt}
          </p>
        )}
        <div
          className="prose prose-invert prose-sm max-w-none font-rajdhani text-secondary-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        <div className="mt-8 pt-6 border-t border-border">
          <Link href="/news">
            <Button
              variant="outline"
              className="border-border text-muted-foreground hover:border-red-500 font-orbitron text-xs"
            >
              ← VOLVER A NOTICIAS
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NewsList;
