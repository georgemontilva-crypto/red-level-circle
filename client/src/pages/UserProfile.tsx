import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  User, Trophy, Gamepad2, Twitter, MessageSquare, Tv2,
  Settings, Crown, Swords, Shield, Calendar, Users, UserPlus, UserMinus,
  Loader2, BadgeCheck, Camera, Save, Star, Radio, Clock, Eye,
  Coins, Globe, MapPin, Palette, CheckCircle2,
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
            const isRiotGame = profile.mainGame === "League of Legends" || profile.mainGame === "Valorant";
            const riotLinked = !!(lolProfile as any)?.account;
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
            const gameSlug = GAME_SLUG_MAP[(profile.mainGame ?? "")] ?? null;
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
                {profile.mainGame && (
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="w-3.5 h-3.5 text-white" />
                    {profile.mainGame}
                  </span>
                )}
                {/* Rol — siempre del perfil manual */}
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
  onUpdate: () => void;
}

function RosterTab({ profile, isOwnProfile }: RosterTabProps) {
  const utils = trpc.useUtils();

  // ── Competitive form state (only for own profile) ──
  const [form, setForm] = useState({
    mainGame: profile.mainGame ?? "",
    gameRole: profile.gameRole ?? "",
    elo: profile.elo ?? "",
    competitiveRegion: profile.competitiveRegion ?? "",
    gameId: profile.gameId ?? "",
    competitiveScore: profile.competitiveScore ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [uploadingCard, setUploadingCard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync form when profile changes
  useEffect(() => {
    setForm({
      mainGame: profile.mainGame ?? "",
      gameRole: profile.gameRole ?? "",
      elo: profile.elo ?? "",
      competitiveRegion: profile.competitiveRegion ?? "",
      gameId: profile.gameId ?? "",
      competitiveScore: profile.competitiveScore ?? 0,
    });
  }, [profile.id]);

  const updateMutation = trpc.profile.updateMine.useMutation({
    onSuccess: () => {
      toast.success("Perfil competitivo actualizado");
      setSaving(false);
      utils.profile.getWithStats.invalidate({ userId: profile.id });
    },
    onError: (e) => { toast.error(e.message); setSaving(false); },
  });

  const uploadCardMutation = trpc.profile.uploadRosterCard.useMutation({
    onSuccess: ({ url }) => {
      setCardUrl(url);
      toast.success("Ficha competitiva generada");
      setUploadingCard(false);
      utils.profile.getWithStats.invalidate({ userId: profile.id });
    },
    onError: (e) => { toast.error(e.message); setUploadingCard(false); },
  });

  const { data: hasApproved } = trpc.profile.hasApprovedTeam.useQuery(
    undefined,
    { enabled: isOwnProfile }
  );

  const handleSave = () => {
    setSaving(true);
    updateMutation.mutate({
      mainGame: form.mainGame || undefined,
      gameRole: form.gameRole || undefined,
      elo: form.elo || undefined,
      competitiveRegion: form.competitiveRegion || undefined,
      gameId: form.gameId || null,
      competitiveScore: form.competitiveScore || null,
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imágenes"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("La imagen no puede superar 10MB"); return; }
    setUploadingCard(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";
      await uploadCardMutation.mutateAsync({ base64, mimeType });
    };
    reader.readAsDataURL(file);
  };

  // Resolve displayed card URL
  const displayCardUrl = cardUrl ?? profile.rosterImageUrl ?? profile.rosterPhoto;

  // Resolve role label with icon
  const gameSlug = GAME_SLUG_MAP[form.mainGame] ?? null;
  const roles = getRolesForGame(gameSlug);
  const roleData = roles.find((r) => r.value === form.gameRole);
  const ranks = getRanksForGame(gameSlug);
  const rankData = ranks.find((r) => r.value === form.elo);
  // View-only: resolve from profile
  const viewGameSlug = GAME_SLUG_MAP[profile.mainGame ?? ""] ?? null;
  const viewRoles = getRolesForGame(viewGameSlug);
  const viewRoleData = viewRoles.find((r) => r.value === profile.gameRole);
  const viewRanks = getRanksForGame(viewGameSlug);
  const viewRankData = viewRanks.find((r) => r.value === (profile as { elo?: string | null }).elo);

  const inputClass = "w-full bg-card/80 border border-red-700/50 rounded-full px-4 py-2.5 text-white text-sm font-mono tracking-wide focus:outline-none focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] transition-all duration-200 placeholder-white/30";
  const labelClass = "block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest";

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
          <span className="font-orbitron text-sm tracking-widest text-secondary-foreground uppercase">Perfil Competitivo</span>
        </div>
        {isOwnProfile && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all"
            style={{ background: "oklch(0.55 0.22 25)", color: "var(--text-primary)", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "GUARDANDO..." : "GUARDAR"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Roster Card ── */}
        <div className="flex flex-col items-center gap-4">
          {/* Card preview */}
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: "180px",
              aspectRatio: "2/3",
              border: "2px solid oklch(0.55 0.22 25 / 0.5)",
              boxShadow: "0 0 30px oklch(0.55 0.22 25 / 0.15)",
            }}
          >
            {displayCardUrl ? (
              <img src={displayCardUrl} alt="Roster card" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-3"
                style={{ background: "linear-gradient(180deg, oklch(0.12 0.01 0) 0%, oklch(0.08 0.005 0) 100%)" }}
              >
                <Shield className="w-10 h-10" style={{ color: "oklch(0.30 0.01 0)" }} />
                <span className="text-xs font-mono text-center px-3" style={{ color: "oklch(0.35 0.005 0)" }}>Sin ficha generada</span>
              </div>
            )}
            {/* Role info shown in right panel — no overlay on the photo */}
          </div>

          {/* Upload button (own profile + has team) */}
          {isOwnProfile && (
            <>
              {hasApproved?.canUpload ? (
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={uploadingCard}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all w-full justify-center"
                  style={{
                    background: uploadingCard ? "oklch(0.18 0.01 0)" : "oklch(0.14 0.01 0)",
                    border: "1px solid oklch(0.55 0.22 25 / 0.4)",
                    color: "oklch(0.65 0.22 25)",
                  }}
                >
                  {uploadingCard ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  {uploadingCard ? "GENERANDO..." : displayCardUrl ? "ACTUALIZAR FOTO" : "SUBIR FOTO"}
                </button>
              ) : (
                <div
                  className="flex items-start gap-2 px-3 py-2.5 rounded-lg w-full"
                  style={{ background: "var(--bg-card)", border: "1px solid oklch(0.20 0.01 0)" }}
                >
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "oklch(0.40 0.005 0)" }} />
                  <p className="text-xs font-mono" style={{ color: "oklch(0.45 0.005 0)" }}>
                    Debes pertenecer a un equipo para generar tu ficha.
                  </p>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <p className="text-[10px] font-mono text-muted-foreground text-center">
                Tu foto se recorta a 2:3 automáticamente.<br />El sistema añade nick, rol y logo del equipo.
              </p>
            </>
          )}
        </div>

        {/* ── Right: Competitive fields ── */}
        <div className="lg:col-span-2 space-y-5">
          {isOwnProfile ? (
            /* ── Edit mode ── */
            <>
              {/* Game + Role */}
              <div
                className="rounded-xl p-4 space-y-4"
                style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
              >
                <h3 className="font-orbitron text-xs tracking-widest text-muted-foreground flex items-center gap-2">
                  <Gamepad2 className="w-3.5 h-3.5" /> JUEGO Y ROL
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>JUEGO PRINCIPAL</label>
                    <GameDropdown
                      options={GAMES.map((g): DropdownOption => ({ value: g, label: g }))}
                      value={form.mainGame}
                      onChange={(v) => setForm((f) => ({ ...f, mainGame: v, gameRole: "", elo: "" }))}
                      placeholder="Seleccionar juego"
                      ariaLabel="Seleccionar juego principal"
                      minPanelWidth="220px"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ROL PRINCIPAL</label>
                    <RoleSelector
                      roles={roles}
                      value={form.gameRole}
                      onChange={(v) => setForm((f) => ({ ...f, gameRole: v }))}
                      disabled={!form.mainGame}
                      placeholder={form.mainGame ? "Seleccionar rol" : "Elige un juego primero"}
                    />
                  </div>
                </div>
              </div>

              {/* Rank + Region + GameID + Score */}
              <div
                className="rounded-xl p-4 space-y-4"
                style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
              >
                <h3 className="font-orbitron text-xs tracking-widest text-muted-foreground flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-white" /> RANGO Y ESTADÍSTICAS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>ELO / RANGO</label>
                    <RankSelector
                      ranks={ranks}
                      value={form.elo}
                      onChange={(v) => setForm((f) => ({ ...f, elo: v }))}
                      disabled={!form.mainGame}
                      placeholder={form.mainGame ? "Seleccionar rango" : "Elige un juego primero"}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>REGIÓN COMPETITIVA</label>
                    <GameDropdown
                      options={COMPETITIVE_REGIONS.map((r): DropdownOption => ({
                        value: r.value,
                        label: r.value,
                        hint: r.label.replace(`${r.value} — `, ""),
                      }))}
                      value={form.competitiveRegion}
                      onChange={(v) => setForm((f) => ({ ...f, competitiveRegion: v }))}
                      placeholder="Seleccionar región"
                      ariaLabel="Seleccionar región competitiva"
                      minPanelWidth="220px"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ID EN EL JUEGO</label>
                    <input
                      type="text"
                      value={form.gameId}
                      onChange={(e) => setForm((f) => ({ ...f, gameId: e.target.value }))}
                      placeholder="Ej: SummonerName#EUW"
                      maxLength={128}
                      className={inputClass}
                    />
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">Tu nombre de usuario en el juego</p>
                  </div>
                  <div>
                    <label className={labelClass}>PUNTAJE COMPETITIVO</label>
                    <div
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/40 border border-white/8 text-sm font-mono tracking-wide text-white/40 cursor-not-allowed select-none"
                    >
                      <Trophy className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                      <span>{form.competitiveScore > 0 ? `${form.competitiveScore.toLocaleString()} pts` : "Auto-calculado"}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">Puntos RLC acumulados en torneos</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── View mode ── */
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
            >
              {/* Role badge — source of truth, no duplicate text */}
              {profile.gameRole && (
                <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid oklch(0.15 0.005 0)" }}>
                  {viewRoleData ? (
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-mono font-bold"
                      style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.35)", color: "oklch(0.80 0.15 25)" }}
                    >
                      {viewRoleData.svgPath ? (
                        <img src={viewRoleData.svgPath} alt={viewRoleData.label} className="w-5 h-5 object-contain" style={{ filter: "invert(1)" }} />
                      ) : null}
                      {viewRoleData.label}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-mono font-bold"
                      style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.35)", color: "oklch(0.80 0.15 25)" }}
                    >
                      <Gamepad2 className="w-4 h-4" /> {profile.gameRole}
                    </span>
                  )}
                  {profile.mainGame && (
                    <span className="text-sm text-muted-foreground font-mono">{profile.mainGame}</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {(profile as { elo?: string | null }).elo && (
                  <div>
                    <p className="text-muted-foreground text-xs font-mono uppercase tracking-wider mb-1.5">ELO / Rango</p>
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-bold"
                      style={viewRankData
                        ? { background: `${viewRankData.color}22`, border: `1px solid ${viewRankData.color}55`, color: viewRankData.color }
                        : { background: "oklch(0.65 0.18 80 / 0.15)", border: "1px solid oklch(0.65 0.18 80 / 0.3)", color: "oklch(0.75 0.18 80)" }
                      }
                    >
                      {viewRankData && (
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: viewRankData.color }} />
                      )}
                      {viewRankData?.label ?? (profile as { elo?: string | null }).elo}
                    </span>
                  </div>
                )}
                {profile.competitiveRegion && (
                  <div>
                    <p className="text-muted-foreground text-xs font-mono uppercase tracking-wider mb-1.5">Región</p>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold"
                      style={{ background: "oklch(0.45 0.15 220 / 0.15)", border: "1px solid oklch(0.45 0.15 220 / 0.3)", color: "oklch(0.70 0.15 220)" }}
                    >
                      <Globe className="w-4 h-4" /> {profile.competitiveRegion}
                    </span>
                  </div>
                )}
                {profile.gameId && (
                  <div>
                    <p className="text-muted-foreground text-xs font-mono uppercase tracking-wider mb-1.5">ID en el juego</p>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono"
                      style={{ background: "var(--bg-hover)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.70 0.005 0)" }}
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-white" /> {profile.gameId}
                    </span>
                  </div>
                )}
                {(profile.competitiveScore ?? 0) > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs font-mono uppercase tracking-wider mb-1.5">Puntaje RLC</p>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold"
                      style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.3)", color: "oklch(0.65 0.22 25)" }}
                    >
                      <Trophy className="w-4 h-4" /> {profile.competitiveScore?.toLocaleString()} pts
                    </span>
                  </div>
                )}
              </div>

              {/* Empty state */}
              {!profile.gameRole && !profile.elo && !profile.gameId && (
                <div className="text-center py-8">
                  <Swords className="w-8 h-8 mx-auto mb-2" style={{ color: "oklch(0.25 0.01 0)" }} />
                  <p className="text-xs font-mono" style={{ color: "oklch(0.35 0.005 0)" }}>
                    Este jugador aún no ha configurado su perfil competitivo.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
