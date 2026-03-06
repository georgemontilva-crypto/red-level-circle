import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import {
  Radio, Eye, ExternalLink, Tv, ArrowLeft, ChevronRight, MessageSquare,
} from "lucide-react";
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

function buildChatUrl(
  platform: string,
  streamUrl: string | null | undefined,
  embedUrl: string | null | undefined,
): string | null {
  const domain = window.location.hostname;

  if (platform === "twitch") {
    const channelFromUrl = streamUrl
      ?.replace(/https?:\/\/(www\.)?twitch\.tv\//i, "")
      .split("?")[0]
      .replace(/\/$/, "");
    const channelFromEmbed = embedUrl?.match(/[?&]channel=([^&]+)/)?.[1];
    const channel = channelFromUrl || channelFromEmbed;
    if (!channel) return null;
    return `https://www.twitch.tv/embed/${channel}/chat?parent=${domain}&darkpopout`;
  }

  if (platform === "youtube") {
    const videoId = embedUrl?.match(/\/embed\/([\w-]+)/)?.[1];
    if (!videoId) return null;
    return `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${domain}`;
  }

  return null;
}

export default function StreamDetail() {
  const { id } = useParams<{ id: string }>();
  const streamId = parseInt(id ?? "0", 10);

  const { data: stream, isLoading } = trpc.streams.byId.useQuery(
    { id: streamId },
    { enabled: streamId > 0, refetchInterval: 30_000 },
  );

  const { data: byGameData } = trpc.streams.byGame.useQuery(
    undefined,
    { enabled: !!stream?.game, refetchInterval: 30_000 },
  );

  const related = (byGameData ?? [])
    .find((g) => g.game === stream?.game)
    ?.streams
    .filter((s) => s.id !== streamId && s.isLive)
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

  let resolvedEmbedUrl = stream.embedUrl;
  if (!resolvedEmbedUrl) {
    const channelLogin = stream.url
      ?.replace(/https?:\/\/(www\.)?twitch\.tv\//i, "")
      .split("?")[0]
      .replace(/\/$/, "");
    if (stream.platform === "twitch" && channelLogin) {
      const parent = window.location.hostname;
      resolvedEmbedUrl = `https://player.twitch.tv/?channel=${channelLogin}&parent=${parent}&autoplay=true&muted=false`;
    }
  }

  const chatUrl = stream.isLive
    ? buildChatUrl(stream.platform, stream.url, resolvedEmbedUrl)
    : null;

  const hasSidebar = related.length > 0;

  return (
    <div className="min-h-screen bg-card text-white">
      <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 pt-5 pb-16">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-4">
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

        {/* ── Outer grid: main | sidebar ── */}
        <div className={`grid gap-5 ${hasSidebar ? "xl:grid-cols-[1fr_300px]" : "grid-cols-1"}`}>

          {/* ── Main column ── */}
          <div className="flex flex-col gap-4 min-w-0">

            {resolvedEmbedUrl ? (
              /* ── Player + Chat container ──
                 Mobile  (<lg): stacked vertically — video 16:9, chat 480px below
                 Desktop (≥lg): side by side — fills 100vh - header
              */
              <div
                className="w-full rounded-xl overflow-hidden border border-border bg-card flex flex-col lg:flex-row"
                style={{ height: "auto" }}
                ref={(el) => {
                  if (!el) return;
                  // On desktop: set height to viewport minus header/breadcrumb
                  const setH = () => {
                    if (window.innerWidth >= 1024) {
                      el.style.height = `${Math.max(540, window.innerHeight - 200)}px`;
                    } else {
                      el.style.height = "auto";
                    }
                  };
                  setH();
                  window.addEventListener("resize", setH);
                }}
              >
                {/* ── Video ── */}
                <div className="w-full lg:flex-1 min-w-0 min-h-0">
                  {/* Mobile: 16:9 ratio. Desktop: fills full height of container */}
                  <div className="aspect-video lg:aspect-auto lg:h-full">
                    <iframe
                      src={resolvedEmbedUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                      allow="autoplay; encrypted-media; fullscreen; clipboard-write"
                      title={stream.title}
                    />
                  </div>
                </div>

                {/* ── Chat ── */}
                {chatUrl && (
                  <div
                    className="flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-[#0e0e10] w-full lg:w-[360px] lg:flex-shrink-0"
                    style={{ height: "480px" }}
                    ref={(el) => {
                      if (!el) return;
                      const setH = () => {
                        if (window.innerWidth >= 1024) {
                          el.style.height = "100%";
                        } else {
                          el.style.height = "480px";
                        }
                      };
                      setH();
                      window.addEventListener("resize", setH);
                    }}
                  >
                    {/* Chat header */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/20 flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[11px] font-mono font-semibold text-white tracking-widest uppercase">
                        Chat en vivo
                      </span>
                      {stream.platform === "twitch" && (
                        <span className="ml-auto text-[9px] font-mono text-purple-300 bg-purple-600/20 border border-purple-500/30 px-1.5 py-0.5 rounded">
                          TWITCH
                        </span>
                      )}
                      {stream.platform === "youtube" && (
                        <span className="ml-auto text-[9px] font-mono text-red-300 bg-red-700/20 border border-red-500/30 px-1.5 py-0.5 rounded">
                          YOUTUBE
                        </span>
                      )}
                    </div>

                    {/* Chat iframe — sin sandbox para permitir escritura */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <iframe
                        src={chatUrl}
                        className="w-full h-full border-0"
                        title="Chat en vivo"
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* No embed URL fallback */
              <div className="bg-card border border-border rounded-xl overflow-hidden">
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
              </div>
            )}

            {/* ── Stream info bar ── */}
            <div className="flex flex-wrap items-start justify-between gap-3">
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
                  <p className="text-muted-foreground text-sm font-mono mt-0.5">{stream.streamerName}</p>
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
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 font-orbitron text-xs gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    ABRIR EN {stream.platform.toUpperCase()}
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* ── Sidebar: related streams ── */}
          {hasSidebar && (
            <aside className="min-w-0">
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
        <div className="mt-8">
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
