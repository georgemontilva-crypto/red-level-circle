import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  User, Trophy, Gamepad2, Twitter, MessageSquare, Tv2,
  Settings, Crown, Swords, Shield, Calendar, Users, UserPlus, UserMinus,
  Loader2, BadgeCheck,
} from "lucide-react";
import { useParams, Link, useSearch } from "wouter";
import { useState, useEffect } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";

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
  const tabParam = new URLSearchParams(searchString).get("tab") as "overview" | "cosmetics" | "followers" | "following" | null;
  const [activeTab, setActiveTab] = useState<"overview" | "cosmetics" | "followers" | "following">(tabParam ?? "overview");
  useEffect(() => {
    if (tabParam && ["overview", "cosmetics", "followers", "following"].includes(tabParam)) {
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
          <div className="flex items-end justify-between mb-3" style={{ marginTop: "-48px" }}>
            <div className="relative inline-block" style={{ zIndex: 10 }}>
              {equippedAura && (
                <div
                  className="absolute inset-0 rounded-full blur-xl opacity-70 scale-150 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${equippedAura.frameImage ?? "#ff0000"} 0%, transparent 70%)` }}
                />
              )}
              {equippedFrame?.frameImage && (
                <img
                  src={equippedFrame.frameImage}
                  alt="Frame"
                  className="absolute z-10 pointer-events-none"
                  style={{ width: "112px", height: "112px", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                />
              )}
              <div
                className="relative z-0"
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  border: "4px solid oklch(0.10 0.005 0)",
                  boxShadow: "0 0 0 2px oklch(0.55 0.22 25 / 0.6)",
                  overflow: "hidden",
                }}
              >
                <UserAvatar avatar={profile.avatar} name={profile.name} size={88} />
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
        <div className="flex border-b" style={{ borderColor: "oklch(0.18 0.01 0)" }}>
          {(["overview", "cosmetics", "followers", "following"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-xs font-mono tracking-wider transition-all duration-200 relative"
              style={{ color: activeTab === tab ? "oklch(0.65 0.22 25)" : "oklch(0.50 0.005 0)" }}
            >
              {tab === "overview" && "PERFIL"}
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
