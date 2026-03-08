/**
 * /apply/creator
 * Página oculta de solicitud de verificación de creador.
 * Solo accesible por botón directo desde Creators.tsx o notificaciones.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { ChevronLeft, CheckCircle, Clock, Shield, Youtube, Twitch, Twitter, Instagram } from "lucide-react";

const VERIFICATION_TYPES = [
  { value: "streamer",        label: "Streamer" },
  { value: "pro_player",      label: "Pro Player" },
  { value: "content_creator", label: "Content Creator" },
  { value: "team",            label: "Equipo / Org" },
  { value: "organization",    label: "Organización" },
  { value: "other",           label: "Otro" },
];

export default function CreatorApply() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { data: myRequest, refetch } = trpc.verification.myRequest.useQuery();

  const [submitted, setSubmitted] = useState(false);
  const [verificationType, setVerificationType] = useState("");
  const [followersCount, setFollowersCount] = useState("");
  const [reason, setReason] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    twitch: "", youtube: "", twitter: "", instagram: "", other: "",
  });

  const requestMutation = trpc.verification.request.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud de verificación enviada!");
      refetch();
      setSubmitted(true);
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 px-6">
        <Shield className="w-16 h-16 text-blue-500" />
        <h1 className="font-orbitron font-bold text-2xl text-white text-center">Inicia sesión primero</h1>
        <p className="text-muted-foreground text-center text-sm">Necesitas una cuenta de Red Level Circle para solicitar verificación.</p>
        <button onClick={() => navigate("/login")} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-orbitron font-bold tracking-widest text-sm transition-colors">
          IR AL LOGIN
        </button>
      </div>
    );
  }

  const req = myRequest as any;

  if (submitted || req?.status === "pending") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="font-orbitron font-bold text-2xl text-white">Solicitud en revisión</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">Tu solicitud de verificación está siendo revisada. Te notificaremos cuando haya una respuesta.</p>
          <button onClick={() => navigate("/creators")} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-orbitron font-bold tracking-widest text-sm transition-colors">
            VER DIRECTORIO DE CREADORES
          </button>
        </div>
      </div>
    );
  }

  if (req?.status === "approved") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="font-orbitron font-bold text-2xl text-white">¡Ya estás verificado!</h1>
          <p className="text-muted-foreground text-sm">Tu cuenta está verificada y apareces en el directorio de creadores de RLC.</p>
          <button onClick={() => navigate("/creators")} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-orbitron font-bold tracking-widest text-sm transition-colors">
            VER MI PERFIL
          </button>
        </div>
      </div>
    );
  }

  const canSubmit = reason.length >= 10 && !!verificationType;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="font-orbitron font-bold text-sm text-white tracking-widest">VERIFICACIÓN DE CREADOR</h1>
          <p className="text-xs text-muted-foreground">Red Level Circle</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Rejected notice */}
        {req?.status === "rejected" && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10">
            <p className="text-sm font-mono text-red-300 font-semibold">Solicitud anterior rechazada — puedes reenviar</p>
            {req.adminNote && <p className="text-xs text-muted-foreground mt-1">{req.adminNote}</p>}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card/50 p-5 space-y-5">
          <h2 className="font-orbitron font-bold text-sm text-blue-400 tracking-widest">SOLICITAR VERIFICACIÓN</h2>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-mono text-muted-foreground tracking-widest mb-2">TIPO DE CREADOR *</label>
            <div className="grid grid-cols-3 gap-2">
              {VERIFICATION_TYPES.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVerificationType(opt.value)}
                  className={`px-3 py-2 rounded-lg border text-xs font-mono transition-colors ${
                    verificationType === opt.value
                      ? "bg-blue-600/20 border-blue-500 text-blue-300"
                      : "border-border text-muted-foreground hover:border-zinc-500 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Seguidores */}
          <div>
            <label className="block text-xs font-mono text-muted-foreground tracking-widest mb-1.5">SEGUIDORES TOTALES (aproximado)</label>
            <input
              type="number"
              value={followersCount}
              onChange={e => setFollowersCount(e.target.value)}
              placeholder="Ej: 5000"
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Redes sociales */}
          <div>
            <label className="block text-xs font-mono text-muted-foreground tracking-widest mb-2">REDES SOCIALES (al menos una)</label>
            <div className="space-y-2">
              {([
                { key: "twitch",    placeholder: "https://twitch.tv/tucanal",    Icon: Twitch },
                { key: "youtube",   placeholder: "https://youtube.com/@tucanal", Icon: Youtube },
                { key: "twitter",   placeholder: "https://x.com/tuperfil",       Icon: Twitter },
                { key: "instagram", placeholder: "https://instagram.com/tuperfil", Icon: Instagram },
                { key: "other",     placeholder: "Otro link relevante",          Icon: null },
              ] as const).map(({ key, placeholder, Icon }) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-secondary border border-border">
                    {Icon ? <Icon size={13} className="text-muted-foreground" /> : <span className="text-[9px] font-bold text-muted-foreground font-mono">URL</span>}
                  </div>
                  <input
                    value={socialLinks[key]}
                    onChange={e => setSocialLinks(s => ({ ...s, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-mono text-muted-foreground tracking-widest mb-1.5">¿POR QUÉ DEBERÍAS SER VERIFICADO? *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explica brevemente tu trayectoria, logros, por qué mereces la verificación..."
              rows={4}
              maxLength={500}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{reason.length}/500</p>
          </div>

          <button
            type="button"
            disabled={!canSubmit || requestMutation.isPending}
            onClick={() => {
              const filteredLinks = Object.fromEntries(Object.entries(socialLinks).filter(([, v]) => v.trim()));
              requestMutation.mutate({
                reason,
                verificationType: verificationType as any,
                followersCount: followersCount ? parseInt(followersCount) : undefined,
                socialLinks: Object.keys(filteredLinks).length > 0 ? filteredLinks as any : undefined,
              });
            }}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-orbitron font-bold text-sm tracking-widest transition-colors"
          >
            {requestMutation.isPending ? "Enviando..." : "ENVIAR SOLICITUD"}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            El equipo revisará tu solicitud y te notificará por la campanita y email.
          </p>
        </div>
      </div>
    </div>
  );
}
