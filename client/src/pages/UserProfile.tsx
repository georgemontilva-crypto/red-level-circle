import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  User, Trophy, Gamepad2, Twitter, MessageSquare, Tv2,
  Settings, Crown, Swords, Shield, Calendar, Users, UserPlus, UserMinus,
  Loader2, BadgeCheck, Camera, Save, Star,
} from "lucide-react";
import { useParams, Link, useSearch } from "wouter";
import { useState, useEffect, useRef } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { getRolesForGame, COMPETITIVE_REGIONS } from "../../../shared/gameRoles";

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
  if (type === "team_captain") return <Crown className="w-3.5 h-3.5 text-yellow-400" />;
  if (type === "event_creator") return <Swords className="w-3.5 h-3.5 text-red-400" />;
  return <Shield className="w-3.5 h-3.5 text-blue-400" />;
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
      toast.success("¡Ahora sigues a este usuario!");
    },
    onError: (e) => toast.error(e.message),
  });

  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => {
      utils.profile.getWithStats.invalidate({ userId });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-500 font-mono">Perfil no encontrado</p>
      </div>
    );
  }

  const equippedFrame = profile.equippedCosmetics?.find((c) => c.type === "frame" && c.isEquipped);
  const equippedAura = profile.equippedCosmetics?.find((c) => c.type === "aura" && c.isEquipped);
  const isFollowing = profile.isFollowing;
  const followLoading = followMutation.isPending || unfollowMutation.isPending;

  return (
    <div className="w-full overflow-x-hidden">
      {/* ── Banner + Avatar (Discord-style) ── */}
      {/* Outer wrapper: relative so avatar can be absolutely positioned at the bottom edge */}
      <div className="relative max-w-5xl mx-auto">
        {/* Banner */}
        <div
          className="w-full h-40 sm:h-56 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a0000 0%, #2d0000 50%, #0a0000 100%)", position: "relative" }}
        >
          {profile.bannerUrl ? (
            <img
              src={profile.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
              <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-transparent to-red-900/20" />
            </>
          )}
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
                  ? { background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }
                  : { background: "oklch(0.55 0.22 25)", color: "#fff" }
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

        {/* Card body — avatar sits at the top-left, overlapping the banner above */}
        <div
          className="pb-4 px-4 sm:px-6"
          style={{ background: "oklch(0.10 0.005 0)", borderBottom: "1px solid oklch(0.18 0.01 0)", paddingTop: "16px" }}
        >
          {/* Avatar row — pulled up to overlap the banner */}
          <div className="flex items-end justify-between mb-3" style={{ marginTop: "-72px" }}>
            <div className="relative inline-block" style={{ zIndex: 10 }}>
              {equippedAura && (
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-60 scale-150 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${equippedAura.frameImage ?? "#ff0000"} 0%, transparent 70%)` }}
                />
              )}
              {equippedFrame?.frameImage && (
                <img
                  src={equippedFrame.frameImage}
                  alt="Frame"
                  className="absolute z-10 pointer-events-none"
                  style={{ width: "160px", height: "160px", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                />
              )}
              <div
                className="relative z-0"
                style={{
                  width: "128px",
                  height: "128px",
                  borderRadius: "50%",
                  border: "4px solid oklch(0.10 0.005 0)",
                  boxShadow: "0 0 0 2px oklch(0.55 0.22 25 / 0.6), 0 4px 24px rgba(0,0,0,0.5)",
                  overflow: "hidden",
                }}
              >
                <UserAvatar avatar={profile.avatar} name={profile.name} size={128} />
              </div>
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
                    <span className="text-zinc-300">{PROFILE_TYPE_LABEL[profile.profileType] ?? profile.profileType}</span>
                  </div>
                )}
                {(profile as { isVerified?: boolean }).isVerified && (
                  <VerifiedBadge size={20} />
                )}
                {profile.role === "admin" && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">ADMIN</span>
                )}
                {profile.role === "premium" && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-red-500/15 text-red-400 border border-red-500/30">PREMIUM</span>
                )}
              </div>
              {/* Username / handle */}
              {profile.nickname && profile.name && (
                <p className="text-zinc-500 text-sm font-mono mt-0.5">@{profile.name}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-3 text-zinc-300 text-sm leading-relaxed">{profile.bio}</p>
          )}

          {/* Meta info row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-zinc-500">
            {profile.mainGame && (
              <span className="flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5 text-red-500" />
                {profile.mainGame}
              </span>
            )}
            {(profile as { gameRole?: string | null }).gameRole && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "oklch(0.55 0.22 25 / 0.12)", border: "1px solid oklch(0.55 0.22 25 / 0.25)", color: "oklch(0.75 0.15 25)" }}>
                🎮 {(profile as { gameRole?: string | null }).gameRole}
              </span>
            )}
            {(profile as { elo?: string | null }).elo && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "oklch(0.65 0.18 80 / 0.12)", border: "1px solid oklch(0.65 0.18 80 / 0.25)", color: "oklch(0.75 0.18 80)" }}>
                ⚡ {(profile as { elo?: string | null }).elo}
              </span>
            )}
            {(profile as { competitiveRegion?: string | null }).competitiveRegion && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "oklch(0.45 0.15 220 / 0.12)", border: "1px solid oklch(0.45 0.15 220 / 0.25)", color: "oklch(0.70 0.15 220)" }}>
                🌐 {(profile as { competitiveRegion?: string | null }).competitiveRegion}
              </span>
            )}
            {profile.country && (
              <span className="flex items-center gap-1">🌍 {profile.country}</span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Desde {new Date(profile.createdAt).toLocaleDateString("es", { year: "numeric", month: "long" })}
            </span>
          </div>

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
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mt-4 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Tab bar */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: "oklch(0.18 0.01 0)" }}>
          {(["overview", "roster", "cosmetics", "followers", "following"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-xs font-mono tracking-wider transition-all duration-200 relative whitespace-nowrap flex items-center gap-1.5"
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
        <div className="mt-4 space-y-4">
          {/* Overview tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "RLC Coins", value: profile.rlcBalance ?? 0, icon: "🪙" },
                  { label: "Seguidores", value: profile.followerCount ?? 0, icon: "👥" },
                  { label: "Siguiendo", value: profile.followingCount ?? 0, icon: "➕" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl p-4 text-center"
                    style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
                  >
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="font-mono font-bold text-white text-lg">{stat.value.toLocaleString()}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Team memberships */}
              {teamMemberships && teamMemberships.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}>
                  <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid oklch(0.15 0.005 0)" }}>
                    <Shield className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
                    <span className="text-xs font-display tracking-wider text-foreground">EQUIPOS</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: "oklch(0.15 0.005 0)" }}>
                    {teamMemberships.map((m: any) => (
                      <Link key={m.teamId} href={`/teams/${m.teamId}`}>
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                          {m.teamLogo ? (
                            <img src={m.teamLogo} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" style={{ border: "1px solid oklch(0.55 0.22 25 / 0.3)" }} />
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "oklch(0.13 0.005 0)", border: "1px solid oklch(0.22 0.01 0)" }}>
                              <Shield size={16} style={{ color: "oklch(0.55 0.22 25)" }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{m.teamName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {m.teamGame && <span className="text-xs text-muted-foreground">{m.teamGame}</span>}
                              <span
                                className="text-xs font-display tracking-wider px-1.5 py-0.5 rounded"
                                style={m.role === "captain"
                                  ? { background: "oklch(0.65 0.18 80 / 0.15)", color: "oklch(0.65 0.18 80)" }
                                  : { background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }
                                }
                              >
                                {m.role === "captain" ? "Capitán" : m.role === "substitute" ? "Suplente" : m.role === "coach" ? "Coach" : "Jugador"}
                              </span>
                            </div>
                          </div>
                          {m.teamTag && (
                            <span className="text-xs font-mono shrink-0" style={{ color: "oklch(0.50 0.005 0)" }}>[{m.teamTag}]</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Ficha de jugador competitivo */}
              {((profile as any).rosterImageUrl || (profile as any).rosterPhoto || (profile as any).gameRole || (profile as any).elo || (profile as any).competitiveRegion) && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "oklch(0.09 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
                >
                  <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid oklch(0.15 0.005 0)" }}>
                    <Swords className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
                    <span className="text-xs font-mono tracking-wider text-zinc-400 uppercase">Ficha Competitiva</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 p-4">
                    {/* Roster card generada (600x900) con fallback a foto anterior */}
                    {((profile as any).rosterImageUrl || (profile as any).rosterPhoto) && (
                      <div
                        className="shrink-0 rounded-xl overflow-hidden"
                        style={{
                          width: "120px",
                          aspectRatio: "2/3",
                          border: "2px solid oklch(0.55 0.22 25 / 0.4)",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                        }}
                      >
                        <img
                          src={(profile as any).rosterImageUrl ?? (profile as any).rosterPhoto}
                          alt={`${profile.nickname ?? profile.name} roster`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {/* Datos competitivos */}
                    <div className="flex-1 space-y-3">
                      {(profile as any).gameRole && (
                        <div>
                          <p className="text-zinc-600 text-xs font-mono uppercase tracking-wider mb-1">Rol</p>
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold"
                            style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.3)", color: "oklch(0.75 0.15 25)" }}
                          >
                            🎮 {(profile as any).gameRole}
                          </span>
                        </div>
                      )}
                      {(profile as any).elo && (
                        <div>
                          <p className="text-zinc-600 text-xs font-mono uppercase tracking-wider mb-1">ELO / Rango</p>
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold"
                            style={{ background: "oklch(0.65 0.18 80 / 0.15)", border: "1px solid oklch(0.65 0.18 80 / 0.3)", color: "oklch(0.75 0.18 80)" }}
                          >
                            ⚡ {(profile as any).elo}
                          </span>
                        </div>
                      )}
                      {(profile as any).competitiveRegion && (
                        <div>
                          <p className="text-zinc-600 text-xs font-mono uppercase tracking-wider mb-1">Región</p>
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold"
                            style={{ background: "oklch(0.45 0.15 220 / 0.15)", border: "1px solid oklch(0.45 0.15 220 / 0.3)", color: "oklch(0.70 0.15 220)" }}
                          >
                            🌐 {(profile as any).competitiveRegion}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* No activity placeholder */}
              <div
                className="rounded-xl p-6 text-center"
                style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
              >
                <Trophy className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm font-mono">Historial de torneos próximamente</p>
              </div>
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
                    style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
                  >
                    <span className="text-4xl mb-3 block">🎨</span>
                    <p className="text-zinc-500 font-mono text-sm">No tienes cosméticos aún</p>
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
                            background: "oklch(0.10 0.005 0)",
                            outline: c.isEquipped ? `1px solid ${rarityColor[rarity]}` : `1px solid oklch(0.18 0.01 0)`,
                            outlineOffset: "0px",
                          }}
                        >
                          <div className="w-full aspect-square overflow-hidden rounded-t-lg bg-zinc-900">
                            {(c as any).previewImage ? (
                              <img src={(c as any).previewImage} alt={(c as any).name ?? ""} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl">🎨</span>
                              </div>
                            )}
                          </div>
                          <div className="p-2 text-center">
                            <p className="text-xs font-semibold text-zinc-200 truncate font-rajdhani">{(c as any).name}</p>
                            <p className="text-[10px] font-mono capitalize mt-0.5" style={{ color: rarityColor[rarity] }}>{rarityLabel[rarity]}</p>
                            {c.isEquipped ? (
                              <span className="mt-1 inline-block text-[10px] text-green-400 font-mono">✓ Equipado</span>
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
                    style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
                  >
                    <span className="text-4xl mb-3 block">🎨</span>
                    <p className="text-zinc-500 font-mono text-sm">Sin cosméticos equipados</p>
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
                            background: "oklch(0.10 0.005 0)",
                            outline: `1px solid ${rarityColor[rarity]}`,
                            outlineOffset: "0px",
                          }}
                        >
                          <div className="w-full aspect-square overflow-hidden rounded-t-lg bg-zinc-900">
                            {c.previewImage ? (
                              <img src={c.previewImage} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl">🎨</span>
                              </div>
                            )}
                          </div>
                          <div className="p-2 text-center">
                            <p className="text-xs font-semibold text-zinc-200 truncate font-rajdhani">{c.name}</p>
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
        style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
      >
        <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
        <p className="text-zinc-500 font-mono text-sm">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {users.map((u) => (
        <Link key={u.id} href={`/profile/${u.id}`}>
          <div
            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer"
            style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
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
                <p className="text-xs text-zinc-500 font-mono capitalize">
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

  // View-only: resolve from profile
  const viewGameSlug = GAME_SLUG_MAP[profile.mainGame ?? ""] ?? null;
  const viewRoles = getRolesForGame(viewGameSlug);
  const viewRoleData = viewRoles.find((r) => r.value === profile.gameRole);

  const inputClass = "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-zinc-600";
  const labelClass = "block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest";

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
          <span className="font-orbitron text-sm tracking-widest text-zinc-300 uppercase">Perfil Competitivo</span>
        </div>
        {isOwnProfile && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all"
            style={{ background: "oklch(0.55 0.22 25)", color: "#fff", opacity: saving ? 0.6 : 1 }}
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
            {/* Role badge overlay */}
            {(isOwnProfile ? roleData : viewRoleData) && (
              <div
                className="absolute bottom-0 left-0 right-0 px-2 py-1.5 flex items-center justify-center gap-1"
                style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
              >
                <span className="text-sm">{(isOwnProfile ? roleData : viewRoleData)?.icon}</span>
                <span className="text-xs font-mono font-bold text-white">{(isOwnProfile ? roleData : viewRoleData)?.label}</span>
              </div>
            )}
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
                  style={{ background: "oklch(0.12 0.005 0)", border: "1px solid oklch(0.20 0.01 0)" }}
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
              <p className="text-[10px] font-mono text-zinc-600 text-center">
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
                style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
              >
                <h3 className="font-orbitron text-xs tracking-widest text-zinc-500 flex items-center gap-2">
                  <Gamepad2 className="w-3.5 h-3.5" /> JUEGO Y ROL
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>JUEGO PRINCIPAL</label>
                    <select
                      value={form.mainGame}
                      onChange={(e) => setForm((f) => ({ ...f, mainGame: e.target.value, gameRole: "" }))}
                      className={inputClass}
                    >
                      <option value="">Seleccionar juego</option>
                      {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>ROL PRINCIPAL</label>
                    <select
                      value={form.gameRole}
                      onChange={(e) => setForm((f) => ({ ...f, gameRole: e.target.value }))}
                      disabled={!form.mainGame}
                      className={inputClass + (form.mainGame ? "" : " opacity-40")}
                    >
                      <option value="">{form.mainGame ? "Seleccionar rol" : "Elige un juego primero"}</option>
                      {getRolesForGame(GAME_SLUG_MAP[form.mainGame] ?? null).map((r) => (
                        <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
                      ))}
                    </select>
                    {/* Role badge preview */}
                    {roleData && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                          style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.3)", color: "oklch(0.75 0.15 25)" }}
                        >
                          {roleData.icon} {roleData.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rank + Region + GameID + Score */}
              <div
                className="rounded-xl p-4 space-y-4"
                style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
              >
                <h3 className="font-orbitron text-xs tracking-widest text-zinc-500 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5" /> RANGO Y ESTADÍSTICAS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>ELO / RANGO</label>
                    <input
                      type="text"
                      value={form.elo}
                      onChange={(e) => setForm((f) => ({ ...f, elo: e.target.value }))}
                      placeholder="Ej: Diamond II, Radiant..."
                      maxLength={64}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>REGIÓN COMPETITIVA</label>
                    <select
                      value={form.competitiveRegion}
                      onChange={(e) => setForm((f) => ({ ...f, competitiveRegion: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="">Seleccionar región</option>
                      {COMPETITIVE_REGIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
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
                    <p className="text-[10px] text-zinc-600 font-mono mt-1">Tu nombre de usuario en el juego</p>
                  </div>
                  <div>
                    <label className={labelClass}>PUNTAJE COMPETITIVO</label>
                    <input
                      type="number"
                      value={form.competitiveScore || ""}
                      onChange={(e) => setForm((f) => ({ ...f, competitiveScore: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      min={0}
                      max={99999}
                      className={inputClass}
                    />
                    <p className="text-[10px] text-zinc-600 font-mono mt-1">Puntos RLC acumulados en torneos</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── View mode ── */
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
            >
              {/* Role badge — source of truth, no duplicate text */}
              {profile.gameRole && (
                <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid oklch(0.15 0.005 0)" }}>
                  {viewRoleData ? (
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-mono font-bold"
                      style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.35)", color: "oklch(0.80 0.15 25)" }}
                    >
                      <span className="text-xl">{viewRoleData.icon}</span>
                      {viewRoleData.label}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-mono font-bold"
                      style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.35)", color: "oklch(0.80 0.15 25)" }}
                    >
                      🎮 {profile.gameRole}
                    </span>
                  )}
                  {profile.mainGame && (
                    <span className="text-sm text-zinc-400 font-mono">{profile.mainGame}</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {profile.elo && (
                  <div>
                    <p className="text-zinc-600 text-xs font-mono uppercase tracking-wider mb-1.5">ELO / Rango</p>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold"
                      style={{ background: "oklch(0.65 0.18 80 / 0.15)", border: "1px solid oklch(0.65 0.18 80 / 0.3)", color: "oklch(0.75 0.18 80)" }}
                    >
                      ⚡ {profile.elo}
                    </span>
                  </div>
                )}
                {profile.competitiveRegion && (
                  <div>
                    <p className="text-zinc-600 text-xs font-mono uppercase tracking-wider mb-1.5">Región</p>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold"
                      style={{ background: "oklch(0.45 0.15 220 / 0.15)", border: "1px solid oklch(0.45 0.15 220 / 0.3)", color: "oklch(0.70 0.15 220)" }}
                    >
                      🌐 {profile.competitiveRegion}
                    </span>
                  </div>
                )}
                {profile.gameId && (
                  <div>
                    <p className="text-zinc-600 text-xs font-mono uppercase tracking-wider mb-1.5">ID en el juego</p>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono"
                      style={{ background: "oklch(0.14 0.005 0)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.70 0.005 0)" }}
                    >
                      🎮 {profile.gameId}
                    </span>
                  </div>
                )}
                {(profile.competitiveScore ?? 0) > 0 && (
                  <div>
                    <p className="text-zinc-600 text-xs font-mono uppercase tracking-wider mb-1.5">Puntaje RLC</p>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold"
                      style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.3)", color: "oklch(0.65 0.22 25)" }}
                    >
                      🏆 {profile.competitiveScore?.toLocaleString()} pts
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
