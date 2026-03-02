/**
 * CreatorStreamPanel
 * ------------------
 * Shown to approved content creators in the Creators page.
 * Lets them start / stop their own live stream and links to their profile.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Radio, StopCircle, Twitch, Youtube, ExternalLink,
  CheckCircle, Loader2, Users, Gamepad2, Globe, Disc3,
} from "lucide-react";
import { toast } from "sonner";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  twitch: Twitch,
  youtube: Youtube,
  discord: Disc3,
  other: Globe,
};

const PLATFORM_LABELS: Record<string, string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  discord: "Discord",
  other: "Otro",
};

const PLATFORM_COLORS: Record<string, string> = {
  twitch: "text-purple-400",
  youtube: "text-red-400",
  discord: "text-indigo-400",
  other: "text-muted-foreground",
};

interface CreatorStreamPanelProps {
  /** The creator's application record (from trpc.creators.getMyApplication) */
  creatorApp: {
    twitch?: string | null;
    youtube?: string | null;
    status: string;
  };
}

export function CreatorStreamPanel({ creatorApp }: CreatorStreamPanelProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // ── Active stream query ──────────────────────────────────────────────────
  const { data: activeStream, isLoading: loadingActive } =
    trpc.streams.myActiveStream.useQuery(undefined, { refetchInterval: 30_000 });

  // ── Games list ───────────────────────────────────────────────────────────
  const { data: games } = trpc.games.list.useQuery();

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: "",
    platform: (creatorApp.twitch ? "twitch" : creatorApp.youtube ? "youtube" : "other") as
      "twitch" | "youtube" | "discord" | "other",
    url: creatorApp.twitch
      ? `https://twitch.tv/${creatorApp.twitch}`
      : creatorApp.youtube
      ? `https://youtube.com/@${creatorApp.youtube}`
      : "",
    game: "",
    gameSlug: "",
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const startStream = trpc.streams.startCreatorStream.useMutation({
    onSuccess: () => {
      toast.success("¡Transmisión iniciada! Ya apareces en la sección EN VIVO.");
      utils.streams.myActiveStream.invalidate();
      utils.streams.byGame.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const stopStream = trpc.streams.stopCreatorStream.useMutation({
    onSuccess: () => {
      toast.success("Transmisión detenida.");
      utils.streams.myActiveStream.invalidate();
      utils.streams.byGame.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Derived ──────────────────────────────────────────────────────────────
  const isLive = !!activeStream;
  const PlatformIcon = PLATFORM_ICONS[form.platform] ?? Globe;

  function handleGameChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = games?.find((g) => g.slug === e.target.value);
    setForm((f) => ({
      ...f,
      game: selected?.name ?? e.target.value,
      gameSlug: e.target.value,
    }));
  }

  function handlePlatformChange(p: "twitch" | "youtube" | "discord" | "other") {
    let url = form.url;
    if (p === "twitch" && creatorApp.twitch) url = `https://twitch.tv/${creatorApp.twitch}`;
    else if (p === "youtube" && creatorApp.youtube) url = `https://youtube.com/@${creatorApp.youtube}`;
    setForm((f) => ({ ...f, platform: p, url }));
  }

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Ingresa un título para tu transmisión.");
    if (!form.game) return toast.error("Selecciona el juego que vas a transmitir.");
    if (!form.url.trim()) return toast.error("Ingresa la URL de tu canal.");
    startStream.mutate({
      title: form.title.trim(),
      platform: form.platform,
      url: form.url.trim(),
      game: form.game,
      gameSlug: form.gameSlug || undefined,
    });
  }

  // ── Active stream view ───────────────────────────────────────────────────
  if (loadingActive) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (isLive && activeStream) {
    const Icon = PLATFORM_ICONS[activeStream.platform] ?? Globe;
    return (
      <div className="space-y-6">
        {/* Live banner */}
        <div className="relative rounded-2xl overflow-hidden border border-red-600/40 bg-card">
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative p-6">
            {/* Status row */}
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-orbitron font-bold animate-pulse">
                <Radio size={10} />
                EN VIVO
              </span>
              <span className={`flex items-center gap-1.5 text-sm font-mono ${PLATFORM_COLORS[activeStream.platform]}`}>
                <Icon size={14} />
                {PLATFORM_LABELS[activeStream.platform]}
              </span>
            </div>

            {/* Title + game */}
            <h3 className="font-orbitron font-bold text-white text-xl mb-1 leading-tight">
              {activeStream.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              {activeStream.game && (
                <span className="flex items-center gap-1.5">
                  <Gamepad2 size={13} />
                  {activeStream.game}
                </span>
              )}
              {activeStream.viewerCount != null && activeStream.viewerCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users size={13} />
                  {activeStream.viewerCount.toLocaleString()} viewers
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <a
                href={activeStream.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-muted text-white text-sm font-mono transition-colors border border-border"
              >
                <ExternalLink size={14} />
                Abrir stream
              </a>
              <button
                onClick={() => stopStream.mutate({ id: activeStream.id })}
                disabled={stopStream.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-orbitron font-bold transition-colors disabled:opacity-60"
              >
                {stopStream.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <StopCircle size={14} />
                )}
                DETENER TRANSMISIÓN
              </button>
            </div>
          </div>
        </div>

        {/* Profile link */}
        <div className="text-center">
          <Link href={`/profile/${user?.id}`}>
            <button className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white bg-secondary hover:bg-muted border border-border transition-colors">
              VER MI PERFIL PÚBLICO
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Start stream form ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center flex-shrink-0">
          <Radio size={22} className="text-red-500" />
        </div>
        <div>
          <h3 className="font-orbitron font-bold text-white text-lg">Transmitir ahora</h3>
          <p className="text-muted-foreground text-sm mt-0.5">
            Inicia una transmisión en vivo que aparecerá en la sección pública{" "}
            <Link href="/streams" className="text-red-400 hover:text-red-300 transition-colors">
              EN VIVO
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Approved badge */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-950/30 border border-green-800/30">
        <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
        <span className="text-green-400 text-sm font-mono">Creador oficial aprobado</span>
      </div>

      {/* Form */}
      <form onSubmit={handleStart} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">
            Título del stream *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="ej. Ranked Challenger — ¡Subiendo a Master!"
            maxLength={256}
            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-white placeholder-muted-foreground text-sm focus:outline-none focus:border-red-600/60 transition-colors"
          />
        </div>

        {/* Game */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">
            Juego *
          </label>
          <select
            value={form.gameSlug}
            onChange={handleGameChange}
            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-white text-sm focus:outline-none focus:border-red-600/60 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Selecciona un juego…</option>
            {(games ?? []).map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Platform selector */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">
            Plataforma *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["twitch", "youtube", "discord", "other"] as const).map((p) => {
              const Icon = PLATFORM_ICONS[p];
              const isSelected = form.platform === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePlatformChange(p)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-mono transition-all ${
                    isSelected
                      ? "bg-red-600/10 border-red-600/50 text-white"
                      : "bg-card border-border text-muted-foreground hover:border-border"
                  }`}
                >
                  <Icon size={16} className={isSelected ? PLATFORM_COLORS[p] : ""} />
                  {PLATFORM_LABELS[p]}
                </button>
              );
            })}
          </div>
        </div>

        {/* URL */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">
            URL del canal *
          </label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://twitch.tv/tu_canal"
            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-white placeholder-muted-foreground text-sm focus:outline-none focus:border-red-600/60 transition-colors font-mono"
          />
          {form.platform === "twitch" && creatorApp.twitch && (
            <p className="mt-1.5 text-xs text-muted-foreground font-mono">
              Canal registrado: twitch.tv/{creatorApp.twitch}
            </p>
          )}
          {form.platform === "youtube" && creatorApp.youtube && (
            <p className="mt-1.5 text-xs text-muted-foreground font-mono">
              Canal registrado: youtube.com/@{creatorApp.youtube}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={startStream.isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-orbitron font-bold text-sm text-white bg-red-600 hover:bg-red-500 disabled:opacity-60 transition-colors"
        >
          {startStream.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Radio size={16} />
          )}
          INICIAR TRANSMISIÓN
        </button>
      </form>

      {/* Profile link */}
      <div className="pt-2 border-t border-border/60 text-center">
        <Link href={`/profile/${user?.id}`}>
          <button className="px-6 py-2.5 rounded-xl font-orbitron font-bold text-xs text-muted-foreground hover:text-white bg-transparent hover:bg-secondary border border-border transition-colors">
            VER MI PERFIL PÚBLICO
          </button>
        </Link>
      </div>
    </div>
  );
}
