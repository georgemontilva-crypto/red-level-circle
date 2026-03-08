/**
 * /apply/role?role=to|cdc|partner
 * Página oculta de solicitud de rol — solo accesible por botón directo.
 * No aparece en navegación, menús ni sitemap.
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Crown, Shield, Trophy, Store, ChevronLeft, CheckCircle, Clock, XCircle, BadgeCheck } from "lucide-react";

const ROLE_OPTIONS = [
  {
    value: "to",
    label: "Tournament Organizer (TO)",
    icon: "🏆",
    color: "purple",
    desc: "Crea y gestiona torneos en la plataforma. Tendrás tu perfil público de organizador con historial de torneos.",
    nameLabel: "NOMBRE DE LA ORGANIZACIÓN / EVENTO *",
    namePlaceholder: "Ej: Red Dragons Esports",
    expPlaceholder: "Torneos organizados anteriormente, comunidades, etc.",
  },
  {
    value: "cdc",
    label: "Creador de Contenido (CDC)",
    icon: "🎥",
    color: "blue",
    desc: "Accede a misiones exclusivas para creadores y aparece en el directorio de creadores de RLC.",
    nameLabel: "NOMBRE DE TU CANAL / MARCA *",
    namePlaceholder: "Ej: GamingConNacho",
    expPlaceholder: "Años creando contenido, plataformas, logros...",
  },
  {
    value: "partner",
    label: "Partner RLC",
    icon: "🤝",
    color: "green",
    desc: "Colabora con Red Level Circle como marca, tienda o empresa del ecosistema gaming.",
    nameLabel: "NOMBRE DE TU TIENDA / EMPRESA *",
    namePlaceholder: "Ej: GamerStore LATAM",
    expPlaceholder: "Años en el mercado, productos, alianzas previas...",
  },
];

const COLOR_MAP: Record<string, string> = {
  purple: "border-purple-500/50 bg-purple-500/10 text-purple-300",
  blue:   "border-blue-500/50 bg-blue-500/10 text-blue-300",
  green:  "border-green-500/50 bg-green-500/10 text-green-300",
};

const ACCENT_MAP: Record<string, string> = {
  purple: "bg-purple-600 hover:bg-purple-700",
  blue:   "bg-blue-600 hover:bg-blue-700",
  green:  "bg-green-600 hover:bg-green-700",
};

export default function RoleApply() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { data: me } = trpc.auth.me.useQuery();
  const { data: myRequests, refetch } = trpc.roleRequests.myRequests.useQuery(undefined, { enabled: !!me });

  // Read ?role= from URL
  const params = new URLSearchParams(window.location.search);
  const preRole = params.get("role") ?? "";

  const [selectedRole, setSelectedRole] = useState(preRole || "to");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    orgName: "",
    orgDescription: "",
    experience: "",
    discordContact: "",
    websiteUrl: "",
  });

  useEffect(() => {
    if (preRole && ROLE_OPTIONS.find(r => r.value === preRole)) {
      setSelectedRole(preRole);
    }
  }, [preRole]);

  const submitMutation = trpc.roleRequests.submit.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud enviada! El equipo RLC la revisará pronto.");
      refetch();
      setSubmitted(true);
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 px-6">
        <Shield className="w-16 h-16 text-red-500" />
        <h1 className="font-orbitron font-bold text-2xl text-white text-center">Inicia sesión primero</h1>
        <p className="text-muted-foreground text-center text-sm">Necesitas una cuenta de Red Level Circle para solicitar un rol.</p>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold tracking-widest text-sm transition-colors"
        >
          IR AL LOGIN
        </button>
      </div>
    );
  }

  const currentRole = (me as any)?.role ?? "player";
  const opt = ROLE_OPTIONS.find(r => r.value === selectedRole)!;

  // Check if already has a pending/approved request for this role
  const existingRequest = myRequests?.find((r: any) => r.requestedRole === selectedRole);

  if (submitted || (existingRequest && existingRequest.status === "pending")) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="font-orbitron font-bold text-2xl text-white">Solicitud en revisión</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Tu solicitud para el rol <strong className="text-white">{opt?.label}</strong> está siendo revisada por el equipo de Red Level Circle. Te notificaremos cuando haya una respuesta.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold tracking-widest text-sm transition-colors"
          >
            VOLVER AL INICIO
          </button>
        </div>
      </div>
    );
  }

  if (existingRequest && existingRequest.status === "approved") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="font-orbitron font-bold text-2xl text-white">¡Ya tienes este rol!</h1>
          <p className="text-muted-foreground text-sm">Tu solicitud fue aprobada. Ya puedes usar todas las funciones del rol <strong className="text-white">{opt?.label}</strong>.</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold tracking-widest text-sm transition-colors"
          >
            VOLVER AL INICIO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="font-orbitron font-bold text-sm text-white tracking-widest">SOLICITAR ROL</h1>
          <p className="text-xs text-muted-foreground">Red Level Circle</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Role selector */}
        <div className="space-y-3">
          <p className="text-xs font-mono text-muted-foreground tracking-widest">SELECCIONA EL ROL QUE SOLICITAS</p>
          <div className="grid grid-cols-1 gap-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  selectedRole === r.value
                    ? `${COLOR_MAP[r.color]} border-opacity-100`
                    : "border-border hover:border-zinc-600 bg-secondary/30"
                }`}
              >
                <span className="text-2xl mt-0.5">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-orbitron font-bold text-sm text-white">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.desc}</p>
                </div>
                {selectedRole === r.value && (
                  <CheckCircle className="w-4 h-4 text-current mt-1 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Rejected notice */}
        {existingRequest && existingRequest.status === "rejected" && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-mono text-red-300 font-semibold">Solicitud anterior rechazada</p>
              {existingRequest.reviewNote && (
                <p className="text-xs text-muted-foreground mt-1">{existingRequest.reviewNote}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Puedes volver a enviar una solicitud mejorada.</p>
            </div>
          </div>
        )}

        {/* Form */}
        {opt && (
          <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
            <h2 className="font-orbitron font-bold text-sm text-white tracking-widest flex items-center gap-2">
              <Crown className="w-4 h-4 text-red-400" />
              DATOS DE TU SOLICITUD
            </h2>

            <div>
              <label className="block text-xs font-mono text-muted-foreground tracking-widest mb-1.5">{opt.nameLabel}</label>
              <input
                value={form.orgName}
                onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))}
                placeholder={opt.namePlaceholder}
                maxLength={128}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground tracking-widest mb-1.5">DESCRIPCIÓN</label>
              <textarea
                value={form.orgDescription}
                onChange={e => setForm(f => ({ ...f, orgDescription: e.target.value }))}
                placeholder="Cuéntanos sobre tu organización, canal o tienda..."
                rows={3}
                maxLength={1000}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground tracking-widest mb-1.5">EXPERIENCIA / TRAYECTORIA</label>
              <textarea
                value={form.experience}
                onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                placeholder={opt.expPlaceholder}
                rows={3}
                maxLength={2000}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-muted-foreground tracking-widest mb-1.5">DISCORD DE CONTACTO</label>
                <input
                  value={form.discordContact}
                  onChange={e => setForm(f => ({ ...f, discordContact: e.target.value }))}
                  placeholder="usuario#0000 o @usuario"
                  maxLength={128}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-foreground tracking-widest mb-1.5">SITIO WEB / RED SOCIAL</label>
                <input
                  value={form.websiteUrl}
                  onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                  placeholder="https://..."
                  maxLength={256}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!selectedRole || form.orgName.length < 2) return;
                submitMutation.mutate({
                  requestedRole: selectedRole,
                  orgName: form.orgName,
                  orgDescription: form.orgDescription || undefined,
                  experience: form.experience || undefined,
                  discordContact: form.discordContact || undefined,
                  websiteUrl: form.websiteUrl || undefined,
                });
              }}
              disabled={form.orgName.length < 2 || submitMutation.isPending}
              className={`w-full py-3 rounded-xl ${ACCENT_MAP[opt.color]} disabled:opacity-50 text-white font-orbitron font-bold text-sm tracking-widest transition-colors`}
            >
              {submitMutation.isPending ? "Enviando..." : "ENVIAR SOLICITUD"}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              El equipo de Red Level Circle revisará tu solicitud y te notificará por email y campanita.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
