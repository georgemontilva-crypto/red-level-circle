/**
 * RiotProfileSection.tsx
 *
 * Sección del perfil de usuario que muestra la cuenta de Riot Games vinculada.
 * Incluye: vinculación, rango, campeones, partidas recientes.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Sword, Link2, Link2Off, RefreshCw, ChevronRight,
  Loader2, Trophy, Zap, Target, Shield,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DDRAGON_VERSION = "14.24.1";

function championIconUrl(championName: string): string {
  // Normalize champion name for DDragon (e.g. "Nunu & Willump" → "Nunu")
  const normalized = championName
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^Nunu$/, "Nunu")
    .replace(/^MonkeyKing$/, "MonkeyKing");
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${normalized}.png`;
}

function itemIconUrl(itemId: number): string {
  if (!itemId || itemId === 0) return "";
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${itemId}.png`;
}

function profileIconUrl(iconId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${iconId}.png`;
}

const TIER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  IRON:         { text: "#9E9E9E", bg: "rgba(158,158,158,0.10)", border: "rgba(158,158,158,0.25)" },
  BRONZE:       { text: "#CD7F32", bg: "rgba(205,127,50,0.10)",  border: "rgba(205,127,50,0.25)" },
  SILVER:       { text: "#C0C0C0", bg: "rgba(192,192,192,0.10)", border: "rgba(192,192,192,0.25)" },
  GOLD:         { text: "#FFD700", bg: "rgba(255,215,0,0.10)",   border: "rgba(255,215,0,0.25)" },
  PLATINUM:     { text: "#00B4D8", bg: "rgba(0,180,216,0.10)",   border: "rgba(0,180,216,0.25)" },
  EMERALD:      { text: "#50C878", bg: "rgba(80,200,120,0.10)",  border: "rgba(80,200,120,0.25)" },
  DIAMOND:      { text: "#B9F2FF", bg: "rgba(185,242,255,0.10)", border: "rgba(185,242,255,0.25)" },
  MASTER:       { text: "#9B59B6", bg: "rgba(155,89,182,0.10)",  border: "rgba(155,89,182,0.25)" },
  GRANDMASTER:  { text: "#E74C3C", bg: "rgba(231,76,60,0.10)",   border: "rgba(231,76,60,0.25)" },
  CHALLENGER:   { text: "#F1C40F", bg: "rgba(241,196,15,0.10)",  border: "rgba(241,196,15,0.25)" },
  UNRANKED:     { text: "#6B7280", bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.25)" },
};

const REGION_LABELS: Record<string, string> = {
  la1: "LAN", la2: "LAS", na1: "NA", br1: "BR",
  euw1: "EUW", eun1: "EUNE", kr: "KR", jp1: "JP",
  oc1: "OCE", tr1: "TR", ru: "RU",
};

const REGIONS = [
  { value: "la1", label: "LAN — Latinoamérica Norte" },
  { value: "la2", label: "LAS — Latinoamérica Sur" },
  { value: "na1", label: "NA — Norteamérica" },
  { value: "br1", label: "BR — Brasil" },
  { value: "euw1", label: "EUW — Europa Oeste" },
  { value: "eun1", label: "EUNE — Europa Este" },
  { value: "kr", label: "KR — Corea" },
  { value: "jp1", label: "JP — Japón" },
  { value: "oc1", label: "OCE — Oceanía" },
  { value: "tr1", label: "TR — Turquía" },
  { value: "ru", label: "RU — Rusia" },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatRank(entry: { tier: string; rank: string; leaguePoints: number } | null): string {
  if (!entry) return "Sin clasificar";
  const apex = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  if (apex.includes(entry.tier)) return `${entry.tier} — ${entry.leaguePoints} LP`;
  return `${entry.tier} ${entry.rank} — ${entry.leaguePoints} LP`;
}

function getWinRate(entry: { wins: number; losses: number } | null): number {
  if (!entry) return 0;
  const total = entry.wins + entry.losses;
  return total === 0 ? 0 : Math.round((entry.wins / total) * 100);
}

function getTierColor(tier: string | undefined) {
  return TIER_COLORS[tier ?? "UNRANKED"] ?? TIER_COLORS.UNRANKED;
}

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ entry, label }: { entry: any | null; label: string }) {
  const tier = entry?.tier ?? "UNRANKED";
  const colors = getTierColor(tier);
  const wr = getWinRate(entry);

  return (
    <div
      className="flex-1 rounded-xl p-4 flex flex-col gap-2"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-widest" style={{ color: "oklch(0.50 0.005 0)" }}>{label}</span>
        {entry && (
          <span className="text-[10px] font-mono" style={{ color: colors.text }}>
            {wr}% WR
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* Rank emblem via DDragon */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          {tier !== "UNRANKED" ? (
            <img
              src={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/${tier.toLowerCase()}.png`}
              alt={tier}
              className="w-10 h-10 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Shield className="w-6 h-6" style={{ color: colors.text }} />
          )}
        </div>
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: colors.text }}>
            {formatRank(entry)}
          </p>
          {entry && (
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.005 0)" }}>
              {entry.wins}V / {entry.losses}D
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Champion Mastery Card ────────────────────────────────────────────────────

function ChampionCard({ champ, index }: { champ: any; index: number }) {
  const pts = (champ.championPoints as number).toLocaleString();
  return (
    <div
      className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all hover:scale-105"
      style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
    >
      <div className="relative">
        <img
          src={championIconUrl(champ.championName ?? `${champ.championId}`)}
          alt={champ.championName}
          className="w-12 h-12 rounded-lg object-cover"
          style={{ border: "2px solid oklch(0.22 0.01 0)" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/Garen.png`;
          }}
        />
        {/* Mastery level badge */}
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{
            background: champ.championLevel >= 7 ? "oklch(0.65 0.22 25)" : champ.championLevel >= 5 ? "#FFD700" : "oklch(0.35 0.01 0)",
            color: "white",
            border: "1px solid rgba(0,0,0,0.5)",
          }}
        >
          {champ.championLevel}
        </div>
      </div>
      <p className="text-[10px] font-mono text-center leading-tight" style={{ color: "oklch(0.65 0.005 0)" }}>
        {champ.championName ?? `#${champ.championId}`}
      </p>
      <p className="text-[9px] font-mono" style={{ color: "oklch(0.45 0.005 0)" }}>
        {pts} pts
      </p>
    </div>
  );
}

