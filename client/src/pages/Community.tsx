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
  const isOwnCard = myId === user.id;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 group"
      style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0.35)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "oklch(0.18 0.01 0)")}
    >
      {/* Mini banner */}
      <div className="relative h-16 overflow-hidden">
        {user.bannerUrl ? (
          <img src={user.bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "linear-gradient(135deg, oklch(0.15 0.02 25) 0%, oklch(0.08 0.005 0) 100%)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Follow button — top right */}
        {!isOwnCard && me && (
          <button
            onClick={(e) => {
              e.preventDefault();
              isFollowing
                ? unfollowMutation.mutate({ userId: user.id })
                : followMutation.mutate({ userId: user.id });
            }}
            disabled={mutating || followLoading}
            className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all duration-200"
            style={isFollowing
              ? { background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "#ccc" }
              : { background: "oklch(0.55 0.22 25)", color: "var(--text-primary)" }
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
        )}
      </div>

      {/* Card body */}
      <Link href={`/profile/${user.id}`}>
        <div className="px-4 pb-4 cursor-pointer">
          {/* Avatar overlapping banner */}
          <div className="relative -mt-7 mb-3">
            <div
              className="rounded-full"
              style={{ border: "3px solid oklch(0.10 0.005 0)", boxShadow: "0 0 0 1.5px oklch(0.55 0.22 25 / 0.5)", display: "inline-block" }}
            >
              <UserAvatar
                avatar={user.avatar}
                name={user.name ?? user.nickname}
                activeFrameImage={user.activeFrameImage}
                size={56}
              />
            </div>
          </div>

          {/* Name + type */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-orbitron font-bold text-sm text-white truncate">
              {user.nickname ?? user.name ?? "Usuario"}
            </span>
            {user.isVerified && <VerifiedBadge size={16} />}
            {user.role === "admin" && (
              <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-yellow-500/15 text-yellow-400">ADMIN</span>
            )}
            {user.role === "premium" && (
              <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-red-500/15 text-red-400">PRO</span>
            )}
          </div>

          {/* Profile type badge */}
          {user.profileType && (
            <div className="flex items-center gap-1 mb-2">
              <ProfileTypeIcon type={user.profileType} />
              <span className="text-xs text-muted-foreground font-mono">
                {PROFILE_TYPE_LABEL[user.profileType] ?? user.profileType}
              </span>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">{user.bio}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {user.mainGame && (
              <span className="flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-red-600" />
                {user.mainGame}
              </span>
            )}
            {user.country && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{user.country}</span>}
          </div>
        </div>
      </Link>
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

  const filtered = typeFilter
    ? users?.filter((u) => u.profileType === typeFilter)
    : users;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-6 h-6 text-red-500" />
          <h1 className="font-orbitron font-black text-2xl text-white tracking-wider">COMUNIDAD</h1>
        </div>
        <p className="text-muted-foreground text-sm">Descubre jugadores, capitanes y creadores de la plataforma</p>
      </div>

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
            style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.20 0.01 0)" }}
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
                : { background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.20 0.01 0)", color: "oklch(0.50 0.005 0)" }
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
          style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user) => (
            <UserCard key={user.id} user={user} myId={me?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
