import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Radio, Eye, ExternalLink, Tv, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StreamCard } from "@/components/StreamCard";

const PLATFORM_BADGE: Record<string, { label: string; cls: string }> = {
  twitch:  { label: "TWITCH",  cls: "bg-purple-600/20 text-purple-300 border-purple-500/40" },
  youtube: { label: "YOUTUBE", cls: "bg-red-700/20 text-red-300 border-red-500/40" },
  discord: { label: "DISCORD", cls: "bg-indigo-600/20 text-indigo-300 border-indigo-500/40" },
  other:   { label: "STREAM",  cls: "bg-muted/20 text-secondary-foreground border-zinc-500/40" },
};

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export default function StreamDetail() {
  const { id } = useParams<{ id: string }>();
  const streamId = parseInt(id ?? "0", 10);

  // Fetch all live streams to find the current one and related
  const { data: allStreams, isLoading } = trpc.streams.list.useQuery({ liveOnly: false });

  const stream = allStreams?.find((s) => s.id === streamId);
  const related = allStreams
    ?.filter((s) => s.id !== streamId && s.game === stream?.game && s.isLive)
    .slice(0, 5) ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-card text-white flex flex-col items-center justify-center gap-4">
        <Radio className="w-12 h-12 text-zinc-700" />
        <h2 className="font-orbitron font-black text-2xl text-muted-foreground">STREAM NO ENCONTRADO</h2>
        <Link href="/streams">
          <Button variant="outline" className="border-border text-muted-foreground hover:border-red-500 font-mono text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> VOLVER A EN VIVO
          </Button>
        </Link>
      </div>
    );
  }

  const badge = PLATFORM_BADGE[stream.platform] ?? PLATFORM_BADGE.other;

  return (
    <div className="min-h-screen bg-card text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-20">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-6">
          <Link href="/streams">
            <span className="hover:text-red-400 cursor-pointer transition-colors flex items-center gap-1">
              <Radio className="w-3 h-3" /> EN VIVO
            </span>
          </Link>
          <ChevronRight className="w-3 h-3" />
          {stream.game && (
            <>
              <span className="text-muted-foreground">{stream.game}</span>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-white truncate max-w-[200px]">{stream.title}</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

          {/* ── Main content ── */}
          <div>
            {/* Stream player / preview */}
            <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
              {stream.embedUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={stream.embedUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    title={stream.title}
                  />
                </div>
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center bg-card gap-4">
                  <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center">
                    <Tv className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-rajdhani text-sm">Vista previa no disponible</p>
                  <a href={stream.url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-red-600 hover:bg-red-700 font-orbitron text-xs">
                      <ExternalLink className="w-3 h-3 mr-2" />
                      VER EN {stream.platform.toUpperCase()}
                    </Button>
                  </a>
                </div>
              )}
            </div>

            {/* Stream info bar */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {stream.isLive && (
                    <span className="flex items-center gap-1.5 text-[10px] font-mono bg-red-600 text-white px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      EN VIVO
                    </span>
                  )}
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.cls}`}>
                    {badge.label}
                  </span>
                  {stream.game && (
                    <span className="text-[10px] font-mono text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded">
                      {stream.game}
                    </span>
                  )}
                </div>
                <h1 className="font-rajdhani font-bold text-xl text-white leading-tight">
                  {stream.title}
                </h1>
                {stream.streamerName && (
                  <p className="text-muted-foreground text-sm font-mono mt-1">{stream.streamerName}</p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {stream.viewerCount != null && stream.viewerCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm font-mono text-secondary-foreground">
                    <Eye className="w-4 h-4 text-red-400" />
                    <span>{formatViewers(stream.viewerCount)}</span>
                  </div>
                )}
                <a href={stream.url} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 font-orbitron text-xs gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    ABRIR
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* ── Sidebar: related streams ── */}
          {related.length > 0 && (
            <aside>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-orbitron font-bold text-sm text-white tracking-wide">
                  MÁS DE {stream.game?.toUpperCase() ?? "ESTE JUEGO"}
                </h3>
                <span className="text-xs font-mono text-muted-foreground">{related.length} en vivo</span>
              </div>
              <div className="space-y-3">
                {related.map((s) => (
                  <StreamCard key={s.id} stream={s as any} />
                ))}
              </div>
            </aside>
          )}
        </div>

        {/* ── Back link ── */}
        <div className="mt-10">
          <Link href="/streams">
            <button className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-red-400 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a todas las transmisiones
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
