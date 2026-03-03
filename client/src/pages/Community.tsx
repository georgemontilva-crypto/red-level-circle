import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Search, Users, Crown, Swords, Shield,
  UserPlus, UserMinus, Loader2, MapPin, Check,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { SectionBanner } from "@/components/SectionBanner";
import { DefaultBannerBg } from "@/components/DefaultBannerBg";
import { Button } from "@/components/ui/button";

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
  const displayName = user.nickname ?? user.name ?? "Usuario";
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const subtitle = user.profileType
    ? (PROFILE_TYPE_LABEL[user.profileType] ?? user.profileType)
    : "Jugador";

  return (
    <div className="w-full bg-black rounded-3xl shadow-2xl">
      {/* Banner Section */}
      <div className="relative h-48 w-full overflow-hidden rounded-3xl">
        {user.bannerUrl ? (
          <img
            src={user.bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <DefaultBannerBg />
        )}
      </div>
      {/* Avatar Section - Overlapping */}
      <div className="relative px-6 pb-6">
        {/* Avatar Circle */}
        <div className="flex justify-center -mt-20 mb-4">
          <div className="w-32 h-32 bg-gray-400 rounded-full border-4 border-black shadow-lg overflow-hidden flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-gray-600 select-none">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
        {/* Name and Description */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            {user.isVerified && <Check className="w-5 h-5 text-blue-500 fill-blue-500" />}
          </div>
          <p className="text-sm text-gray-400">
            {subtitle}{user.country ? ` · ${user.country}` : ""}
          </p>
        </div>
        {/* Follow Button */}
        {me && myId !== user.id ? (
          <Button
            onClick={() => isFollowing
              ? unfollowMutation.mutate({ userId: user.id })
              : followMutation.mutate({ userId: user.id })
            }
            disabled={mutating || followLoading}
            className="w-full bg-gray-300 hover:bg-gray-200 text-black font-semibold py-2 rounded-full transition-colors"
          >
            {mutating || followLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? "Siguiendo" : "Seguir"}
          </Button>
        ) : (
          <Link href={`/profile/${user.id}`}>
            <Button className="w-full bg-gray-300 hover:bg-gray-200 text-black font-semibold py-2 rounded-full transition-colors">
              Ver perfil
            </Button>
          </Link>
        )}
      </div>
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nombre o nickname..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-mono text-white placeholder-zinc-500 focus:outline-none transition-colors bg-zinc-900/80 border border-white/10 focus:border-red-500/60"
          />
        </div>

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
      <div className="flex items-center gap-2 mb-4 text-xs text-zinc-500 font-mono">
        <Users className="w-3.5 h-3.5" />
        <span>{filtered?.length ?? 0} usuarios encontrados</span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#111111] border border-white/[0.06] overflow-hidden animate-pulse">
              <div className="bg-zinc-800/60" style={{ height: "160px" }} />
              <div className="p-4 pt-10 space-y-3">
                <div className="h-4 bg-zinc-800/60 rounded w-2/3 mx-auto" />
                <div className="h-3 bg-zinc-800/60 rounded w-1/2 mx-auto" />
                <div className="h-9 bg-zinc-800/60 rounded-xl mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center bg-[#111111] border border-white/[0.06]">
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 font-mono text-sm">No se encontraron usuarios</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((user) => (
            <UserCard key={user.id} user={user} myId={me?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
