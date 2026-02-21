import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Camera, User, Globe, MessageSquare, Save, ChevronLeft,
  Twitter, Gamepad2, MapPin, Shield, Crown, Swords, Loader2
} from "lucide-react";
import { getLoginUrl } from "@/const";

const GAMES = [
  "League of Legends", "Valorant", "CS2", "Dota 2", "Fortnite",
  "Apex Legends", "Overwatch 2", "Rainbow Six Siege", "Rocket League",
  "FIFA", "Call of Duty", "PUBG", "Minecraft", "Hearthstone", "Otro"
];

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica",
  "Cuba", "Ecuador", "El Salvador", "España", "Guatemala", "Honduras",
  "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico",
  "República Dominicana", "Uruguay", "Venezuela", "Otro"
];

function AvatarUpload({ currentUrl, onUpload }: { currentUrl?: string | null; onUpload: (url: string) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.profile.uploadImage.useMutation();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const mimeType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        const { url } = await uploadMutation.mutateAsync({ base64, mimeType, type: "avatar" });
        setPreview(url);
        onUpload(url);
        toast.success("Avatar actualizado");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Error al subir la imagen");
      setUploading(false);
    }
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-24 h-24 rounded-full cursor-pointer group"
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-red-600" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
            <User className="w-10 h-10 text-zinc-600" />
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </div>
      <p className="text-xs text-zinc-500 font-mono">Haz clic para cambiar (máx. 5MB)</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}