// ─── Match Row ────────────────────────────────────────────────────────────────

function MatchRow({ match }: { match: any }) {
  const kda = match.deaths === 0
    ? "Perfect"
    : ((match.kills + match.assists) / match.deaths).toFixed(2);

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-white/5"
      style={{
        borderLeft: `3px solid ${match.win ? "oklch(0.55 0.18 145)" : "oklch(0.55 0.22 25)"}`,
        background: match.win ? "rgba(80,200,120,0.04)" : "rgba(220,38,38,0.04)",
      }}
    >
      {/* Champion icon */}
      <img
        src={championIconUrl(match.championName)}
        alt={match.championName}
        className="w-9 h-9 rounded-lg object-cover shrink-0"
        style={{ border: "1px solid oklch(0.22 0.01 0)" }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/Garen.png`;
        }}
      />
      {/* Result + KDA */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono font-bold"
            style={{ color: match.win ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" }}
          >
            {match.win ? "VICTORIA" : "DERROTA"}
          </span>
          <span className="text-[10px] font-mono" style={{ color: "oklch(0.40 0.005 0)" }}>
            {match.gameMode}
          </span>
        </div>
        <p className="text-xs font-mono text-white mt-0.5">
          {match.kills}/{match.deaths}/{match.assists}
          <span className="ml-1.5 text-[10px]" style={{ color: "oklch(0.50 0.005 0)" }}>
            KDA {kda}
          </span>
        </p>
      </div>
      {/* CS + Duration */}
      <div className="text-right shrink-0">
        <p className="text-[10px] font-mono" style={{ color: "oklch(0.50 0.005 0)" }}>
          {match.cs} CS
        </p>
        <p className="text-[10px] font-mono" style={{ color: "oklch(0.40 0.005 0)" }}>
          {formatDuration(match.gameDuration)}
        </p>
      </div>
      {/* Items */}
      <div className="hidden sm:flex items-center gap-0.5 shrink-0">
        {(match.items as number[]).slice(0, 6).map((itemId: number, i: number) => (
          itemId ? (
            <img
              key={i}
              src={itemIconUrl(itemId)}
              alt=""
              className="w-5 h-5 rounded"
              style={{ border: "1px solid oklch(0.20 0.01 0)" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div key={i} className="w-5 h-5 rounded" style={{ background: "oklch(0.15 0.005 0)" }} />
          )
        ))}
      </div>
    </div>
  );
}

// ─── Link Form ────────────────────────────────────────────────────────────────

function LinkAccountForm({ onSuccess }: { onSuccess: () => void }) {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [region, setRegion] = useState<string>("la1");

  const linkMutation = trpc.riot.linkAccount.useMutation({
    onSuccess: (data) => {
      toast.success(`¡Cuenta vinculada! ${data.gameName}#${data.tagLine}`);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim() || !tagLine.trim()) {
      toast.error("Ingresa tu Riot ID completo (nombre y tag)");
      return;
    }
    linkMutation.mutate({ gameName: gameName.trim(), tagLine: tagLine.trim(), region: region as any });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Riot ID input */}
      <div>
        <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: "oklch(0.50 0.005 0)" }}>
          RIOT ID
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="NombreDeJugador"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-mono text-white placeholder:text-zinc-600 outline-none transition-all"
              style={{
                background: "var(--bg-hover)",
                border: "1px solid oklch(0.22 0.01 0)",
              }}
              onFocus={(e) => { e.target.style.borderColor = "oklch(0.55 0.22 25)"; }}
              onBlur={(e) => { e.target.style.borderColor = "oklch(0.22 0.01 0)"; }}
            />
          </div>
          <div className="flex items-center" style={{ color: "oklch(0.40 0.005 0)" }}>
            <span className="text-lg font-mono">#</span>
          </div>
          <input
            type="text"
            placeholder="TAG"
            value={tagLine}
            onChange={(e) => setTagLine(e.target.value.toUpperCase())}
            maxLength={5}
            className="w-20 px-3 py-2.5 rounded-lg text-sm font-mono text-white placeholder:text-zinc-600 outline-none transition-all uppercase"
            style={{
              background: "var(--bg-hover)",
              border: "1px solid oklch(0.22 0.01 0)",
            }}
            onFocus={(e) => { e.target.style.borderColor = "oklch(0.55 0.22 25)"; }}
            onBlur={(e) => { e.target.style.borderColor = "oklch(0.22 0.01 0)"; }}
          />
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: "oklch(0.40 0.005 0)" }}>
          Tu Riot ID es el nombre que aparece en el cliente del juego, ej: <span className="text-zinc-400">Faker#KR1</span>
        </p>
      </div>

      {/* Region selector */}
      <div>
        <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: "oklch(0.50 0.005 0)" }}>
          SERVIDOR
        </label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm font-mono text-white outline-none transition-all cursor-pointer"
          style={{
            background: "var(--bg-hover)",
            border: "1px solid oklch(0.22 0.01 0)",
          }}
        >
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value} style={{ background: "#1a1a1a" }}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={linkMutation.isPending}
        className="w-full py-2.5 rounded-lg text-sm font-mono font-bold tracking-wider transition-all flex items-center justify-center gap-2"
        style={{
          background: linkMutation.isPending ? "oklch(0.35 0.10 25)" : "oklch(0.55 0.22 25)",
          color: "white",
        }}
      >
        {linkMutation.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> VERIFICANDO...</>
        ) : (
          <><Link2 className="w-4 h-4" /> VINCULAR CUENTA</>
        )}
      </button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface RiotProfileSectionProps {
  userId: number;
  isOwnProfile: boolean;
}

