/**
 * /apply/creator
 * Formulario único de solicitud para ser Creador de Contenido (CDC) en RLC.
 * Solo accesible por botón directo desde /creadores o Home.
 * Llama a trpc.creators.submitApplication (tabla contentCreators).
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ChevronLeft, Crown, CheckCircle, Clock, XCircle, Shield,
  Youtube, Twitch, Twitter, Instagram,
  Gamepad2, Zap, Play, Camera, Mic, Music,
} from "lucide-react";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

const CATEGORIES = [
  { value: "gaming",        label: "Videojuegos",     icon: Gamepad2 },
  { value: "esports",       label: "Esports",         icon: Zap },
  { value: "streaming",     label: "Streaming",       icon: Play },
  { value: "content",       label: "Contenido",       icon: Camera },
  { value: "education",     label: "Educación",       icon: Mic },
  { value: "entertainment", label: "Entretenimiento", icon: Music },
];

const SOCIALS = [
  { key: "youtube",   Icon: Youtube,   prefix: "youtube.com/@",  placeholder: "tu_canal" },
  { key: "twitch",    Icon: Twitch,    prefix: "twitch.tv/",     placeholder: "tu_usuario" },
  { key: "twitter",   Icon: Twitter,   prefix: "twitter.com/",   placeholder: "tu_usuario" },
  { key: "instagram", Icon: Instagram, prefix: "instagram.com/", placeholder: "tu_usuario" },
  { key: "tiktok",    Icon: null,      prefix: "tiktok.com/@",   placeholder: "tu_usuario", label: "TT" },
  { key: "facebook",  Icon: null,      prefix: "facebook.com/",  placeholder: "tu_pagina",  label: "FB" },
  { key: "kick",      Icon: null,      prefix: "kick.com/",      placeholder: "tu_usuario", label: "KC" },
] as const;

const ACCENT = "#2F6BFF";

export default function CreatorApply() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { data: myApp } = trpc.creators.getMyApplication.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const [form, setForm] = useState({
    category: "",
    bio: "",
    youtube: "", twitch: "", twitter: "", instagram: "",
    tiktok: "", facebook: "", kick: "",
    subscribers: "",
    reason: "",
  });

  const submitMutation = trpc.creators.submitApplication.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud enviada! Te notificaremos pronto.");
      navigate("/creadores");
    },
    onError: (e) => toast.error(e.message),
  });

  const hasSocial = SOCIALS.some(({ key }) => form[key].trim());
  const canSubmit = !!form.category && form.bio.length >= 20 && hasSocial;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#0a0a0a" }}>
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${ACCENT} transparent transparent transparent` }}
        />
      </div>
    );
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6" style={{ background: "#0a0a0a" }}>
        <Shield className="w-16 h-16" style={{ color: ACCENT }} />
        <h1 className="font-orbitron font-bold text-2xl text-white text-center">Inicia sesión primero</h1>
        <p className="text-zinc-400 text-center text-sm">
          Necesitas una cuenta de Red Level Circle para aplicar como Creador.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-3 rounded-xl font-orbitron font-bold tracking-widest text-sm text-white transition-colors"
          style={{ background: ACCENT }}
        >
          IR AL LOGIN
        </button>
      </div>
    );
  }

  // ── Already approved ───────────────────────────────────────────────────────
  if (myApp?.status === "approved") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12" style={{ background: "#0a0a0a" }}>
        <div className="w-full max-w-md text-center space-y-6">
          <div
            className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.30)" }}
          >
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="font-orbitron font-bold text-2xl text-white">¡Ya eres Creador Oficial!</h1>
          <p className="text-zinc-400 text-sm">
            Tu cuenta está verificada y apareces en el directorio de creadores de RLC.
          </p>
          <button
            onClick={() => navigate("/creadores")}
            className="w-full py-3 rounded-xl font-orbitron font-bold tracking-widest text-sm text-white"
            style={{ background: ACCENT }}
          >
            VER DIRECTORIO
          </button>
        </div>
      </div>
    );
  }

  // ── Pending review ─────────────────────────────────────────────────────────
  if (myApp?.status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12" style={{ background: "#0a0a0a" }}>
        <div className="w-full max-w-md text-center space-y-6">
          <div
            className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.30)" }}
          >
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="font-orbitron font-bold text-2xl text-white">Solicitud en revisión</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Tu solicitud está siendo revisada por el equipo de Red Level Circle.
            Te notificaremos cuando haya una respuesta.
          </p>
          <button
            onClick={() => navigate("/creadores")}
            className="w-full py-3 rounded-xl font-orbitron font-bold tracking-widest text-sm text-white"
            style={{ background: ACCENT }}
          >
            VOLVER AL DIRECTORIO
          </button>
        </div>
      </div>
    );
  }

  // ── Form (new or rejected) ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 backdrop-blur border-b px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(10,10,10,0.95)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-400" />
        </button>
        <div>
          <h1 className="font-orbitron font-bold text-sm text-white tracking-widest">APLICAR COMO CREADOR</h1>
          <p className="text-xs text-zinc-500">Red Level Circle</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

        {/* Rejected notice */}
        {myApp?.status === "rejected" && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)" }}
          >
            <XCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-400 text-xs font-mono font-semibold">
                Solicitud anterior rechazada — puedes reenviar
              </p>
              {myApp.adminNote && (
                <p className="text-zinc-400 text-xs mt-1">{myApp.adminNote}</p>
              )}
            </div>
          </div>
        )}

        <div
          className="rounded-2xl p-5 space-y-5"
          style={{ background: "#16191f", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Card header */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}40` }}
            >
              <Crown size={18} style={{ color: ACCENT }} />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-sm text-white tracking-widest">
                DATOS DE TU SOLICITUD
              </h2>
              <p className="text-zinc-500 text-xs mt-0.5">
                El equipo revisará tu solicitud y te notificará pronto
              </p>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 tracking-widest mb-2.5">
              CATEGORÍA *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all"
                  style={
                    form.category === cat.value
                      ? { background: `${ACCENT}18`, borderColor: `${ACCENT}60`, color: "white" }
                      : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)", color: "#71717a" }
                  }
                >
                  <cat.icon
                    size={13}
                    style={{ color: form.category === cat.value ? ACCENT : undefined }}
                  />
                  <span className="text-xs font-mono">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 tracking-widest mb-1.5">
              CUÉNTANOS SOBRE TI Y TU CONTENIDO *
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="¿Qué tipo de contenido creas? ¿Qué te hace único?..."
              rows={3}
              maxLength={500}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${ACCENT}80`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
            <div className="flex justify-between mt-1">
              {form.bio.length > 0 && form.bio.length < 20 ? (
                <p className="text-xs text-red-400">Mínimo 20 caracteres ({form.bio.length}/20)</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-zinc-600 ml-auto">{form.bio.length}/500</p>
            </div>
          </div>

          {/* Social handles */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 tracking-widest mb-2.5">
              REDES SOCIALES{" "}
              <span className="text-zinc-600 normal-case font-normal">(al menos una)</span>
            </label>
            <div className="space-y-2">
              {SOCIALS.map(({ key, Icon, prefix, placeholder, ...rest }) => {
                const label = (rest as any).label as string | undefined;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      {Icon ? (
                        <Icon size={13} className="text-zinc-500" />
                      ) : key === "tiktok" ? (
                        <TikTokIcon className="w-[13px] h-[13px] text-zinc-500" />
                      ) : (
                        <span className="text-[9px] font-bold text-zinc-500 font-mono">{label}</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-[10px] text-zinc-600 font-mono px-1 mb-0.5 truncate">
                        {prefix}
                      </span>
                      <input
                        type="text"
                        value={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = `${ACCENT}80`; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscribers */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 tracking-widest mb-1.5">
              ¿CUÁNTOS SEGUIDORES TIENES EN TOTAL?{" "}
              <span className="text-zinc-600 normal-case font-normal">(aproximado, opcional)</span>
            </label>
            <input
              type="number"
              value={form.subscribers}
              onChange={(e) => setForm((f) => ({ ...f, subscribers: e.target.value }))}
              placeholder="Ej: 5000"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${ACCENT}80`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 tracking-widest mb-1.5">
              ¿POR QUÉ QUIERES SER PARTE DE RLC?{" "}
              <span className="text-zinc-600 normal-case font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Cuéntanos tu motivación..."
              rows={3}
              maxLength={300}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${ACCENT}80`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
            <p className="text-xs text-zinc-600 text-right mt-1">{form.reason.length}/300</p>
          </div>

          {/* Minimum requirement note */}
          <div
            className="rounded-xl px-4 py-3 text-xs text-zinc-400 leading-relaxed"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="font-semibold text-zinc-300 mb-1 uppercase tracking-wider font-mono text-[10px]">
              Requisito mínimo
            </p>
            Para ser considerado creador oficial debes contar con al menos{" "}
            <strong className="text-white">1,000 seguidores</strong> en alguna de tus plataformas.
          </div>

          {submitMutation.error && (
            <p className="text-red-400 text-xs">{submitMutation.error.message}</p>
          )}

          <button
            type="button"
            disabled={!canSubmit || submitMutation.isPending}
            onClick={() => {
              submitMutation.mutate({
                category: form.category || undefined,
                bio: form.bio || undefined,
                youtube: form.youtube || undefined,
                twitch: form.twitch || undefined,
                twitter: form.twitter || undefined,
                instagram: form.instagram || undefined,
                tiktok: form.tiktok || undefined,
                facebook: form.facebook || undefined,
                kick: form.kick || undefined,
                subscribers: form.subscribers ? parseInt(form.subscribers) : undefined,
              });
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-orbitron font-bold text-sm text-white tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: ACCENT }}
          >
            {submitMutation.isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "rgba(255,255,255,0.3) transparent transparent transparent" }}
                />
                ENVIANDO...
              </>
            ) : myApp?.status === "rejected" ? (
              "REENVIAR SOLICITUD"
            ) : (
              "ENVIAR SOLICITUD"
            )}
          </button>

          <p className="text-xs text-zinc-500 text-center">
            El equipo de Red Level Circle revisará tu solicitud y te notificará por la campanita y email.
          </p>
        </div>
      </div>
    </div>
  );
}
