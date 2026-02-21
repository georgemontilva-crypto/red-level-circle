import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { SectionBanner } from "@/components/SectionBanner";
import {
  Star, Crown, Youtube, Twitch, Twitter, Instagram, Play,
  CheckCircle, Clock, XCircle, Send, ChevronDown, Users,
  Gamepad2, Mic, Camera, Music, Zap, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const CATEGORIES = [
  { value: "gaming", label: "Gaming", icon: Gamepad2 },
  { value: "esports", label: "Esports", icon: Zap },
  { value: "streaming", label: "Streaming", icon: Play },
  { value: "content", label: "Contenido", icon: Camera },
  { value: "education", label: "Educación", icon: Mic },
  { value: "entertainment", label: "Entretenimiento", icon: Music },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return (
    <span className="flex items-center gap-1 text-xs text-green-400 font-mono">
      <CheckCircle size={12} /> Aprobado
    </span>
  );
  if (status === "rejected") return (
    <span className="flex items-center gap-1 text-xs text-red-400 font-mono">
      <XCircle size={12} /> Rechazado
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-yellow-400 font-mono">
      <Clock size={12} /> En revisión
    </span>
  );
}

function CreatorCard({ c }: { c: any }) {
  const name = c.nickname ?? c.userName ?? "Creador";
  const cat = CATEGORIES.find(x => x.value === c.category);
  const [, navigate] = useLocation();
  return (
    <div onClick={() => navigate(`/profile/${c.userId}`)} className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/50 hover:border-red-600/40 transition-all cursor-pointer group">
        {/* Banner */}
        <div className="relative h-28 bg-gradient-to-br from-zinc-800 to-red-950/20 overflow-hidden">
          {c.banner && (
            <img src={c.banner} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
          {cat && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-xs text-zinc-300 font-mono border border-zinc-700/50">
              <cat.icon size={10} /> {cat.label}
            </div>
          )}
        </div>
        {/* Avatar — outside the overflow-hidden banner so it renders on top */}
        <div className="relative" style={{ height: 0 }}>
          <div className="absolute -top-7 left-5" style={{ border: "3px solid oklch(0.10 0.005 0)", borderRadius: "9999px", display: "inline-block", zIndex: 10 }}>
            <UserAvatar
              avatar={c.avatar}
              name={name}
              activeFrameImage={c.activeFrameImage}
              size={56}
            />
          </div>
        </div>

        <div className="pt-10 px-5 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-orbitron font-bold text-white">{name}</h3>
                {(c as { isVerified?: boolean }).isVerified && <VerifiedBadge size={16} />}
              </div>
              {c.subscribers > 0 && (
                <p className="text-zinc-500 text-xs font-mono mt-0.5">
                  {c.subscribers.toLocaleString()} seguidores
                </p>
              )}
            </div>
          </div>

          {c.bio && (
            <p className="text-zinc-400 text-sm mt-3 line-clamp-2 leading-relaxed">{c.bio}</p>
          )}

          {/* Social links */}
          <div className="flex items-center gap-3 mt-4">
            {c.youtube && (
              <a href={`https://youtube.com/@${c.youtube}`} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-500 transition-colors font-mono">
                <Youtube size={14} /> {c.youtube}
              </a>
            )}
            {c.twitch && (
              <a href={`https://twitch.tv/${c.twitch}`} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-purple-400 transition-colors font-mono">
                <Twitch size={14} /> {c.twitch}
              </a>
            )}
            {c.twitter && (
              <a href={`https://twitter.com/${c.twitter}`} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-sky-400 transition-colors font-mono">
                <Twitter size={14} /> {c.twitter}
              </a>
            )}
            {c.instagram && (
              <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-pink-400 transition-colors font-mono">
                <Instagram size={14} /> {c.instagram}
              </a>
            )}
          </div>
        </div>
      </div>
  );
}
function ApplicationForm({ onSuccess }: { onSuccess?: () => void }) {
  const { isAuthenticated, user } = useAuth();
  const { data: myApp, refetch } = trpc.creators.getMyApplication.useQuery(undefined, { enabled: isAuthenticated });
  const submit = trpc.creators.submitApplication.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud enviada! La revisaremos pronto.");
      refetch();
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    bio: "", category: "", youtube: "", twitch: "", twitter: "", instagram: "", tiktok: "", subscribers: 0,
  });

  useEffect(() => {
    if (myApp) {
      setForm({
        bio: myApp.bio ?? "",
        category: myApp.category ?? "",
        youtube: myApp.youtube ?? "",
        twitch: myApp.twitch ?? "",
        twitter: myApp.twitter ?? "",
        instagram: myApp.instagram ?? "",
        tiktok: myApp.tiktok ?? "",
        subscribers: myApp.subscribers ?? 0,
      });
    }
  }, [myApp]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <Crown size={40} className="text-red-500/40 mx-auto mb-4" />
        <h3 className="font-orbitron font-bold text-white text-lg mb-2">Inicia sesión para aplicar</h3>
        <p className="text-zinc-500 text-sm mb-6">Necesitas una cuenta para solicitar ser creador oficial.</p>
        <a href={getLoginUrl()}>
          <button className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors">
            INICIAR SESIÓN
          </button>
        </a>
      </div>
    );
  }

  if (myApp?.status === "approved") {
    return (
      <div className="text-center py-12">
        <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
        <h3 className="font-orbitron font-bold text-white text-lg mb-2">¡Eres creador oficial!</h3>
        <p className="text-zinc-500 text-sm mb-6">Tu solicitud fue aprobada. Apareces en la sección de creadores de la plataforma.</p>
        <Link href={`/profile/${user?.id}`}>
          <button className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white bg-green-600 hover:bg-green-700 transition-colors">
            VER MI PERFIL
          </button>
        </Link>
      </div>
    );
  }

  if (myApp?.status === "pending") {
    return (
      <div className="text-center py-12">
        <Clock size={40} className="text-yellow-500 mx-auto mb-4" />
        <h3 className="font-orbitron font-bold text-white text-lg mb-2">Solicitud en revisión</h3>
        <p className="text-zinc-500 text-sm">Tu solicitud está siendo revisada por el equipo. Te notificaremos pronto.</p>
        <div className="mt-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left max-w-md mx-auto">
          <p className="text-xs font-mono text-zinc-500 mb-2">DATOS ENVIADOS</p>
          {form.bio && <p className="text-zinc-300 text-sm">{form.bio}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {form.youtube && <span className="text-xs text-zinc-500 font-mono flex items-center gap-1"><Youtube size={10} /> {form.youtube}</span>}
            {form.twitch && <span className="text-xs text-zinc-500 font-mono flex items-center gap-1"><Twitch size={10} /> {form.twitch}</span>}
            {form.twitter && <span className="text-xs text-zinc-500 font-mono flex items-center gap-1"><Twitter size={10} /> {form.twitter}</span>}
          </div>
        </div>
      </div>
    );
  }

  if (myApp?.status === "rejected") {
    // Allow re-application
  }

  return (
    <div className="max-w-2xl mx-auto">
      {myApp?.status === "rejected" && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-800/40">
          <p className="text-red-400 text-sm font-mono flex items-center gap-2"><XCircle size={14} /> Solicitud rechazada</p>
          {myApp.adminNote && <p className="text-zinc-400 text-sm mt-1">{myApp.adminNote}</p>}
          <p className="text-zinc-500 text-xs mt-2">Puedes actualizar tu información y volver a enviar.</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Category */}
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">Categoría *</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-mono transition-all ${
                  form.category === cat.value
                    ? "border-red-600 bg-red-600/20 text-white"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}
              >
                <cat.icon size={14} /> {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">Descripción / Bio *</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Cuéntanos sobre ti y tu contenido..."
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600/50 resize-none"
          />
        </div>

        {/* Subscribers */}
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">Seguidores totales (aprox.)</label>
          <input
            type="number"
            value={form.subscribers || ""}
            onChange={e => setForm(f => ({ ...f, subscribers: parseInt(e.target.value) || 0 }))}
            placeholder="Ej: 10000"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600/50"
          />
        </div>

        {/* Social links */}
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-wider">Redes sociales (al menos una)</label>
          <div className="space-y-3">
            {[
              { key: "youtube", icon: Youtube, label: "YouTube", placeholder: "tu_canal", prefix: "youtube.com/@" },
              { key: "twitch", icon: Twitch, label: "Twitch", placeholder: "tu_usuario", prefix: "twitch.tv/" },
              { key: "twitter", icon: Twitter, label: "Twitter / X", placeholder: "tu_usuario", prefix: "twitter.com/" },
              { key: "instagram", icon: Instagram, label: "Instagram", placeholder: "tu_usuario", prefix: "instagram.com/" },
            ].map(({ key, icon: Icon, label, placeholder, prefix }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-zinc-500" />
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-mono">{prefix}</span>
                  <input
                    type="text"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-24 pr-4 py-2.5 text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-red-600/50"
                    style={{ paddingLeft: `${prefix.length * 7 + 12}px` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => submit.mutate(form)}
          disabled={submit.isPending || !form.bio || !form.category}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-orbitron font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
          style={{ background: "oklch(0.55 0.22 25)", boxShadow: "0 0 20px oklch(0.55 0.22 25 / 0.3)" }}
        >
          {submit.isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {myApp?.status === "rejected" ? "REENVIAR SOLICITUD" : "ENVIAR SOLICITUD"}
        </button>
      </div>
    </div>
  );
}

export default function Creators() {
  const { data: creators, isLoading } = trpc.creators.listApproved.useQuery();
  const [activeFilter, setActiveFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  // Check if URL has #apply hash
  useEffect(() => {
    if (window.location.hash === "#apply") {
      setShowForm(true);
      setTimeout(() => {
        document.getElementById("apply-section")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, []);

  const filtered = activeFilter === "all"
    ? creators ?? []
    : (creators ?? []).filter((c: any) => c.category === activeFilter);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Section Banner */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4">
        <SectionBanner sectionKey="creators" height="h-36 sm:h-48" />
      </div>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-black to-black" />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #9333ea 0%, transparent 50%), radial-gradient(circle at 80% 50%, #dc2626 0%, transparent 50%)" }} />
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star size={20} className="text-yellow-400 fill-yellow-400" />
            <span className="font-mono text-sm text-zinc-400 tracking-widest uppercase">Creadores Oficiales</span>
            <Star size={20} className="text-yellow-400 fill-yellow-400" />
          </div>
          <h1 className="font-orbitron font-black text-4xl sm:text-5xl text-white mb-4">
            Creadores de Contenido
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-8">
            Conoce a los streamers, YouTubers y creadores verificados que forman parte de la comunidad Red Level Circle.
          </p>

        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16 space-y-10">

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-mono transition-all ${
              activeFilter === "all" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800"
            }`}
          >
            Todos ({creators?.length ?? 0})
          </button>
          {CATEGORIES.map(cat => {
            const count = (creators ?? []).filter((c: any) => c.category === cat.value).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveFilter(cat.value)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-mono transition-all ${
                  activeFilter === cat.value ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800"
                }`}
              >
                <cat.icon size={12} /> {cat.label} ({count})
              </button>
              )}
        )}
        </div>
        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-zinc-900/60 border border-zinc-800/50 h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="text-zinc-700 mx-auto mb-4" />
            <h3 className="font-orbitron font-bold text-zinc-500 text-lg mb-2">
              {activeFilter === "all" ? "Aún no hay creadores aprobados" : "No hay creadores en esta categoría"}
            </h3>
            <p className="text-zinc-600 text-sm">¡Sé el primero en aplicar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((c: any) => <CreatorCard key={c.id} c={c} />)}
          </div>
        )}

        {/* Floating button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-orbitron font-bold text-sm text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: "oklch(0.55 0.22 25)", boxShadow: "0 0 24px oklch(0.55 0.22 25 / 0.5)" }}
            title="Solicitar ser Creador Oficial"
          >
            <Crown size={16} />
            <span className="hidden sm:inline">Ser Creador</span>
          </button>
        </div>
        {/* Modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ animation: "fadeIn 0.2s ease" }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />
            <div
              className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden"
              style={{ animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-600/20 flex items-center justify-center">
                    <Crown size={18} className="text-red-400" />
                  </div>
                  <div>
                    <h2 className="font-orbitron font-bold text-white text-base">Solicitar Verificación</h2>
                    <p className="text-zinc-500 text-xs">El equipo revisará tu solicitud</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              {/* Modal body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <ApplicationForm onSuccess={() => setShowForm(false)} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
