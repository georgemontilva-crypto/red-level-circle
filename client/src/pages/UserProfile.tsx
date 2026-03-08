import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  User, Trophy, Gamepad2, Twitter, MessageSquare, Tv2,
  Settings, Crown, Swords, Shield, Calendar, Users, UserPlus, UserMinus,
  Loader2, BadgeCheck, Camera, Save, Star, Radio, Clock, Eye,
  Coins, Globe, MapPin, Palette, CheckCircle2, RefreshCw, Link2,
} from "lucide-react";
import { useParams, Link, useSearch } from "wouter";
import { useState, useEffect, useRef } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { getRolesForGame, getRanksForGame, COMPETITIVE_REGIONS } from "../../../shared/gameRoles";
import { RiotProfileSection } from "@/components/RiotProfileSection";
import { RoleSelector } from "@/components/RoleSelector";
import { RankSelector } from "@/components/RankSelector";
import { GameDropdown, DropdownOption } from "@/components/GameDropdown";

const GAME_SLUG_MAP: Record<string, string> = {
  "League of Legends": "league-of-legends",
  "Valorant": "valorant",
  "CS2": "counter-strike",
  "Dota 2": "dota-2",
  "Fortnite": "fortnite",
  "Apex Legends": "apex-legends",
  "Overwatch 2": "overwatch",
  "Rocket League": "rocket-league",
  "Honor of Kings": "honor-of-kings",
  "Mobile Legends": "mobile-legends",
};
const GAMES = [
  "League of Legends", "Valorant", "CS2", "Dota 2", "Fortnite",
  "Apex Legends", "Overwatch 2", "Rainbow Six Siege", "Rocket League",
  "FIFA", "Call of Duty", "PUBG", "Minecraft", "Hearthstone", "Otro"
];

function ProfileTypeIcon({ type }: { type: string | null }) {
  if (type === "team_captain") return <Crown className="w-3.5 h-3.5 text-white" />;
  if (type === "event_creator") return <Swords className="w-3.5 h-3.5 text-white" />;
  return <Shield className="w-3.5 h-3.5 text-white" />;
}

const PROFILE_TYPE_LABEL: Record<string, string> = {
  player: "Jugador",
  team_captain: "Capitán",
  event_creator: "Creador",
};

