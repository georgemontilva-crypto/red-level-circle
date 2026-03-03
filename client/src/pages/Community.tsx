import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Search, Users, Crown, Swords, Shield,
  UserPlus, UserMinus, Loader2, Gamepad2, MapPin,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { SectionBanner } from "@/components/SectionBanner";

const PROFILE_TYPE_LABEL: Record<string, string> = {
  player: "Jugador",
  team_captain: "Capitán",
  event_creator: "Creador",
};

const PROFILE_TYPE_FILTER = [
  { value: "", label: "Todos" },
  { value: "player", label: "Jugadores" },
  { value: "team_captain", label: "Capitanes" },
  { value: "event_creator", label: "Creadores" },
];

function ProfileTypeIcon({ type }: { type: string | null }) {
  if (type === "team_captain") return <Crown className="w-3.5 h-3.5 text-yellow-400" />;
  if (type === "event_creator") return <Swords className="w-3.5 h-3.5 text-red-400" />;
  return <Shield className="w-3.5 h-3.5 text-blue-400" />;
}

interface UserCardProps {
  user: {
    id: number;
    name: string | null;
    nickname: string | null;
    avatar: string | null;
    bannerUrl: string | null;
    bio: string | null;
    profileType: string | null;
    mainGame: string | null;
    country: string | null;
    role: string;
    activeFrameImage?: string | null;
    isVerified?: boolean | null;
  };
  myId?: number;
}

function UserCard({ user, myId }: UserCardProps) {
  const utils = trpc.useUtils();
  const { user: me } = useAuth();

  const { data: followData, isLoading: followLoading } = trpc.follows.isFollowing.useQuery(
    { followerId: myId ?? 0, followingId: user.id },
    { enabled: !!myId && myId !== user.id }
  );

  const followMutation = trpc.follows.follow.useMutation({
    onSuccess: () => {
      utils.follows.isFollowing.invalidate({ followerId: myId!, followingId: user.id });
      toast.success(`¡Ahora sigues a ${user.nickname ?? user.name}!`);
    },
    onError: (e) => toast.error(e.message),
  });

  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => {
      utils.follows.isFollowing.invalidate({ followerId: myId!, followingId: user.id });
      toast.success(`Dejaste de seguir a ${user.nickname ?? user.name}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const isFollowing = followData ?? false;
  const mutating = followMutation.isPending || unfollowMutation.isPending;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer"
      style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0.4)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
    >
      <Link href={`/profile/${user.id}`}>
        {/* Banner — 16:9 ratio */}
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <div className="absolute inset-0">
            {user.bannerUrl ? (
              <img src={user.bannerUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full"
                style={{ background: "linear-gradient(135deg, oklch(0.16 0.03 25) 0%, oklch(0.09 0.005 0) 100%)" }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>
        </div>

        {/* Card body */}
        <div className="px-3 pb-3">
          {/* Avatar overlapping banner */}
          <div className="relative -mt-6 mb-2">
            <div
              className="rounded-full inline-block"
              style={{ border: "2px solid oklch(0.10 0.005 0)", boxShadow: "0 0 0 1px oklch(0.55 0.22 25 / 0.4)" }}
            >
              <UserAvatar
                avatar={user.avatar}
                name={user.name ?? user.nickname}
                activeFrameImage={user.activeFrameImage}
                size={44}
              />
            </div>
          </div>

          {/* Name */}
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="font-orbitron font-bold text-sm text-white truncate leading-tight">
              {user.nickname ?? user.name ?? "Usuario"}
            </span>
            {user.isVerified && <VerifiedBadge size={14} />}
            {(user.role === "admin" || user.role === "super_admin") && (
              <span className="text-[10px] px-1 py-0.5 rounded font-mono bg-yellow-500/15 text-yellow-400">ADMIN</span>
            )}
          </div>

          {/* Profile type */}
          <div className="flex items-center gap-1">
            <ProfileTypeIcon type={user.profileType} />
            <span className="text-xs text-muted-foreground font-mono">
              {user.profileType ? (PROFILE_TYPE_LABEL[user.profileType] ?? user.profileType) : "Jugador"}
            </span>
            {user.country && (
              <span className="text-xs text-muted-foreground font-mono ml-auto flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />{user.country}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Follow button — bottom, outside Link */}
      {me && (
        <div className="px-3 pb-3 -mt-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              isFollowing
                ? unfollowMutation.mutate({ userId: user.id })
                : followMutation.mutate({ userId: user.id });
            }}
            disabled={mutating || followLoading}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200"
            style={isFollowing
              ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#aaa" }
              : { background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.4)", color: "oklch(0.65 0.22 25)" }
            }
          >
            {mutating || followLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isFollowing ? (
              <><UserMinus className="w-3 h-3" /> Siguiendo</>
            ) : (
              <><UserPlus className="w-3 h-3" /> Seguir</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Community() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => setDebouncedSearch(val), 400);
    setDebounceTimer(t);
  };

  const { data: users, isLoading } = trpc.community.listUsers.useQuery({
    search: debouncedSearch || undefined,
    limit: 60,
    offset: 0,
  });

  const filtered = (typeFilter
    ? users?.filter((u) => u.profileType === typeFilter)
    : users
  )?.filter((u) => u.id !== me?.id);

  return (
    <div className="py-6 overflow-x-hidden">
      {/* Banner */}
      <SectionBanner sectionKey="community" height="h-48 sm:h-64 lg:h-72" className="mb-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-widest text-red-400">Red Level Circle</span>
          <h1 className="font-orbitron font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight drop-shadow-lg">
            COMUNIDAD
          </h1>
        </div>
      </SectionBanner>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nombre o nickname..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-mono text-white placeholder-muted-foreground focus:outline-none transition-colors"
            style={{ background: "var(--bg-card)", border: "1px solid oklch(0.20 0.01 0)" }}
            onFocus={(e) => (e.target.style.borderColor = "oklch(0.55 0.22 25 / 0.6)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(0.20 0.01 0)")}
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-2 flex-wrap">
          {PROFILE_TYPE_FILTER.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className="px-3 py-2 rounded-xl text-xs font-mono tracking-wider transition-all duration-200"
              style={typeFilter === f.value
                ? { background: "oklch(0.55 0.22 25 / 0.2)", border: "1px solid oklch(0.55 0.22 25 / 0.5)", color: "oklch(0.65 0.22 25)" }
                : { background: "var(--bg-card)", border: "1px solid oklch(0.20 0.01 0)", color: "var(--text-muted)" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground font-mono">
        <Users className="w-3.5 h-3.5" />
        <span>{filtered?.length ?? 0} usuarios encontrados</span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
        >
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-muted-foreground font-mono text-sm">No se encontraron usuarios</p>
          {search && (
            <button
              onClick={() => { setSearch(""); setDebouncedSearch(""); }}
              className="mt-3 text-xs text-red-500 hover:text-red-400 font-mono transition-colors"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((user) => (
            <UserCard key={user.id} user={user} myId={me?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