export function RiotProfileSection({ userId, isOwnProfile }: RiotProfileSectionProps) {
  const utils = trpc.useUtils();

  // Linked account data (own profile only)
  const { data: linkedAccount, isLoading: loadingLinked } = trpc.riot.getMyLinkedAccount.useQuery(
    undefined,
    { enabled: isOwnProfile }
  );

  // Full LoL profile (public, any user)
  const { data: lolProfile, isLoading: loadingProfile, refetch } = trpc.riot.getLolProfileByUserId.useQuery(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  );

  const unlinkMutation = trpc.riot.unlinkAccount.useMutation({
    onSuccess: () => {
      toast.success("Cuenta de Riot desvinculada");
      utils.riot.getMyLinkedAccount.invalidate();
      utils.riot.getLolProfileByUserId.invalidate({ userId });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleLinkSuccess = () => {
    utils.riot.getMyLinkedAccount.invalidate();
    utils.riot.getLolProfileByUserId.invalidate({ userId });
  };

  // ── Own profile, not linked ──────────────────────────────────────────────
  if (isOwnProfile && !loadingLinked && !linkedAccount) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid oklch(0.15 0.005 0)" }}>
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="oklch(0.55 0.22 25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xs font-display tracking-wider text-foreground">RIOT GAMES</span>
          <span
            className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }}
          >
            NO VINCULADO
          </span>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Intro */}
          <div className="flex items-start gap-3 mb-4 p-3 rounded-lg" style={{ background: "oklch(0.55 0.22 25 / 0.07)", border: "1px solid oklch(0.55 0.22 25 / 0.15)" }}>
            <Sword className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "oklch(0.65 0.22 25)" }} />
            <div>
              <p className="text-sm font-semibold text-white">Vincula tu cuenta de League of Legends</p>
              <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.005 0)" }}>
                Muestra tu rango, campeones favoritos y partidas recientes en tu perfil de RLC.
              </p>
            </div>
          </div>
          <LinkAccountForm onSuccess={handleLinkSuccess} />
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loadingProfile || loadingLinked) {
    return (
      <div
        className="rounded-xl p-6 flex items-center justify-center gap-3"
        style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
      >
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(0.55 0.22 25)" }} />
        <span className="text-sm font-mono" style={{ color: "oklch(0.50 0.005 0)" }}>Cargando perfil de Riot...</span>
      </div>
    );
  }

  // ── No data (not linked or other user without linked account) ────────────
  if (!lolProfile) return null;

  const { account, summoner, rankedSolo, rankedFlex, topChampions, recentMatches, profileIconUrl: iconUrl, apiError, region } = lolProfile as any;
  const tierColors = getTierColor(rankedSolo?.tier ?? rankedFlex?.tier);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
    >
      {/* ── Header ── */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: "1px solid oklch(0.15 0.005 0)" }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="oklch(0.55 0.22 25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs font-display tracking-wider text-foreground">RIOT GAMES — LEAGUE OF LEGENDS</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
            title="Actualizar"
          >
            <RefreshCw className="w-3.5 h-3.5" style={{ color: "oklch(0.50 0.005 0)" }} />
          </button>
          {isOwnProfile && (
            <button
              onClick={() => unlinkMutation.mutate()}
              disabled={unlinkMutation.isPending}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all hover:bg-white/10"
              style={{ color: "oklch(0.50 0.005 0)" }}
              title="Desvincular cuenta"
            >
              <Link2Off className="w-3 h-3" />
              DESVINCULAR
            </button>
          )}
        </div>
      </div>

      {/* ── Summoner Card ── */}
      <div className="p-4 space-y-4">

        {/* Profile header */}
        <div className="flex items-center gap-4">
          {/* Profile icon */}
          <div className="relative shrink-0">
            <img
              src={iconUrl}
              alt="Profile Icon"
              className="w-16 h-16 rounded-xl object-cover"
              style={{ border: `2px solid ${tierColors.border}` }}
              onError={(e) => { (e.target as HTMLImageElement).src = profileIconUrl(1); }}
            />
            {/* Level badge */}
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold whitespace-nowrap"
              style={{ background: "var(--bg-card)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.65 0.005 0)" }}
            >
              Nv. {summoner?.summonerLevel ?? "?"}
            </div>
          </div>

          {/* Name + region */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white leading-tight">
                {account?.gameName ?? "—"}
              </h3>
              <span className="text-sm font-mono" style={{ color: "oklch(0.45 0.005 0)" }}>
                #{account?.tagLine ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: "oklch(0.22 0.01 0)", color: "oklch(0.55 0.005 0)" }}
              >
                {REGION_LABELS[region ?? linkedAccount?.region ?? "la1"] ?? "—"}
              </span>
              {rankedSolo && (
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                  style={{ background: tierColors.bg, color: tierColors.text, border: `1px solid ${tierColors.border}` }}
                >
                  {rankedSolo.tier} {rankedSolo.rank}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── API Error banner ── */}
        {apiError && (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "oklch(0.55 0.22 25 / 0.08)", border: "1px solid oklch(0.55 0.22 25 / 0.20)" }}>
            <RefreshCw className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.65 0.22 25)" }} />
            <p className="text-xs font-mono" style={{ color: "oklch(0.60 0.005 0)" }}>
              Datos de Riot temporalmente no disponibles. Presiona actualizar para reintentar.
            </p>
          </div>
        )}
        {/* ── Ranked cards ── */}
        {!apiError && (
        <div className="flex gap-3">
          <RankBadge entry={rankedSolo} label="RANKED SOLO/DUO" />
          <RankBadge entry={rankedFlex} label="RANKED FLEX" />
        </div>
        )}

        {/* ── Top Champions ── */}
        {topChampions && topChampions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Trophy className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.22 25)" }} />
              <span className="text-[10px] font-mono tracking-widest" style={{ color: "oklch(0.50 0.005 0)" }}>
                CAMPEONES FAVORITOS
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {topChampions.map((champ: any, i: number) => (
                <div key={champ.championId} className="shrink-0">
                  <ChampionCard champ={champ} index={i} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Matches ── */}
        {recentMatches && recentMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Zap className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.22 25)" }} />
              <span className="text-[10px] font-mono tracking-widest" style={{ color: "oklch(0.50 0.005 0)" }}>
                PARTIDAS RECIENTES
              </span>
              {/* Win/loss summary */}
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[10px] font-mono" style={{ color: "oklch(0.65 0.18 145)" }}>
                  {recentMatches.filter((m: any) => m.win).length}V
                </span>
                <span className="text-[10px] font-mono" style={{ color: "oklch(0.40 0.005 0)" }}>/</span>
                <span className="text-[10px] font-mono" style={{ color: "oklch(0.65 0.22 25)" }}>
                  {recentMatches.filter((m: any) => !m.win).length}D
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              {recentMatches.map((match: any) => (
                <MatchRow key={match.matchId} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* No ranked data */}
        {!apiError && !rankedSolo && !rankedFlex && (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "oklch(0.15 0.005 0)", border: "1px solid oklch(0.20 0.01 0)" }}>
            <Target className="w-4 h-4 shrink-0" style={{ color: "oklch(0.45 0.005 0)" }} />
            <p className="text-xs font-mono" style={{ color: "oklch(0.45 0.005 0)" }}>
              Este jugador aún no tiene partidas clasificatorias esta temporada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
