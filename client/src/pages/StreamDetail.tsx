import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import {
  Radio, Eye, ExternalLink, Tv, ArrowLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StreamCard } from "@/components/StreamCard";
import RLCChat from "@/components/RLCChat";

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



/**
 * En Android/iOS, al abrir el teclado el navegador hace scroll del viewport
 * hacia arriba para mostrar el input, lo que empuja el video fuera de la pantalla.
 *
 * Solución: el video se fija con position:fixed en la parte superior (debajo del
 * navbar). El chat ocupa el resto de la pantalla con padding-top igual a la altura
 * del video, de modo que el input del chat siempre queda visible sin mover el video.
 *
 * Este hook calcula la altura del video (56.25vw = 16:9) y la aplica como
 * padding-top al contenedor del chat para que no quede tapado por el video.
 */
function useMobileVideoHeight(): number {
  const [videoH, setVideoH] = useState(() => Math.round(window.innerWidth * 9 / 16));
  useEffect(() => {
    const update = () => setVideoH(Math.round(window.innerWidth * 9 / 16));
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return videoH;
}

export default function StreamDetail() {
  const { id } = useParams<{ id: string }>();
  const streamId = parseInt(id ?? "0", 10);
  const videoH = useMobileVideoHeight();

  const { data: stream, isLoading } = trpc.streams.byId.useQuery(
    { id: streamId },
    { enabled: streamId > 0, refetchInterval: 30_000 },
  );

  const { data: me } = trpc.auth.me.useQuery();

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

  const hasSidebar = related.length > 0;

  const currentUser = me ? {
    id: me.id,
    name: me.name,
    nickname: me.nickname,
    avatar: me.avatar,
    role: me.role,
  } : null;

  return (
    <>
      {/*
       * ─────────────────────────────────────────────────────────────────────
       * MOBILE (<lg): video fijo en la parte superior (position:fixed),
       * chat en flujo normal con padding-top = altura del video.
       *
       * Al abrir el teclado, el navegador hace scroll del documento hacia arriba
       * para mostrar el input. Como el video es position:fixed, NO se mueve con
       * el scroll — siempre queda visible en la parte superior de la pantalla.
       * El chat queda debajo con padding-top para no quedar tapado por el video.
       * ─────────────────────────────────────────────────────────────────────
       */}

      {/* VIDEO: position fixed, siempre visible aunque el teclado suba */}
      <div
        className="lg:hidden fixed z-40 bg-black"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 56px)",
          left: 0,
          right: 0,
          height: `${videoH}px`,
        }}
      >
        {resolvedEmbedUrl ? (
          <iframe
            src={resolvedEmbedUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; clipboard-write"
            title={stream.title}
          />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <Tv className="w-10 h-10 text-zinc-600" />
          </div>
        )}
      </div>

      {/* CHAT: fixed desde debajo del video hasta el fondo.
          Al abrir el teclado, el navegador reduce el viewport y el chat
          se comprime — el input sube con el teclado y los mensajes del
          historial quedan parcialmente detrás del video (z-index menor). */}
      <div
        className="lg:hidden fixed z-30 bg-[#0d0d0d]"
        style={{
          top: `calc(env(safe-area-inset-top, 0px) + 56px + ${videoH}px)`,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <RLCChat streamId={streamId} currentUser={currentUser} />
      </div>

      {/*
       * ─────────────────────────────────────────────────────────────────────
       * DESKTOP (≥lg): layout normal con sidebar y barra de info.
       * ─────────────────────────────────────────────────────────────────────
       */}
      <div
        className="hidden lg:block text-white"
        style={{ background: "var(--bg-main)" }}
      >
        <div className="px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground pt-4 pb-3">
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

          {/* Grid: main | sidebar */}
          <div className={`grid gap-5 ${hasSidebar ? "xl:grid-cols-[1fr_300px]" : "grid-cols-1"}`}>
            {/* Main column */}
            <div className="flex flex-col gap-4 min-w-0">
              {resolvedEmbedUrl ? (
                <>
                  {/* Video + Chat lado a lado — altura = viewport - navbar(100px) - breadcrumb+info(~160px) - padding */}
                  <div
                    className="w-full overflow-hidden rounded-xl border border-border bg-card flex flex-row"
                    style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}
                  >
                    {/* Video */}
                    <div className="flex-1 min-w-0 min-h-0 bg-black">
                      <iframe
                        src={resolvedEmbedUrl}
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="autoplay; encrypted-media; fullscreen; clipboard-write"
                        title={stream.title}
                      />
                    </div>

                    {/* Chat */}
                    <div className="border-l border-border w-[360px] flex-shrink-0 flex flex-col h-full">
                      <RLCChat streamId={streamId} currentUser={currentUser} />
                    </div>
                  </div>

                  {/* Info bar */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pt-1 pb-2">
                    <div className="flex-1 min-w-0">
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
                </>
              ) : (
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
            </div>

            {/* Sidebar */}
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

          {/* Back link */}
          <div className="mt-6 mb-10">
            <Link href="/streams">
              <button className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-red-400 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a todas las transmisiones
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
