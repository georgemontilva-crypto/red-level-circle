import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  User, Trophy, Gamepad2, Twitter, MessageSquare, Tv2,
  Edit3, Coins, Star, Shield, Crown, Swords, Calendar
} from "lucide-react";
import { useParams, Link } from "wouter";
import { useState } from "react";

function RarityBadge({ rarity }: { rarity: string }) {
  const colors: Record<string, string> = {
    common: "text-gray-400 border-gray-600",
    rare: "text-blue-400 border-blue-600",
    epic: "text-purple-400 border-purple-600",
    legendary: "text-yellow-400 border-yellow-600",
  };
  return (
    <span className={`text-xs border px-2 py-0.5 rounded-full font-orbitron ${colors[rarity] ?? colors.common}`}>
      {rarity.toUpperCase()}
    </span>
  );
}

function ProfileTypeIcon({ type }: { type: string | null }) {
  if (type === "team_captain") return <Crown className="w-4 h-4 text-yellow-400" />;
  if (type === "event_creator") return <Swords className="w-4 h-4 text-red-400" />;
  return <Shield className="w-4 h-4 text-blue-400" />;
}

export default function UserProfile() {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id ?? "0");
  const { user: me } = useAuth();
  const isOwnProfile = me?.id === userId;

  const { data: profile, isLoading } = trpc.profile.getPublic.useQuery(
    { userId },
    { enabled: !!userId }
  );
  const { data: cosmetics } = trpc.profile.getEquippedCosmetics.useQuery(
    { userId },
    { enabled: !!userId }
  );
  const { data: teams } = trpc.teams.list.useQuery(undefined, { enabled: !!userId });

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nickname: "",
    bio: "",
    mainGame: "",
    country: "",
    socialDiscord: "",
    socialTwitch: "",
    socialTwitter: "",
  });

  const utils = trpc.useUtils();
  const updateProfile = trpc.profile.updateMine.useMutation({
    onSuccess: () => {
      toast.success("Perfil actualizado");
      setEditing(false);
      utils.profile.getPublic.invalidate({ userId });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 font-orbitron">Perfil no encontrado</p>
      </div>
    );
  }

  // Find equipped frame cosmetic
  const equippedFrame = cosmetics?.find(c => c.type === "frame" && c.isEquipped);
  const equippedAura = cosmetics?.find(c => c.type === "aura" && c.isEquipped);

  const handleEdit = () => {
    setForm({
      nickname: profile.nickname ?? "",
      bio: profile.bio ?? "",
      mainGame: profile.mainGame ?? "",
      country: profile.country ?? "",
      socialDiscord: profile.socialDiscord ?? "",
      socialTwitch: profile.socialTwitch ?? "",
      socialTwitter: profile.socialTwitter ?? "",
    });
    setEditing(true);
  };

  const handleSave = () => {
    const clean = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "")
    ) as typeof form;
    updateProfile.mutate(clean);
  };

  const profileTypeLabel: Record<string, string> = {
    player: "Jugador",
    team_captain: "Capitán de Equipo",
    event_creator: "Creador de Eventos",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden h-48 bg-gradient-to-r from-black via-red-950/40 to-black border border-red-900/30">
        {profile.bannerUrl ? (
          <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-950/30 via-black to-red-900/20" />
        )}
        {/* Neon overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Avatar + Info */}
      <div className="relative px-6 -mt-16">
        <div className="flex items-end gap-6">
          {/* Avatar with cosmetic frame */}
          <div className="relative flex-shrink-0">
            {/* Aura glow */}
            {equippedAura && (
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-60 scale-150"
                style={{ background: `radial-gradient(circle, ${equippedAura.frameImage ?? "#ff0000"} 0%, transparent 70%)` }}
              />
            )}
            {/* Frame */}
            {equippedFrame?.frameImage && (
              <img
                src={equippedFrame.frameImage}
                alt="Frame"
                className="absolute inset-0 w-full h-full z-10 pointer-events-none"
              />
            )}
            <div className="w-24 h-24 rounded-full border-4 border-red-600 overflow-hidden bg-gray-900 relative z-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name ?? "Avatar"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900 to-black">
                  <User className="w-10 h-10 text-red-400" />
                </div>
              )}
            </div>
          </div>

          {/* Name + info */}
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-orbitron font-bold text-white">
                {profile.nickname ?? profile.name ?? "Usuario"}
              </h1>
              {profile.profileType && (
                <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-800/40 rounded-full px-3 py-1">
                  <ProfileTypeIcon type={profile.profileType} />
                  <span className="text-xs text-red-300 font-rajdhani">
                    {profileTypeLabel[profile.profileType] ?? profile.profileType}
                  </span>
                </div>
              )}
              {profile.role === "admin" && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-600/40 font-orbitron text-xs">
                  ADMIN
                </Badge>
              )}
              {profile.role === "premium" && (
                <Badge className="bg-red-500/20 text-red-400 border-red-600/40 font-orbitron text-xs">
                  PREMIUM
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 flex-wrap">
              {profile.mainGame && (
                <span className="flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-red-500" />
                  {profile.mainGame}
                </span>
              )}
              {profile.country && (
                <span className="flex items-center gap-1">
                  🌍 {profile.country}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-yellow-500" />
                {profile.rlcBalance ?? 0} RLC
              </span>
              <span className="flex items-center gap-1 text-xs">
                <Calendar className="w-3 h-3" />
                Desde {new Date(profile.createdAt).toLocaleDateString("es", { year: "numeric", month: "long" })}
              </span>
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile && (
            <Button
              onClick={handleEdit}
              variant="outline"
              className="border-red-700 text-red-400 hover:bg-red-950/40 font-orbitron text-xs"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              EDITAR
            </Button>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-gray-300 text-sm leading-relaxed max-w-2xl">
            {profile.bio}
          </p>
        )}

        {/* Social links */}
        <div className="flex gap-3 mt-3">
          {profile.socialDiscord && (
            <a href={`https://discord.gg/${profile.socialDiscord}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              Discord
            </a>
          )}
          {profile.socialTwitch && (
            <a href={`https://twitch.tv/${profile.socialTwitch}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors">
              <Tv2 className="w-3.5 h-3.5" />
              Twitch
            </a>
          )}
          {profile.socialTwitter && (
            <a href={`https://twitter.com/${profile.socialTwitter}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors">
              <Twitter className="w-3.5 h-3.5" />
              Twitter
            </a>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing && isOwnProfile && (
        <div className="mx-6 bg-gray-900/80 border border-red-900/40 rounded-xl p-6 space-y-4">
          <h3 className="font-orbitron text-red-400 text-sm tracking-widest">EDITAR PERFIL</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "nickname", label: "Nickname", placeholder: "Tu alias en la plataforma" },
              { key: "mainGame", label: "Juego Principal", placeholder: "Ej: Valorant" },
              { key: "country", label: "País", placeholder: "Ej: Colombia" },
              { key: "socialDiscord", label: "Discord (usuario/servidor)", placeholder: "usuario#1234" },
              { key: "socialTwitch", label: "Twitch (usuario)", placeholder: "tu_canal" },
              { key: "socialTwitter", label: "Twitter (usuario)", placeholder: "@usuario" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase tracking-wider">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-rajdhani uppercase tracking-wider">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Cuéntanos sobre ti..."
              rows={3}
              className="w-full bg-black border border-red-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs"
            >
              {updateProfile.isPending ? "GUARDANDO..." : "GUARDAR"}
            </Button>
            <Button
              onClick={() => setEditing(false)}
              variant="outline"
              className="border-gray-700 text-gray-400 hover:bg-gray-900 font-orbitron text-xs"
            >
              CANCELAR
            </Button>
          </div>
        </div>
      )}

      {/* Tabs: Cosméticos / Equipos / Estadísticas */}
      <div className="px-6">
        <Tabs defaultValue="cosmetics">
          <TabsList className="bg-gray-900/60 border border-red-900/30 rounded-xl p-1">
            <TabsTrigger value="cosmetics" className="font-orbitron text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Star className="w-3.5 h-3.5 mr-1.5" />
              COSMÉTICOS
            </TabsTrigger>
            <TabsTrigger value="teams" className="font-orbitron text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Trophy className="w-3.5 h-3.5 mr-1.5" />
              EQUIPOS
            </TabsTrigger>
            <TabsTrigger value="stats" className="font-orbitron text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Swords className="w-3.5 h-3.5 mr-1.5" />
              ESTADÍSTICAS
            </TabsTrigger>
          </TabsList>

          {/* Cosméticos equipados */}
          <TabsContent value="cosmetics" className="mt-6">
            {cosmetics && cosmetics.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {cosmetics.map(c => (
                  <div
                    key={c.id}
                    className={`relative bg-gray-900/60 border rounded-xl p-4 text-center transition-all ${
                      c.isEquipped ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]" : "border-gray-800"
                    }`}
                  >
                    {c.isEquipped && (
                      <div className="absolute top-2 right-2">
                        <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-orbitron">EN USO</span>
                      </div>
                    )}
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                      {c.previewImage ? (
                        <img src={c.previewImage} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <Star className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    <p className="text-white text-xs font-rajdhani font-semibold">{c.name}</p>
                    <p className="text-gray-500 text-xs capitalize mt-0.5">{c.type}</p>
                    <div className="mt-2">
                      <RarityBadge rarity={c.rarity} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 font-rajdhani">Sin cosméticos equipados</p>
                {isOwnProfile && (
                  <Link href="/shop/cosmetics">
                    <Button className="mt-4 bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
                      VER TIENDA
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>

          {/* Equipos */}
          <TabsContent value="teams" className="mt-6">
            {teams && teams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teams.slice(0, 6).map(team => (
                  <Link key={team.id} href={`/teams/${team.id}`}>
                    <div className="flex items-center gap-4 bg-gray-900/60 border border-gray-800 hover:border-red-700/50 rounded-xl p-4 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-rajdhani font-semibold">{team.name}</p>
                        <p className="text-gray-500 text-xs">{team.game}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 font-rajdhani">Sin equipos registrados</p>
              </div>
            )}
          </TabsContent>

          {/* Estadísticas */}
          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "RLC Coins", value: profile.rlcBalance ?? 0, icon: Coins, color: "text-yellow-400" },
                { label: "Perfil", value: profileTypeLabel[profile.profileType ?? ""] ?? "Jugador", icon: User, color: "text-blue-400" },
                { label: "Miembro desde", value: new Date(profile.createdAt).getFullYear(), icon: Calendar, color: "text-green-400" },
                { label: "Cosméticos", value: cosmetics?.length ?? 0, icon: Star, color: "text-purple-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                  <p className={`text-xl font-orbitron font-bold ${color}`}>{value}</p>
                  <p className="text-gray-500 text-xs mt-1 font-rajdhani">{label}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