export default function UserProfile() {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id ?? "0");
  const { user: me } = useAuth();
  const isOwnProfile = me?.id === userId;

  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.profile.getWithStats.useQuery(
    { userId },
    { enabled: !!userId }
  );

  const followMutation = trpc.follows.follow.useMutation({
    onSuccess: () => {
      utils.profile.getWithStats.invalidate({ userId });
      utils.follows.getCounts.invalidate({ userId });
      utils.follows.getFollowers.invalidate({ userId });
      utils.follows.isFollowing.invalidate();
      toast.success("¡Ahora sigues a este usuario!");
    },
    onError: (e) => toast.error(e.message),
  });

  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => {
      utils.profile.getWithStats.invalidate({ userId });
      utils.follows.getCounts.invalidate({ userId });
      utils.follows.getFollowers.invalidate({ userId });
      utils.follows.isFollowing.invalidate();
      toast.success("Dejaste de seguir a este usuario");
    },
    onError: (e) => toast.error(e.message),
  });

  const searchString = useSearch();
  const tabParam = new URLSearchParams(searchString).get("tab") as "overview" | "cosmetics" | "followers" | "following" | "roster" | null;
  const [activeTab, setActiveTab] = useState<"overview" | "cosmetics" | "followers" | "following" | "roster">(tabParam ?? "overview");
  useEffect(() => {
    if (tabParam && ["overview", "cosmetics", "followers", "following", "roster"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const { data: teamMemberships } = trpc.teams.membershipOf.useQuery(
    { userId },
    { enabled: !!userId }
  );

  const { data: myCosmetics = [], refetch: refetchMyCosmetics } = trpc.cosmetics.myCosmetics.useQuery(
    undefined,
    { enabled: isOwnProfile && activeTab === "cosmetics" }
  );
  const equipMutation = trpc.cosmetics.equip.useMutation({
    onSuccess: () => {
      toast.success("¡Cosmético equipado!");
      refetchMyCosmetics();
      utils.profile.getWithStats.invalidate({ userId });
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: followers } = trpc.follows.getFollowers.useQuery(
    { userId },
    { enabled: activeTab === "followers" }
  );
  const { data: following } = trpc.follows.getFollowing.useQuery(
    { userId },
    { enabled: activeTab === "following" }
  );
  const { data: betStats } = trpc.bets.userStats.useQuery(
    { userId },
    { enabled: !!userId }
  );

  const { data: activeStream } = trpc.streams.activeByUser.useQuery(
    { userId },
    { enabled: !!userId, refetchInterval: 60_000 }
  );
  const { data: streamHistory = [] } = trpc.streams.historyByUser.useQuery(
    { userId, limit: 10 },
    { enabled: !!userId }
  );

  // ── Riot profile (para sincronizar etiquetas del header y bloque de juego) ──
  const { data: lolProfile } = trpc.riot.getLolProfileByUserId.useQuery(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <p className="text-muted-foreground font-mono">Perfil no encontrado</p>
      </div>
    );
  }

  const equippedFrame = profile.equippedCosmetics?.find((c) => c.type === "frame" && c.isEquipped);
  const equippedAura = profile.equippedCosmetics?.find((c) => c.type === "aura" && c.isEquipped);
  const isFollowing = profile.isFollowing;
  const followLoading = followMutation.isPending || unfollowMutation.isPending;

  return (
    <div className="w-full" style={{ overflowX: "clip" }}>
      {/* ── Banner + Info Card (Discord-style) ── */}
      {/* Single padded container so banner and card body share the same width */}
      <div
        className="w-full"
        style={{ background: 'var(--bg-main)' }}
      >
        {/* Inner card that contains both banner and info body */}
        <div className="relative w-full rounded-xl overflow-visible" style={{ background: "#16191f" }}>

        {/* Banner */}
        <div className="w-full h-40 sm:h-56 relative rounded-xl overflow-hidden">
          {/* Default background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/70 via-zinc-950 to-black" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, #dc2626 0, #dc2626 1px, transparent 0, transparent 50%)",
              backgroundSize: "20px 20px",
            }}
          />
          {profile.bannerUrl ? (
            <img
              src={profile.bannerUrl}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          {/* Top-right actions — inside the banner */}
          <div className="absolute top-3 right-3 flex items-center gap-2" style={{ zIndex: 20 }}>
            {isOwnProfile && (
              <Link href="/settings">
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}
                  title="Configuración"
                >
                  <Settings className="w-4 h-4 text-white" />
                </button>
              </Link>
            )}
            {!isOwnProfile && me && (
              <button
                onClick={() => isFollowing ? unfollowMutation.mutate({ userId }) : followMutation.mutate({ userId })}
                disabled={followLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all duration-200"
                style={isFollowing
                  ? { background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--text-primary)" }
                  : { background: "oklch(0.55 0.22 25)", color: "var(--text-primary)" }
                }
              >
                {followLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isFollowing ? (
                  <><UserMinus className="w-3.5 h-3.5" /> SIGUIENDO</>
                ) : (
                  <><UserPlus className="w-3.5 h-3.5" /> SEGUIR</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Card body — info section below the banner, same width */}
        <div
          className="pb-4"
          style={{ paddingTop: "16px", paddingLeft: 'clamp(16px, 2.5vw, 32px)', paddingRight: 'clamp(16px, 2.5vw, 32px)' }}
        >
          <div className="max-w-2xl">
          {/* Avatar row — pulled up to overlap the banner */}
          <div className="flex items-end justify-between mb-3" style={{ marginTop: "-52px" }}>
            <div className="relative inline-block" style={{ zIndex: 30, overflow: "visible" }}>
              {/* Aura glow effect (separate from frame) */}
              {equippedAura && (
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-60 scale-150 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${equippedAura.frameImage ?? "var(--accent-red)"} 0%, transparent 70%)`, zIndex: 0 }}
                />
              )}
              <UserAvatar
                  avatar={profile.avatar}
                  name={profile.name}
                  activeFrameImage={equippedFrame?.frameImage ?? null}
                  size={109}
                  ringColor="oklch(0.55 0.22 25 / 0.6)"
                  ringWidth={4}
                />
            </div>
          </div>

          {/* Name row — below the avatar */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-orbitron font-black text-xl sm:text-2xl text-white truncate">
                  {profile.nickname ?? profile.name ?? "Usuario"}
                </h1>
                {profile.profileType && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono"
                    style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.3)" }}>
                    <ProfileTypeIcon type={profile.profileType} />
                    <span className="text-secondary-foreground">{PROFILE_TYPE_LABEL[profile.profileType] ?? profile.profileType}</span>
                  </div>
                )}
                {(profile as { isVerified?: boolean }).isVerified && (
                  <VerifiedBadge size={20} />
                )}
                {profile.role === "admin" && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">ADMIN</span>
                )}
                {profile.role === "premium" && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30">CDC</span>
                )}
                {activeStream && (
                  <a
                    href={activeStream.url ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono animate-pulse"
                    style={{ background: "oklch(0.55 0.22 25 / 0.2)", border: "1px solid oklch(0.55 0.22 25 / 0.5)", color: "oklch(0.75 0.22 25)" }}
                  >
                    <Radio className="w-3 h-3" />
                    EN VIVO
                    {activeStream.viewerCount ? <span className="opacity-80">· {activeStream.viewerCount.toLocaleString()}</span> : null}
                  </a>
                )}
              </div>
              {/* Username / handle */}
              {profile.nickname && profile.name && (
                <p className="text-muted-foreground text-sm font-mono mt-0.5">@{profile.name}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-3 text-secondary-foreground text-sm leading-relaxed">{profile.bio}</p>
          )}

          {/* Meta info row — sincronizado con Riot cuando aplica */}
          {(() => {
            const riotLinked = !!(lolProfile as any)?.account;
            // Si Riot está vinculado, el juego principal es siempre LoL (la API de Riot es para LoL/Valorant)
            const displayGame = riotLinked
              ? (profile.mainGame === "Valorant" ? "Valorant" : "League of Legends")
              : profile.mainGame;
            const isRiotGame = displayGame === "League of Legends" || displayGame === "Valorant";
            const riotRankedSolo = (lolProfile as any)?.rankedSolo;
            const riotRegion = (lolProfile as any)?.region;
            // Tier colors para el badge de rango de Riot
            const RIOT_TIER_COLORS: Record<string, { text: string; border: string; bg: string }> = {
              IRON:        { text: "#9E9E9E", bg: "rgba(158,158,158,0.12)", border: "rgba(158,158,158,0.30)" },
              BRONZE:      { text: "#CD7F32", bg: "rgba(205,127,50,0.12)",  border: "rgba(205,127,50,0.30)" },
              SILVER:      { text: "#C0C0C0", bg: "rgba(192,192,192,0.12)", border: "rgba(192,192,192,0.30)" },
              GOLD:        { text: "#FFD700", bg: "rgba(255,215,0,0.12)",   border: "rgba(255,215,0,0.30)" },
              PLATINUM:    { text: "#00B4D8", bg: "rgba(0,180,216,0.12)",   border: "rgba(0,180,216,0.30)" },
              EMERALD:     { text: "#50C878", bg: "rgba(80,200,120,0.12)",  border: "rgba(80,200,120,0.30)" },
              DIAMOND:     { text: "#B9F2FF", bg: "rgba(185,242,255,0.12)", border: "rgba(185,242,255,0.30)" },
              MASTER:      { text: "#9B59B6", bg: "rgba(155,89,182,0.12)",  border: "rgba(155,89,182,0.30)" },
              GRANDMASTER: { text: "#E74C3C", bg: "rgba(231,76,60,0.12)",   border: "rgba(231,76,60,0.30)" },
              CHALLENGER:  { text: "#F1C40F", bg: "rgba(241,196,15,0.12)",  border: "rgba(241,196,15,0.30)" },
            };
            const RIOT_REGION_LABELS: Record<string, string> = {
              la1: "LAN", la2: "LAS", na1: "NA", br1: "BR",
              euw1: "EUW", eun1: "EUNE", kr: "KR", jp1: "JP",
              oc1: "OCE", tr1: "TR", ru: "RU",
            };
            const gameSlug = GAME_SLUG_MAP[(displayGame ?? "")] ?? null;
            const roles = getRolesForGame(gameSlug);
            const roleData = roles.find((r) => r.value === (profile as any).gameRole);
            const ranks = getRanksForGame(gameSlug);
            const rankData = ranks.find((r) => r.value === (profile as any).elo);
            // Determinar el badge de rango: si es Riot game y tiene Riot vinculado con rango real, usarlo
            const riotTierColor = riotRankedSolo?.tier ? RIOT_TIER_COLORS[riotRankedSolo.tier] : null;
            const riotRankLabel = riotRankedSolo?.tier
              ? `${riotRankedSolo.tier.charAt(0) + riotRankedSolo.tier.slice(1).toLowerCase()} ${riotRankedSolo.rank ?? ""}`
              : null;
            // Determinar la región: si Riot vinculado, usar la región de Riot; si no, usar competitiveRegion del perfil
            const displayRegion = isRiotGame && riotLinked && riotRegion
              ? (RIOT_REGION_LABELS[riotRegion] ?? riotRegion.toUpperCase())
              : (profile as any).competitiveRegion ?? null;
            return (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
                {displayGame && (
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="w-3.5 h-3.5 text-white" />
                    {displayGame}
                  </span>
                )}
                {/* Rol — del perfil manual (el usuario lo elige en Settings) */}
                {roleData && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                    style={{ background: "oklch(0.55 0.22 25 / 0.12)", border: "1px solid oklch(0.55 0.22 25 / 0.25)", color: "oklch(0.75 0.15 25)" }}>
                    {roleData.svgPath ? (
                      <img src={roleData.svgPath} alt={roleData.label} className="w-3.5 h-3.5" style={{ filter: "invert(1) sepia(1) saturate(2) hue-rotate(320deg)" }} />
                    ) : <Gamepad2 className="w-3.5 h-3.5" />}
                    {roleData.label}
                  </span>
                )}
                {/* Rango — si Riot game + vinculado: usar tier real de Riot; si no: usar elo del perfil */}
                {isRiotGame && riotLinked && riotRankLabel ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                    style={riotTierColor
                      ? { background: riotTierColor.bg, border: `1px solid ${riotTierColor.border}`, color: riotTierColor.text }
                      : { background: "oklch(0.65 0.18 80 / 0.12)", border: "1px solid oklch(0.65 0.18 80 / 0.25)", color: "oklch(0.75 0.18 80)" }
                    }>
                    {riotTierColor && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: riotTierColor.text }} />}
                    {riotRankLabel.trim()}
                  </span>
                ) : rankData ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                    style={{ background: `${rankData.color}18`, border: `1px solid ${rankData.color}44`, color: rankData.color }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: rankData.color }} />
                    {rankData.label}
                  </span>
                ) : null}
                {/* Región — si Riot vinculado: región de la cuenta Riot; si no: competitiveRegion del perfil */}
                {displayRegion && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ background: "oklch(0.45 0.15 220 / 0.12)", border: "1px solid oklch(0.45 0.15 220 / 0.25)", color: "oklch(0.70 0.15 220)" }}>
                    <Globe className="w-3 h-3" /> {displayRegion}
                  </span>
                )}
                {profile.country && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.country}</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Desde {new Date(profile.createdAt).toLocaleDateString("es", { year: "numeric", month: "long" })}
                </span>
              </div>
            );
          })()}

          {/* Followers / Following counters */}
          <div className="flex items-center gap-5 mt-4">
            <button
              onClick={() => setActiveTab("followers")}
              className="flex items-center gap-1.5 text-sm transition-colors hover:text-white"
              style={{ color: activeTab === "followers" ? "oklch(0.65 0.22 25)" : "oklch(0.60 0.005 0)" }}
            >
              <span className="font-bold text-white font-mono">{profile.followerCount ?? 0}</span>
              <span>seguidores</span>
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className="flex items-center gap-1.5 text-sm transition-colors hover:text-white"
              style={{ color: activeTab === "following" ? "oklch(0.65 0.22 25)" : "oklch(0.60 0.005 0)" }}
            >
              <span className="font-bold text-white font-mono">{profile.followingCount ?? 0}</span>
              <span>siguiendo</span>
            </button>
          </div>

          {/* Social links */}
          <div className="flex flex-wrap gap-3 mt-3">
            {profile.socialDiscord && (
              <a href={`https://discord.gg/${profile.socialDiscord}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all"
                style={{ background: "oklch(0.40 0.15 265 / 0.15)", color: "oklch(0.70 0.15 265)", border: "1px solid oklch(0.40 0.15 265 / 0.3)" }}>
                <MessageSquare className="w-3 h-3" /> Discord
              </a>
            )}
            {profile.socialTwitch && (
              <a href={`https://twitch.tv/${profile.socialTwitch}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all"
                style={{ background: "oklch(0.40 0.15 300 / 0.15)", color: "oklch(0.70 0.15 300)", border: "1px solid oklch(0.40 0.15 300 / 0.3)" }}>
                <Tv2 className="w-3 h-3" /> Twitch
              </a>
            )}
            {profile.socialTwitter && (
              <a href={`https://twitter.com/${profile.socialTwitter}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all"
                style={{ background: "oklch(0.55 0.15 220 / 0.15)", color: "oklch(0.70 0.15 220)", border: "1px solid oklch(0.55 0.15 220 / 0.3)" }}>
                <Twitter className="w-3 h-3" /> Twitter
              </a>
            )}
          </div>
          </div>{/* end max-w-2xl */}
        </div>{/* end card body */}
        </div>{/* end inner card */}
      </div>{/* end padded container */}

      {/* ── Tabs ── */}
      <div className="mt-4 w-full">
        {/* Tab bar */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: "var(--border-main)", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {(["overview", "cosmetics", "followers", "following", "roster"] as const)
            .filter((tab) => {
              // Only show roster tab if the user belongs to at least one team
              if (tab === "roster") return teamMemberships && teamMemberships.length > 0;
              return true;
            })
            .map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-2 sm:px-4 py-2.5 text-[10px] sm:text-xs font-mono tracking-wider transition-all duration-200 relative whitespace-nowrap flex items-center gap-1 flex-shrink-0"
              style={{ color: activeTab === tab ? "oklch(0.65 0.22 25)" : "oklch(0.50 0.005 0)" }}
            >
              {tab === "overview" && "PERFIL"}
              {tab === "roster" && (
                <>
                  <Shield className="w-3 h-3" />
                  FICHA
                  {isOwnProfile && (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "oklch(0.55 0.22 25 / 0.2)", color: "oklch(0.65 0.22 25)" }}>EDITAR</span>
                  )}
                </>
              )}
              {tab === "cosmetics" && "COSMÉTICOS"}
              {tab === "followers" && `SEGUIDORES (${profile.followerCount ?? 0})`}
              {tab === "following" && `SIGUIENDO (${profile.followingCount ?? 0})`}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "oklch(0.55 0.22 25)" }} />
              )}
            </button>
           ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {/* Overview tab — Masonry Layout */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-[5fr_8fr] gap-3 items-start">

              {/* ── COLUMNA IZQUIERDA ── */}
              <div className="flex flex-col gap-3">

                {/* Stats */}
                <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}>
                  <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid oklch(0.15 0.005 0)" }}>
                    <Star className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
                    <span className="text-xs font-display tracking-wider text-foreground">ESTADÍSTICAS</span>
                  </div>
                  <div className="p-3 grid grid-cols-3 gap-2">
                    {[
                      { label: "RLC Coins", value: profile.rlcBalance ?? 0, icon: "coins" },
                      { label: "Seguidores", value: profile.followerCount ?? 0, icon: "users" },
                      { label: "Torneos", value: 0, icon: "trophy" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg p-2.5 text-center" style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.15 0.005 0)" }}>
                        <div className="flex justify-center mb-1" style={{ color: "oklch(0.55 0.22 25)" }}>
                          {stat.icon === "coins" && <Coins size={18} />}
                          {stat.icon === "users" && <Users size={18} />}
                          {stat.icon === "trophy" && <Trophy size={18} />}
                        </div>
                        <div className="font-mono font-bold text-white text-base">{stat.value.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipos */}
                {teamMemberships && teamMemberships.length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}>
                    <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid oklch(0.15 0.005 0)" }}>
                      <Shield className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
                      <span className="text-xs font-display tracking-wider text-foreground">EQUIPOS</span>
                    </div>
                    <div className="divide-y" style={{ borderColor: "var(--border-main)" }}>
                      {teamMemberships.map((m: any) => (
                        <Link key={m.teamId} href={`/teams/${m.teamId}`}>
                          <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                            {m.teamLogo ? (
                              <img src={m.teamLogo} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" style={{ border: "1px solid oklch(0.55 0.22 25 / 0.3)" }} />
                            ) : (
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.22 0.01 0)" }}>
                                <Shield size={16} style={{ color: "oklch(0.55 0.22 25)" }} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{m.teamName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {m.teamGame && <span className="text-xs text-muted-foreground">{m.teamGame}</span>}
                                <span className="text-xs font-display tracking-wider px-1.5 py-0.5 rounded"
                                  style={m.role === "captain"
                                    ? { background: "oklch(0.65 0.18 80 / 0.15)", color: "oklch(0.65 0.18 80)" }
                                    : { background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }
                                  }>
                                  {m.role === "captain" ? "Capitán" : m.role === "substitute" ? "Suplente" : m.role === "coach" ? "Entrenador" : "Jugador"}
                                </span>
                              </div>
                            </div>
                            {m.teamTag && (
                              <span className="text-xs font-mono shrink-0" style={{ color: "var(--text-muted)" }}>[{m.teamTag}]</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apuestas */}
                {betStats && betStats.total > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}>
                    <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid oklch(0.15 0.005 0)" }}>
                      <Coins className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
                      <span className="text-xs font-display tracking-wider text-foreground">APUESTAS</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground font-mono">% ACIERTO</span>
                          <span className="text-sm font-orbitron" style={{ color: betStats.winRate >= 50 ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" }}>{betStats.winRate}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${betStats.winRate}%`, background: betStats.winRate >= 50 ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg p-2 text-center" style={{ background: "var(--bg-card)" }}>
                          <p className="text-base font-orbitron" style={{ color: "oklch(0.65 0.18 145)" }}>{betStats.won}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">GANADAS</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: "var(--bg-card)" }}>
                          <p className="text-base font-orbitron" style={{ color: "oklch(0.65 0.22 25)" }}>{betStats.lost}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">PERDIDAS</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: "var(--bg-card)" }}>
                          <p className="text-base font-orbitron text-foreground">{betStats.pending}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">PENDIENTES</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg p-2.5" style={{ background: "var(--bg-card)" }}>
                          <p className="text-[10px] text-muted-foreground font-mono mb-0.5">VOLUMEN</p>
                          <p className="text-xs font-mono text-foreground">{betStats.totalWagered.toLocaleString()} RLC</p>
                        </div>
                        <div className="rounded-lg p-2.5" style={{ background: "var(--bg-card)" }}>
                          <p className="text-[10px] text-muted-foreground font-mono mb-0.5">BENEFICIO NETO</p>
                          <p className="text-xs font-mono" style={{ color: betStats.netProfit >= 0 ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" }}>
                            {betStats.netProfit >= 0 ? "+" : ""}{betStats.netProfit.toLocaleString()} RLC
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>{/* /col-left */}

              {/* ── COLUMNA DERECHA ── */}
              <div className="flex flex-col gap-3">

                {/* Bloque de juego principal (dinámico) */}
                <RiotProfileSection userId={userId} isOwnProfile={isOwnProfile} />

                {/* Streams */}
                {(streamHistory as any[]).length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}>
                    <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid oklch(0.15 0.005 0)" }}>
                      <Tv2 className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
                      <span className="text-xs font-display tracking-wider text-foreground">STREAMS</span>
                    </div>
                    <div className="divide-y" style={{ borderColor: "var(--border-main)" }}>
                      {(streamHistory as any[]).map((s) => (
                        <a key={s.id} href={s.url ?? undefined} target="_blank" rel="noreferrer"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                          {s.thumbnailUrl ? (
                            <img src={s.thumbnailUrl} alt="" className="w-16 h-9 rounded object-cover shrink-0" style={{ border: "1px solid oklch(0.22 0.01 0)" }} />
                          ) : (
                            <div className="w-16 h-9 rounded flex items-center justify-center shrink-0" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.22 0.01 0)" }}>
                              <Tv2 size={14} style={{ color: "oklch(0.40 0.005 0)" }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{s.title ?? "Sin título"}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              {s.game && <span className="text-xs text-muted-foreground truncate">{s.game}</span>}
                              {s.viewerCount ? (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Eye className="w-3 h-3" />{s.viewerCount.toLocaleString()}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {s.isLive ? (
                              <span className="px-1.5 py-0.5 rounded text-xs font-mono animate-pulse" style={{ background: "oklch(0.55 0.22 25 / 0.2)", color: "oklch(0.75 0.22 25)" }}>EN VIVO</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {new Date(s.updatedAt).toLocaleDateString("es", { day: "numeric", month: "short" })}
                              </span>
                            )}
                            <span className="text-xs font-mono capitalize" style={{ color: "var(--text-muted)" }}>{s.platform ?? ""}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historial de torneos */}
                <div className="rounded-xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}>
                  <Trophy className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm font-mono">Historial de torneos próximamente</p>
                </div>

              </div>{/* /col-right */}

            </div>
          )}

          {/* Roster / Ficha Competitiva tab */}
          {activeTab === "roster" && (
            <RosterTab
              profile={profile as any}
              isOwnProfile={isOwnProfile}
              lolProfile={lolProfile as any}
              teamMemberships={teamMemberships as any}
              onUpdate={() => {
                // Invalidate profile query to refresh data
              }}
            />
          )}

          {/* Cosmetics tab */}
          {activeTab === "cosmetics" && (
            <div>
              {isOwnProfile ? (
                /* Own profile: show all owned cosmetics with equip button */
                myCosmetics.length === 0 ? (
                  <div
                    className="rounded-xl p-8 text-center"
                    style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
                  >
                    <Palette size={36} className="mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground font-mono text-sm">No tienes cosméticos aún</p>
                    <a href="/shop/cosmetics" className="mt-3 inline-block text-xs text-red-400 hover:text-red-300 font-mono underline">Ir a la tienda</a>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-4">
                    {myCosmetics.map((c) => {
                      const rarity = (c as any).rarity ?? "common";
                      const rarityColor: Record<string, string> = {
                        common: "#9ca3af",
                        rare: "#3b82f6",
                        epic: "#a855f7",
                        legendary: "#f59e0b",
                      };
                      const rarityLabel: Record<string, string> = {
                        common: "Común",
                        rare: "Raro",
                        epic: "Épico",
                        legendary: "Legendario",
                      };
                      return (
                        <div
                          key={c.id}
                          className="rounded-lg transition-all"
                          style={{
                            background: "var(--bg-card)",
                            outline: c.isEquipped ? `1px solid ${rarityColor[rarity]}` : `1px solid oklch(0.18 0.01 0)`,
                            outlineOffset: "0px",
                          }}
                        >
                          <div className="w-full aspect-square overflow-hidden rounded-t-lg bg-card">
                            {(c as any).previewImage ? (
                              <img src={(c as any).previewImage} alt={(c as any).name ?? ""} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Palette size={24} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="p-2 text-center">
                            <p className="text-xs font-semibold text-secondary-foreground truncate font-rajdhani">{(c as any).name}</p>
                            <p className="text-[10px] font-mono capitalize mt-0.5" style={{ color: rarityColor[rarity] }}>{rarityLabel[rarity]}</p>
                            {c.isEquipped ? (
                              <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-green-400 font-mono"><CheckCircle2 size={10} /> Equipado</span>
                            ) : (
                              <button
                                onClick={() => equipMutation.mutate({ cosmeticId: c.cosmeticId })}
                                disabled={equipMutation.isPending}
                                className="mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-all disabled:opacity-50"
                              >
                                Equipar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Other user's profile: show only equipped cosmetics */
                !profile.equippedCosmetics || profile.equippedCosmetics.length === 0 ? (
                  <div
                    className="rounded-xl p-8 text-center"
                    style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
                  >
                    <Palette size={36} className="mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground font-mono text-sm">Sin cosméticos equipados</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-4">
                    {profile.equippedCosmetics.map((c) => {
                      const rarity = (c as any).rarity ?? "common";
                      const rarityColor: Record<string, string> = {
                        common: "#9ca3af",
                        rare: "#3b82f6",
                        epic: "#a855f7",
                        legendary: "#f59e0b",
                      };
                      const rarityLabel: Record<string, string> = {
                        common: "Común",
                        rare: "Raro",
                        epic: "Épico",
                        legendary: "Legendario",
                      };
                      return (
                        <div
                          key={c.id}
                          className="rounded-lg transition-all"
                          style={{
                            background: "var(--bg-card)",
                            outline: `1px solid ${rarityColor[rarity]}`,
                            outlineOffset: "0px",
                          }}
                        >
                          <div className="w-full aspect-square overflow-hidden rounded-t-lg bg-card">
                            {c.previewImage ? (
                              <img src={c.previewImage} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Palette size={24} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="p-2 text-center">
                            <p className="text-xs font-semibold text-secondary-foreground truncate font-rajdhani">{c.name}</p>
                            <p className="text-[10px] font-mono capitalize mt-0.5" style={{ color: rarityColor[rarity] }}>{rarityLabel[rarity]}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}

          {/* Followers tab */}
          {activeTab === "followers" && (
            <UserList users={followers ?? []} emptyText="Sin seguidores aún" />
          )}

          {/* Following tab */}
          {activeTab === "following" && (
            <UserList users={following ?? []} emptyText="No sigue a nadie aún" />
          )}
        </div>
      </div>
    </div>
  );
}

function UserList({ users, emptyText }: { users: { id: number; name: string | null; nickname: string | null; avatar: string | null; profileType: string | null; activeFrameImage?: string | null }[]; emptyText: string }) {
  if (!users.length) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
      >
        <Users className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-muted-foreground font-mono text-sm">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {users.map((u) => (
        <Link key={u.id} href={`/profile/${u.id}`}>
          <div
            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer"
            style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0.4)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "oklch(0.18 0.01 0)")}
          >
            <UserAvatar
              avatar={u.avatar}
              name={u.nickname ?? u.name}
              activeFrameImage={u.activeFrameImage}
              size={40}
            />
            <div className="flex-1 min-w-0">
              <p className="font-mono font-bold text-sm text-white truncate">
                {u.nickname ?? u.name ?? "Usuario"}
              </p>
              {u.profileType && (
                <p className="text-xs text-muted-foreground font-mono capitalize">
                  {PROFILE_TYPE_LABEL[u.profileType] ?? u.profileType}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Tier colors para la player card ────────────────────────────────────────
const PC_TIER_COLORS: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  IRON:        { text: "#9E9E9E", bg: "rgba(158,158,158,0.12)", border: "rgba(158,158,158,0.30)", glow: "rgba(158,158,158,0.15)" },
  BRONZE:      { text: "#CD7F32", bg: "rgba(205,127,50,0.12)",  border: "rgba(205,127,50,0.30)",  glow: "rgba(205,127,50,0.15)" },
  SILVER:      { text: "#C0C0C0", bg: "rgba(192,192,192,0.12)", border: "rgba(192,192,192,0.30)", glow: "rgba(192,192,192,0.15)" },
  GOLD:        { text: "#FFD700", bg: "rgba(255,215,0,0.12)",   border: "rgba(255,215,0,0.30)",   glow: "rgba(255,215,0,0.20)" },
  PLATINUM:    { text: "#00B4D8", bg: "rgba(0,180,216,0.12)",   border: "rgba(0,180,216,0.30)",   glow: "rgba(0,180,216,0.15)" },
  EMERALD:     { text: "#50C878", bg: "rgba(80,200,120,0.12)",  border: "rgba(80,200,120,0.30)",  glow: "rgba(80,200,120,0.15)" },
  DIAMOND:     { text: "#B9F2FF", bg: "rgba(185,242,255,0.12)", border: "rgba(185,242,255,0.30)", glow: "rgba(185,242,255,0.15)" },
  MASTER:      { text: "#9B59B6", bg: "rgba(155,89,182,0.12)",  border: "rgba(155,89,182,0.30)",  glow: "rgba(155,89,182,0.15)" },
  GRANDMASTER: { text: "#E74C3C", bg: "rgba(231,76,60,0.12)",   border: "rgba(231,76,60,0.30)",   glow: "rgba(231,76,60,0.15)" },
  CHALLENGER:  { text: "#F1C40F", bg: "rgba(241,196,15,0.12)",  border: "rgba(241,196,15,0.30)",  glow: "rgba(241,196,15,0.20)" },
  RADIANT:     { text: "#FFFDE7", bg: "rgba(255,253,231,0.12)", border: "rgba(255,253,231,0.30)", glow: "rgba(255,253,231,0.15)" },
  IMMORTAL:    { text: "#E74C3C", bg: "rgba(231,76,60,0.12)",   border: "rgba(231,76,60,0.30)",   glow: "rgba(231,76,60,0.15)" },
  ASCENDANT:   { text: "#50C878", bg: "rgba(80,200,120,0.12)",  border: "rgba(80,200,120,0.30)",  glow: "rgba(80,200,120,0.15)" },
  UNRANKED:    { text: "#6B7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.30)", glow: "rgba(107,114,128,0.10)" },
};
const PC_REGION_MAP: Record<string, string> = {
  la1: "LAN", la2: "LAS", na1: "NA", br1: "BR",
  euw1: "EUW", eun1: "EUNE", kr: "KR", jp1: "JP",
  oc1: "OCE", tr1: "TR", ru: "RU",
};
function getTierColors(tier?: string | null) {
  return PC_TIER_COLORS[(tier ?? "").toUpperCase()] ?? PC_TIER_COLORS.UNRANKED;
}
function formatRankLabel(entry: { tier: string; rank: string; leaguePoints: number } | null): string {
  if (!entry) return "Sin clasificar";
  const apex = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  if (apex.includes(entry.tier)) return `${entry.tier.charAt(0) + entry.tier.slice(1).toLowerCase()} ${entry.leaguePoints} LP`;
  return `${entry.tier.charAt(0) + entry.tier.slice(1).toLowerCase()} ${entry.rank}`;
}
function calcWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

// ─── RosterTab ────────────────────────────────────────────────────────────────
interface RosterTabProps {
  profile: {
    id: number;
    name: string | null;
    nickname: string | null;
    avatar: string | null;
    mainGame?: string | null;
    gameRole?: string | null;
    elo?: string | null;
    competitiveRegion?: string | null;
    gameId?: string | null;
    competitiveScore?: number | null;
    rosterImageUrl?: string | null;
    rosterPhoto?: string | null;
  };
  isOwnProfile: boolean;
  lolProfile?: any;
  teamMemberships?: any[];
  onUpdate: () => void;
}

function RosterTab({ profile, isOwnProfile, lolProfile, teamMemberships }: RosterTabProps) {
  const utils = trpc.useUtils();
  const [syncing, setSyncing] = useState(false);

  // ── Datos de Riot ──
  const riotLinked = !!(lolProfile as any)?.account;
  const account = (lolProfile as any)?.account;
  const rankedSolo = (lolProfile as any)?.rankedSolo ?? null;
  const rankedFlex = (lolProfile as any)?.rankedFlex ?? null;
  const topChampions: any[] = (lolProfile as any)?.topChampions ?? [];
  const recentMatches: any[] = (lolProfile as any)?.recentMatches ?? [];
  const profileIconUrl = (lolProfile as any)?.profileIconUrl ?? null;
  const region = (lolProfile as any)?.region ?? null;
  const regionLabel = region ? (PC_REGION_MAP[region] ?? region.toUpperCase()) : null;
  const isLol = !profile.mainGame || profile.mainGame === "League of Legends";
  const isValorant = profile.mainGame === "Valorant";
  const isRiotGame = isLol || isValorant;

  // Rol del perfil
  const gameSlug = isValorant ? "valorant" : "league-of-legends";
  const roles = getRolesForGame(gameSlug);
  const roleData = roles.find((r) => r.value === profile.gameRole);

  // Equipo principal
  const mainTeam = teamMemberships?.[0] ?? null;

  // Rango principal
  const mainRank = rankedSolo ?? rankedFlex;
  const tierColors = getTierColors(mainRank?.tier);
  const rankLabel = formatRankLabel(mainRank);
  const winRate = mainRank ? calcWinRate(mainRank.wins, mainRank.losses) : 0;
  const totalGames = mainRank ? (mainRank.wins + mainRank.losses) : 0;

  // Mutación para sincronizar
  const syncMutation = trpc.riot.syncToProfile.useMutation({
    onSuccess: () => {
      toast.success("Ficha sincronizada con Riot Games");
      setSyncing(false);
      utils.profile.getWithStats.invalidate({ userId: profile.id });
    },
    onError: (e) => { toast.error(e.message); setSyncing(false); },
  });

  const handleSync = () => {
    setSyncing(true);
    syncMutation.mutate();
  };

  // ── Estado: sin Riot vinculado ──
  if (!riotLinked) {
    return (
      <div className="pb-8">
        <div
          className="rounded-2xl p-10 flex flex-col items-center justify-center gap-5 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.55 0.22 25 / 0.10)", border: "1px solid oklch(0.55 0.22 25 / 0.25)" }}
          >
            <Swords className="w-7 h-7" style={{ color: "oklch(0.65 0.22 25)" }} />
          </div>
          <div>
            <p className="font-orbitron text-base font-bold text-foreground mb-2">Sin cuenta Riot vinculada</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Vincula tu cuenta de Riot Games para generar tu ficha competitiva automáticamente con tus datos reales de League of Legends o Valorant.
            </p>
          </div>
          {isOwnProfile && (
            <Link href="/settings">
              <button
                className="flex items-center gap-2 px-6 py-2.5 rounded-full font-orbitron text-xs tracking-widest font-bold transition-all"
                style={{ background: "oklch(0.55 0.22 25)", color: "#fff" }}
              >
                <Link2 className="w-4 h-4" /> VINCULAR CUENTA RIOT
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Layout principal: player card + panel de stats ──
  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
          <span className="font-orbitron text-sm tracking-widest text-secondary-foreground uppercase">Ficha Competitiva</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Sync badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: "#2ecc71" }}>SINCRONIZADO</span>
          </div>
          {isOwnProfile && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all"
              style={{ background: "var(--bg-card)", border: "1px solid oklch(0.22 0.01 0)", color: "rgba(255,255,255,0.5)", opacity: syncing ? 0.6 : 1 }}
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "SINCRONIZANDO..." : "ACTUALIZAR"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

        {/* ─── PLAYER CARD ─── */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            aspectRatio: "2/3",
            maxWidth: "300px",
            width: "100%",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: `0 0 60px rgba(192,57,43,0.20), 0 20px 60px rgba(0,0,0,0.6)`,
          }}
        >
          {/* BG */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(160deg, #160a0a 0%, #2a0d0d 40%, #120808 100%)" }}
          />
          {/* Hex pattern */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.04,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          {/* Accent line top */}
          <div
            className="absolute top-0 left-0 right-0 z-10"
            style={{ height: "3px", background: "linear-gradient(90deg, transparent, #c0392b, #ff6b6b, #c0392b, transparent)" }}
          />

          {/* Team top-left */}
          <div className="absolute top-3.5 left-4 z-10 flex items-center gap-2">
            {mainTeam?.teamLogo ? (
              <img src={mainTeam.teamLogo} alt="" className="w-7 h-7 rounded-md object-cover" style={{ border: "1px solid rgba(255,255,255,0.15)" }} />
            ) : (
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <Shield className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
              </div>
            )}
            {mainTeam?.teamTag && (
              <span className="font-orbitron text-[11px] font-bold tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>[{mainTeam.teamTag}]</span>
            )}
          </div>

          {/* Game label top-right */}
          <div className="absolute top-4 right-4 z-10 text-right">
            <span className="font-orbitron text-[9px] tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
              {isValorant ? "VALORANT" : "LEAGUE OF LEGENDS"}
            </span>
          </div>

          {/* Photo placeholder area */}
          <div className="absolute inset-0 flex items-end justify-center" style={{ zIndex: 2 }}>
            <div className="w-28 h-28 rounded-full mb-32 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <User className="w-12 h-12" style={{ color: "rgba(255,255,255,0.10)" }} />
            </div>
          </div>

          {/* Gradient over bottom */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ height: "65%", zIndex: 3, background: "linear-gradient(to top, rgba(18,8,8,1) 0%, rgba(18,8,8,0.85) 30%, transparent 100%)" }}
          />

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-5">
            {/* LoL profile icon */}
            {profileIconUrl && (
              <img
                src={profileIconUrl}
                alt="icon"
                className="w-12 h-12 rounded-full mb-2.5 block"
                style={{ border: "2px solid rgba(192,57,43,0.7)", boxShadow: "0 0 14px rgba(192,57,43,0.4)", background: "#1a0f0f" }}
              />
            )}

            {/* Nickname */}
            <div className="font-orbitron text-xl font-black text-white leading-none mb-1" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
              {profile.nickname ?? profile.name ?? "Jugador"}
            </div>
            {/* Riot ID */}
            {account && (
              <div className="font-mono text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.40)" }}>
                {account.gameName}#{account.tagLine}
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {roleData && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold"
                  style={{ background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.40)", color: "#e74c3c" }}
                >
                  {roleData.svgPath && <img src={roleData.svgPath} alt="" className="w-3 h-3" style={{ filter: "invert(1)" }} />}
                  {roleData.label}
                </span>
              )}
              {regionLabel && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold"
                  style={{ background: "rgba(52,152,219,0.12)", border: "1px solid rgba(52,152,219,0.30)", color: "#5dade2" }}
                >
                  <Globe className="w-3 h-3" /> {regionLabel}
                </span>
              )}
            </div>

            {/* Rank bar */}
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(4px)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: tierColors.bg, border: `2px solid ${tierColors.border}` }}
              >
                {mainRank ? "🏅" : "🛡"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-orbitron text-[13px] font-bold leading-none" style={{ color: tierColors.text }}>
                  {rankLabel}
                </div>
                {mainRank && (
                  <div className="font-mono text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {mainRank.leaguePoints} LP · {mainRank.wins}W {mainRank.losses}L
                  </div>
                )}
              </div>
              {mainRank && totalGames > 0 && (
                <div className="text-right flex-shrink-0">
                  <div className="font-orbitron text-[13px] font-bold" style={{ color: winRate >= 50 ? "#2ecc71" : "#e74c3c" }}>
                    {winRate}%
                  </div>
                  <div className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.30)" }}>WIN RATE</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── PANEL DERECHO ─── */}
        <div className="flex flex-col gap-4">

          {/* Stats grid */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
          >
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.55 0.22 25)" }} />
              <span className="font-orbitron text-[10px] tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>ESTADÍSTICAS DE TEMPORADA</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {[
                { value: rankLabel, color: tierColors.text, label: "RANGO SOLO" },
                { value: totalGames > 0 ? `${winRate}%` : "—", color: winRate >= 50 ? "#2ecc71" : winRate > 0 ? "#e74c3c" : "#6B7280", label: "WIN RATE" },
                { value: totalGames > 0 ? String(totalGames) : "—", color: "#e0e0e0", label: "PARTIDAS" },
                { value: regionLabel ?? "—", color: "#5dade2", label: "REGIÓN" },
                { value: mainRank ? String(mainRank.leaguePoints) : "—", color: "#e0e0e0", label: isValorant ? "RR" : "LP" },
                { value: profile.competitiveScore && profile.competitiveScore > 0 ? `${profile.competitiveScore.toLocaleString()}` : "—", color: "oklch(0.65 0.22 25)", label: "PTS RLC" },
              ].map((s, i) => (
                <div key={i} className="rounded-lg p-3 text-center" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="font-orbitron text-base font-bold leading-none" style={{ color: s.color }}>{s.value}</div>
                  <div className="font-mono text-[9px] mt-1 tracking-wider" style={{ color: "rgba(255,255,255,0.30)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Champions / Agentes */}
          {topChampions.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
            >
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.55 0.22 25)" }} />
                <span className="font-orbitron text-[10px] tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {isValorant ? "AGENTES PRINCIPALES" : "CAMPEONES PRINCIPALES"}
                </span>
              </div>
              <div className="p-4">
                <div className="flex gap-3">
                  {topChampions.slice(0, 5).map((champ: any, i: number) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden" style={{ border: "2px solid rgba(255,255,255,0.08)", background: "#1a1e25" }}>
                        <img
                          src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${champ.championName ?? champ.name ?? "Teemo"}.png`}
                          alt={champ.championName ?? champ.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        {champ.championLevel && (
                          <div
                            className="absolute bottom-0 right-0 font-mono text-[8px] px-1 py-0.5 leading-none"
                            style={{ background: "oklch(0.55 0.22 25)", color: "#fff", borderRadius: "4px 0 0 0" }}
                          >
                            M{champ.championLevel}
                          </div>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-center" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {(champ.championName ?? champ.name ?? "").slice(0, 8)}
                      </div>
                      {champ.championPoints && (
                        <div className="font-orbitron text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                          {champ.championPoints >= 1000 ? `${Math.round(champ.championPoints / 1000)}k` : champ.championPoints}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Partidas recientes */}
          {recentMatches.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
            >
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.55 0.22 25)" }} />
                <span className="font-orbitron text-[10px] tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>PARTIDAS RECIENTES</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {recentMatches.slice(0, 5).map((match: any, i: number) => {
                  const kda = match.deaths === 0
                    ? "Perfect"
                    : (((match.kills + match.assists) / match.deaths)).toFixed(1);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ background: "rgba(0,0,0,0.20)", border: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <div
                        className="w-1 h-9 rounded-full flex-shrink-0"
                        style={{ background: match.win ? "#2ecc71" : "#e74c3c" }}
                      />
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#1a1e25", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <img
                          src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${match.championName ?? "Teemo"}.png`}
                          alt={match.championName}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-orbitron text-[13px] font-bold"
                          style={{ color: match.win ? "#2ecc71" : "#e74c3c" }}
                        >
                          {match.kills}/{match.deaths}/{match.assists}
                        </div>
                        <div className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.30)" }}>
                          KDA · {kda} ratio
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.30)" }}>
                          {match.queueType?.includes("RANKED_SOLO") ? "SOLO" : match.queueType?.includes("RANKED_FLEX") ? "FLEX" : "NORMAL"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sin datos de ranked */}
          {!mainRank && topChampions.length === 0 && recentMatches.length === 0 && (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
            >
              <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: "oklch(0.25 0.01 0)" }} />
              <p className="font-orbitron text-xs" style={{ color: "oklch(0.40 0.005 0)" }}>Sin partidas clasificatorias esta temporada</p>
              <p className="font-mono text-[11px] mt-1" style={{ color: "oklch(0.30 0.005 0)" }}>Los datos se actualizan automáticamente desde Riot Games</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