function BannerUpload({ currentUrl, onUpload }: { currentUrl?: string | null; onUpload: (url: string) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.profile.uploadImage.useMutation();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El banner no puede superar 10MB");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const mimeType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        const { url } = await uploadMutation.mutateAsync({ base64, mimeType, type: "banner" });
        setPreview(url);
        onUpload(url);
        toast.success("Banner actualizado");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Error al subir el banner");
      setUploading(false);
    }
  };

  const displayUrl = preview || currentUrl;

  return (
    <div
      className="relative w-full h-32 rounded-xl cursor-pointer group overflow-hidden border border-zinc-800 hover:border-red-500/50 transition-colors"
      onClick={() => inputRef.current?.click()}
    >
      {displayUrl ? (
        <img src={displayUrl} alt="Banner" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-zinc-900 via-red-950/20 to-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-8 h-8 text-zinc-600 mx-auto mb-1" />
            <p className="text-xs text-zinc-600 font-mono">Subir banner</p>
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {uploading ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : (
          <div className="text-center">
            <Camera className="w-8 h-8 text-white mx-auto mb-1" />
            <p className="text-sm text-white font-mono">Cambiar banner</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}

export default function Settings() {
  const { isAuthenticated, user } = useAuth();
  const { data: me, refetch } = trpc.auth.me.useQuery();

  const [form, setForm] = useState({
    nickname: "",
    bio: "",
    mainGame: "",
    country: "",
    profileType: "player" as "player" | "team_captain" | "event_creator",
    socialDiscord: "",
    socialTwitch: "",
    socialTwitter: "",
    avatar: "",
    bannerUrl: "",
  });
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form from user data
  if (me && !initialized) {
    const u = me as {
      nickname?: string; bio?: string; mainGame?: string; country?: string;
      profileType?: string; socialDiscord?: string; socialTwitch?: string;
      socialTwitter?: string; avatar?: string; bannerUrl?: string;
    };
    setForm({
      nickname: u.nickname ?? "",
      bio: u.bio ?? "",
      mainGame: u.mainGame ?? "",
      country: u.country ?? "",
      profileType: (u.profileType as "player" | "team_captain" | "event_creator") ?? "player",
      socialDiscord: u.socialDiscord ?? "",
      socialTwitch: u.socialTwitch ?? "",
      socialTwitter: u.socialTwitter ?? "",
      avatar: u.avatar ?? "",
      bannerUrl: u.bannerUrl ?? "",
    });
    setInitialized(true);
  }

  const updateMutation = trpc.profile.updateMine.useMutation({
    onSuccess: () => {
      toast.success("Perfil actualizado correctamente", {
        style: { background: "#0a0a0a", border: "1px solid #22c55e", color: "#fff" },
      });
      refetch();
      setSaving(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setSaving(false);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
          <p className="font-orbitron text-xl mb-4">Acceso Restringido</p>
          <a href={getLoginUrl()} className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-mono font-bold transition-colors">
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    setSaving(true);
    const payload: Record<string, string | undefined> = {};
    if (form.nickname) payload.nickname = form.nickname;
    if (form.bio) payload.bio = form.bio;
    if (form.mainGame) payload.mainGame = form.mainGame;
    if (form.country) payload.country = form.country;
    if (form.socialDiscord) payload.socialDiscord = form.socialDiscord;
    if (form.socialTwitch) payload.socialTwitch = form.socialTwitch;
    if (form.socialTwitter) payload.socialTwitter = form.socialTwitter;
    if (form.avatar) payload.avatar = form.avatar;
    if (form.bannerUrl) payload.bannerUrl = form.bannerUrl;
    updateMutation.mutate({
      ...payload,
      profileType: form.profileType,
    });
  };

  const profileTypeOptions = [
    { value: "player", label: "Jugador", icon: <Gamepad2 className="w-4 h-4" />, desc: "Participa en torneos como jugador" },
    { value: "team_captain", label: "Capitán de Equipo", icon: <Crown className="w-4 h-4" />, desc: "Lidera y gestiona un equipo" },
    { value: "event_creator", label: "Creador de Eventos", icon: <Swords className="w-4 h-4" />, desc: "Organiza torneos y eventos" },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-4">
          <Link href={`/profile/${user?.id}`}>
            <button className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-mono text-sm">
              <ChevronLeft className="w-4 h-4" /> Mi Perfil
            </button>
          </Link>
          <div className="w-px h-4 bg-zinc-800" />
          <h1 className="font-orbitron font-black text-xl tracking-widest text-white">CONFIGURACIÓN</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner & Avatar */}
        <div className="space-y-4">
          <h2 className="font-orbitron text-sm tracking-widest text-red-400 flex items-center gap-2">
            <Camera className="w-4 h-4" /> IMÁGENES DE PERFIL
          </h2>
          <BannerUpload
            currentUrl={form.bannerUrl || null}
            onUpload={(url) => setForm((f) => ({ ...f, bannerUrl: url }))}
          />
          <div className="flex items-center gap-4">
            <AvatarUpload
              currentUrl={form.avatar || null}
              onUpload={(url) => setForm((f) => ({ ...f, avatar: url }))}
            />
            <div>
              <p className="font-bold text-white">{(me as { name?: string })?.name ?? "Usuario"}</p>
              <p className="text-zinc-500 text-sm font-mono">{form.nickname || "Sin nickname"}</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="font-orbitron text-sm tracking-widest text-red-400 flex items-center gap-2">
            <User className="w-4 h-4" /> INFORMACIÓN BÁSICA
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">NICKNAME</label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                placeholder="Tu alias en la plataforma"
                maxLength={64}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">BIO</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Cuéntanos sobre ti..."
                maxLength={500}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-zinc-600 resize-none"
              />
              <p className="text-xs text-zinc-600 text-right mt-1">{form.bio.length}/500</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">JUEGO PRINCIPAL</label>
                <select
                  value={form.mainGame}
                  onChange={(e) => setForm((f) => ({ ...f, mainGame: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="">Seleccionar juego</option>
                  {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> PAÍS
                </label>
                <select
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="">Seleccionar país</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Type */}
        <div className="space-y-4">
          <h2 className="font-orbitron text-sm tracking-widest text-red-400 flex items-center gap-2">
            <Shield className="w-4 h-4" /> TIPO DE PERFIL
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {profileTypeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, profileType: opt.value as "player" | "team_captain" | "event_creator" }))}
                className={`p-4 rounded-xl border text-left transition-all ${
                  form.profileType === opt.value
                    ? "border-red-500 bg-red-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                }`}
              >
                <div className={`flex items-center gap-2 mb-2 ${form.profileType === opt.value ? "text-red-400" : "text-zinc-400"}`}>
                  {opt.icon}
                  <span className="font-mono font-bold text-sm">{opt.label}</span>
                </div>
                <p className="text-xs text-zinc-500">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h2 className="font-orbitron text-sm tracking-widest text-red-400 flex items-center gap-2">
            <Globe className="w-4 h-4" /> REDES SOCIALES
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest flex items-center gap-1">
                <Twitter className="w-3 h-3" /> TWITTER / X
              </label>
              <div className="flex items-center">
                <span className="bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-lg px-3 py-2.5 text-zinc-500 text-sm">@</span>
                <input
                  type="text"
                  value={form.socialTwitter}
                  onChange={(e) => setForm((f) => ({ ...f, socialTwitter: e.target.value }))}
                  placeholder="usuario"
                  maxLength={128}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-r-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-zinc-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> DISCORD
              </label>
              <input
                type="text"
                value={form.socialDiscord}
                onChange={(e) => setForm((f) => ({ ...f, socialDiscord: e.target.value }))}
                placeholder="usuario#0000 o usuario"
                maxLength={128}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">TWITCH</label>
              <div className="flex items-center">
                <span className="bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-lg px-3 py-2.5 text-zinc-500 text-sm">twitch.tv/</span>
                <input
                  type="text"
                  value={form.socialTwitch}
                  onChange={(e) => setForm((f) => ({ ...f, socialTwitch: e.target.value }))}
                  placeholder="canal"
                  maxLength={128}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-r-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-zinc-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-orbitron font-bold tracking-widest transition-all"
            style={{ boxShadow: "0 0 20px rgba(220,38,38,0.3)" }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                GUARDANDO...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                GUARDAR CAMBIOS
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
