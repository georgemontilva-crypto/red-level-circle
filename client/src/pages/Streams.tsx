import { trpc } from "@/lib/trpc";
import { Radio, Tv } from "lucide-react";
import { Link } from "wouter";
import { StreamCard } from "@/components/StreamCard";
import { ChevronRight } from "lucide-react";

// ─── Game cover art (Twitch box art CDN) ─────────────────────────────────────
const GAME_COVERS: Record<string, string> = {
  "League of Legends": "https://static-cdn.jtvnw.net/ttv-boxart/21779-285x380.jpg",
  "Valorant":          "https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg",
  "CS2":               "https://static-cdn.jtvnw.net/ttv-boxart/32399-285x380.jpg",
  "Dota 2":            "https://static-cdn.jtvnw.net/ttv-boxart/29595-285x380.jpg",
  "Fortnite":          "https://static-cdn.jtvnw.net/ttv-boxart/33214-285x380.jpg",
  "Apex Legends":      "https://static-cdn.jtvnw.net/ttv-boxart/511224-285x380.jpg",
  "Overwatch 2":       "https://static-cdn.jtvnw.net/ttv-boxart/515025-285x380.jpg",
  "Rocket League":     "https://static-cdn.jtvnw.net/ttv-boxart/30921-285x380.jpg",
  "FIFA":              "https://static-cdn.jtvnw.net/ttv-boxart/1229590973-285x380.jpg",
  "Call of Duty":      "https://static-cdn.jtvnw.net/ttv-boxart/512710-285x380.jpg",
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col bg-card border border-border/60 rounded-xl overflow-hidden animate-pulse">
      <div className="w-full aspect-video bg-secondary" />
      <div className="p-3 flex gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-2 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

// ─── Game section header ──────────────────────────────────────────────────────
function GameSectionHeader({ game, count }: { game: string; count: number }) {
  const cover = GAME_COVERS[game];
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="flex-shrink-0 w-10 h-[54px] rounded-md overflow-hidden bg-secondary border border-border/50 shadow-lg">
        {cover ? (
          <img src={cover} alt={game} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tv className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-orbitron font-black text-lg text-white tracking-wide leading-none">
          {game}
        </h2>
        <p className="text-muted-foreground text-xs font-mono mt-1">
          {count} transmisión{count !== 1 ? "es" : ""} en vivo
        </p>
      </div>
      <Link href={`/streams?game=${encodeURIComponent(game)}`}>
        <button className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-red-400 transition-colors border border-border/60 hover:border-red-500/50 px-3 py-1.5 rounded-lg whitespace-nowrap">
          Mostrar todo
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </Link>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Streams() {
  const { data: groups, isLoading } = trpc.streams.byGame.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const totalLive = groups?.reduce((acc, g) => acc + g.streams.length, 0) ?? 0;

  return (
    <div className="min-h-screen bg-card text-white">
      <div className="container pt-6 pb-20">

        {/* ── Page header ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="w-5 h-5 text-red-500 flex-shrink-0" />
            <h1 className="font-orbitron font-black text-3xl sm:text-4xl text-white tracking-wider">
              EN VIVO
            </h1>
            {totalLive > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-mono bg-red-600 text-white px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(220,38,38,0.4)]">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                {totalLive} activa{totalLive !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-muted-foreground font-rajdhani text-base">
            Transmisiones agrupadas por juego · actualizado cada 30 segundos
          </p>
        </div>

        {/* ── Loading skeletons ── */}
        {isLoading && (
          <div className="space-y-14">
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="h-px bg-gradient-to-r from-red-600/40 via-zinc-700/30 to-transparent mb-6" />
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-10 h-[54px] bg-secondary rounded-md animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded w-40 animate-pulse" />
                    <div className="h-2 bg-secondary rounded w-24 animate-pulse" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, j) => <SkeletonCard key={j} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && (!groups || groups.length === 0) && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center mb-6">
              <Radio className="w-9 h-9 text-zinc-700" />
            </div>
            <h3 className="font-orbitron font-black text-2xl text-muted-foreground mb-2 tracking-wide">
              SIN TRANSMISIONES
            </h3>
            <p className="text-muted-foreground font-rajdhani text-base max-w-sm">
              No hay transmisiones en vivo en este momento. Vuelve más tarde o activa una desde el panel de creador.
            </p>
          </div>
        )}

        {/* ── Game sections ── */}
        {!isLoading && groups && groups.length > 0 && (
          <div className="space-y-14">
            {groups.map(({ game, streams }) => (
              <section key={game}>
                <div className="h-px bg-gradient-to-r from-red-600/40 via-zinc-700/30 to-transparent mb-6" />
                <GameSectionHeader game={game} count={streams.length} />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {streams.slice(0, 5).map((stream) => (
                    <StreamCard key={stream.id} stream={stream as any} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
