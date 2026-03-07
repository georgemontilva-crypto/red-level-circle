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
import CustomSelect from "@/components/CustomSelect";
import {
  Radio, StopCircle, Twitch, Youtube, ExternalLink,
  CheckCircle, Loader2, Users, Gamepad2, Globe, Disc3, ChevronDown,
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

// ─── Shared input style ───────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff",
  outline: "none",
};

function NeonInput({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  fontMono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  fontMono?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full px-3.5 py-2.5 rounded-xl text-sm placeholder-zinc-600 transition-colors ${fontMono ? "font-mono" : ""}`}
      style={{
        ...inputStyle,
        borderColor: focused ? "rgba(220,38,38,0.55)" : "rgba(255,255,255,0.10)",
        boxShadow: focused ? "0 0 0 2px rgba(220,38,38,0.10)" : "none",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Custom select with chevron ───────────────────────────────────────────────
function NeonSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white cursor-pointer appearance-none transition-colors"
        style={{
          ...inputStyle,
          borderColor: focused ? "rgba(220,38,38,0.55)" : "rgba(255,255,255,0.10)",
          boxShadow: focused ? "0 0 0 2px rgba(220,38,38,0.10)" : "none",
          paddingRight: "2.5rem",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"
      />
    </div>
  );
}

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

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loadingActive) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-zinc-500" size={24} />
      </div>
    );
  }

  // ── Active stream view ───────────────────────────────────────────────────
  if (isLive && activeStream) {
    const Icon = PLATFORM_ICONS[activeStream.platform] ?? Globe;
    return (
      <div className="space-y-5">
        {/* Live banner */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.05)" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-transparent to-transparent pointer-events-none" />
          <div className="relative p-5">
            {/* Status row */}
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-orbitron font-bold"
                style={{ background: "oklch(0.50 0.22 25)", boxShadow: "0 0 12px oklch(0.50 0.22 25 / 0.4)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                EN VIVO
              </span>
              <span className={`flex items-center gap-1.5 text-sm font-mono ${PLATFORM_COLORS[activeStream.platform]}`}>
                <Icon size={13} />
                {PLATFORM_LABELS[activeStream.platform]}
              </span>
            </div>

            {/* Title + game */}
            <h3 className="font-orbitron font-bold text-white text-base sm:text-lg mb-1 leading-tight">
              {activeStream.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 mb-5">
              {activeStream.game && (
                <span className="flex items-center gap-1.5">
                  <Gamepad2 size={12} />
                  {activeStream.game}
                </span>
              )}
              {activeStream.viewerCount != null && activeStream.viewerCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users size={12} />
                  {activeStream.viewerCount.toLocaleString()} viewers
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                href={activeStream.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-mono transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              >
                <ExternalLink size={13} />
                Abrir stream
              </a>
              <button
                onClick={() => stopStream.mutate({ id: activeStream.id })}
                disabled={stopStream.isPending}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-orbitron font-bold transition-colors disabled:opacity-60"
                style={{ background: "rgba(220,38,38,0.20)", border: "1px solid rgba(220,38,38,0.40)" }}
              >
                {stopStream.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <StopCircle size={13} />
                )}
                DETENER TRANSMISIÓN
              </button>
            </div>
          </div>
        </div>

        {/* Profile link */}
        <div className="text-center pt-1">
          <Link href={`/profile/${user?.id}`}>
            <button className="px-5 py-2.5 rounded-xl font-orbitron font-bold text-xs text-zinc-400 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              VER MI PERFIL PÚBLICO
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Start stream form ────────────────────────────────────────────────────
  return (
    <form onSubmit={handleStart} className="space-y-4">
      {/* Approved badge */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
        style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.20)" }}>
        <CheckCircle size={13} className="text-green-500 shrink-0" />
        <span className="text-green-400 text-xs font-mono">Creador oficial aprobado</span>
      </div>

      {/* Title */}
      <div>
        <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          Título del stream <span className="text-red-500">*</span>
        </label>
        <NeonInput
          value={form.title}
          onChange={v => setForm(f => ({ ...f, title: v }))}
          placeholder="ej. Ranked Challenger — ¡Subiendo a Master!"
          maxLength={256}
        />
      </div>

      {/* Game */}
      <div>
        <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          Juego <span className="text-red-500">*</span>
        </label>
        <CustomSelect
          value={form.gameSlug}
          onChange={v => {
            const selected = (games ?? []).find((g: { slug: string; name: string }) => g.slug === v);
            setForm(f => ({ ...f, game: selected?.name ?? v, gameSlug: v }));
          }}
          options={[
            { value: "", label: "Selecciona un juego…" },
            ...(games ?? []).map((g: { slug: string; name: string }) => ({ value: g.slug, label: g.name })),
          ]}
          placeholder="Selecciona un juego…"
          size="md"
        />
      </div>

      {/* Platform selector */}
      <div>
        <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          Plataforma <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["twitch", "youtube", "discord", "other"] as const).map((p) => {
            const Icon = PLATFORM_ICONS[p];
            const isSelected = form.platform === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePlatformChange(p)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-mono transition-all"
                style={isSelected
                  ? { background: "rgba(220,38,38,0.12)", borderColor: "rgba(220,38,38,0.50)", color: "#fff" }
                  : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", color: "#6b7280" }
                }
              >
                <Icon size={16} className={isSelected ? PLATFORM_COLORS[p] : "text-zinc-500"} />
                {PLATFORM_LABELS[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* URL */}
      <div>
        <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          URL del canal <span className="text-red-500">*</span>
        </label>
        <NeonInput
          type="url"
          value={form.url}
          onChange={v => setForm(f => ({ ...f, url: v }))}
          placeholder="https://twitch.tv/tu_canal"
          fontMono
        />
        {form.platform === "twitch" && creatorApp.twitch && (
          <p className="mt-1.5 text-[11px] text-zinc-500 font-mono">
            Canal registrado: twitch.tv/{creatorApp.twitch}
          </p>
        )}
        {form.platform === "youtube" && creatorApp.youtube && (
          <p className="mt-1.5 text-[11px] text-zinc-500 font-mono">
            Canal registrado: youtube.com/@{creatorApp.youtube}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={startStream.isPending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-orbitron font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
        style={{ background: "oklch(0.50 0.22 25)", boxShadow: "0 0 20px oklch(0.50 0.22 25 / 0.30)" }}
      >
        {startStream.isPending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Radio size={15} />
        )}
        INICIAR TRANSMISIÓN
      </button>

      {/* Profile link */}
      <div className="pt-1 text-center">
        <Link href={`/profile/${user?.id}`}>
          <button type="button"
            className="px-5 py-2 rounded-xl font-orbitron font-bold text-xs text-zinc-500 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            VER MI PERFIL PÚBLICO
          </button>
        </Link>
      </div>
    </form>
  );
}
