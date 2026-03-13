/**
 * /apply/to
 * Formulario de solicitud para ser Tournament Organizer (TO) en RLC.
 * Solo accesible por botón directo desde /torneos o CreateTournament.
 * Llama a trpc.roleRequests.submit con requestedRole: "to".
 * games y region se encodan en orgDescription para no requerir cambios de schema.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ChevronLeft, Trophy, CheckCircle, Clock, XCircle, Shield,
} from "lucide-react";

const GAMES = [
  "League of Legends",
  "Valorant",
  "Honor of Kings",
  "Mobile Legends",
  "Otro",
];

const REGIONS = [
  "Venezuela",
  "Colombia",
  "México",
  "Latinoamérica",
  "Global",
];

const ACCENT = "#2F6BFF";

export default function TOApply() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { data: me } = trpc.auth.me.useQuery();
  const { data: myRequests, refetch } = trpc.roleRequests.myRequests.useQuery(
    undefined,
    { enabled: !!me }
  );

  const [form, setForm] = useState({
    orgName: "",
    games: [] as string[],
    region: "",
    experience: "",
    discordContact: "",
    websiteUrl: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.roleRequests.submit.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud enviada! El equipo RLC la revisará pronto.");
      refetch();
      setSubmitted(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleGame = (game: string) =>
    setForm((f) => ({
      ...f,
      games: f.games.includes(game)
        ? f.games.filter((g) => g !== game)
        : [...f.games, game],
    }));

  const canSubmit = form.orgName.trim().length >= 2 && form.games.length > 0 && !!form.region;

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
          Necesitas una cuenta de Red Level Circle para solicitar el rol de Organizador.
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

  const existingRequest = myRequests?.find((r: any) => r.requestedRole === "to");

  // ── Pending ────────────────────────────────────────────────────────────────
  if (submitted || existingRequest?.status === "pending") {
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
            Tu solicitud para el rol <strong className="text-white">Tournament Organizer</strong> está
            siendo revisada por el equipo de Red Level Circle. Te notificaremos cuando haya una respuesta.
          </p>
          <button
            onClick={() => navigate("/torneos")}
            className="w-full py-3 rounded-xl font-orbitron font-bold tracking-widest text-sm text-white"
            style={{ background: ACCENT }}
          >
            VER TORNEOS
          </button>
        </div>
      </div>
    );
  }

  // ── Approved ───────────────────────────────────────────────────────────────
  if (existingRequest?.status === "approved") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12" style={{ background: "#0a0a0a" }}>
        <div className="w-full max-w-md text-center space-y-6">
          <div
            className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.30)" }}
          >
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="font-orbitron font-bold text-2xl text-white">¡Ya eres Tournament Organizer!</h1>
          <p className="text-zinc-400 text-sm">
            Tu solicitud fue aprobada. Ya puedes crear y gestionar torneos en RLC.
          </p>
          <button
            onClick={() => navigate("/torneos")}
            className="w-full py-3 rounded-xl font-orbitron font-bold tracking-widest text-sm text-white"
            style={{ background: ACCENT }}
          >
            IR A TORNEOS
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
          <h1 className="font-orbitron font-bold text-sm text-white tracking-widest">
            SOLICITAR ROL TOURNAMENT ORGANIZER
          </h1>
          <p className="text-xs text-zinc-500">Red Level Circle</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

        {/* Rejected notice */}
        {existingRequest?.status === "rejected" && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)" }}
          >
            <XCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-400 text-xs font-mono font-semibold">
                Solicitud anterior rechazada — puedes reenviar
              </p>
              {existingRequest.reviewNote && (
                <p className="text-zinc-400 text-xs mt-1">{existingRequest.reviewNote}</p>
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
              <Trophy size={18} style={{ color: ACCENT }} />
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

          {/* Org name */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 tracking-widest mb-1.5">
              NOMBRE DE TU ORGANIZACIÓN O ALIAS *
            </label>
            <input
              value={form.orgName}
              onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
              placeholder="Ej: Red Dragons Esports"
              maxLength={128}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${ACCENT}80`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>

          {/* Games */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 tracking-widest mb-2.5">
              JUEGOS QUE ORGANIZAS *{" "}
              <span className="text-zinc-600 normal-case font-normal">(puedes seleccionar varios)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GAMES.map((game) => (
                <button
                  key={game}
                  type="button"
                  onClick={() => toggleGame(game)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                  style={
                    form.games.includes(game)
                      ? { background: `${ACCENT}20`, border: `1px solid ${ACCENT}70`, color: "white" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "#71717a" }
                  }
                >
                  {game}
                </button>
              ))}
            </div>
          </div>

          {/* Region */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 tracking-widest mb-2.5">
              REGIÓN PRINCIPAL *
            </label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, region: r }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                  style={
                    form.region === r
                      ? { background: `${ACCENT}20`, border: `1px solid ${ACCENT}70`, color: "white" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "#71717a" }
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 tracking-widest mb-1.5">
              CUÉNTANOS TU EXPERIENCIA ORGANIZANDO TORNEOS
            </label>
            <textarea
              value={form.experience}
              onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
              placeholder="Torneos organizados anteriormente, comunidades, logros..."
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${ACCENT}80`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
            <p className="text-xs text-zinc-600 text-right mt-1">{form.experience.length}/2000</p>
          </div>

          {/* Discord */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 tracking-widest mb-1.5">
              DISCORD DE CONTACTO
            </label>
            <input
              value={form.discordContact}
              onChange={(e) => setForm((f) => ({ ...f, discordContact: e.target.value }))}
              placeholder="usuario#0000 o @usuario"
              maxLength={128}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${ACCENT}80`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 tracking-widest mb-1.5">
              SITIO WEB / RED SOCIAL{" "}
              <span className="text-zinc-600 normal-case font-normal">(opcional)</span>
            </label>
            <input
              value={form.websiteUrl}
              onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
              placeholder="https://..."
              maxLength={256}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${ACCENT}80`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>

          {submitMutation.error && (
            <p className="text-red-400 text-xs">{submitMutation.error.message}</p>
          )}

          <button
            type="button"
            disabled={!canSubmit || submitMutation.isPending}
            onClick={() => {
              // games y region se encodan en orgDescription para no requerir cambios de schema
              const orgDescription = [
                `Juegos: ${form.games.join(", ")}`,
                `Región: ${form.region}`,
              ].join("\n");

              submitMutation.mutate({
                requestedRole: "to",
                orgName: form.orgName.trim(),
                orgDescription,
                experience: form.experience || undefined,
                discordContact: form.discordContact || undefined,
                websiteUrl: form.websiteUrl || undefined,
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
            ) : existingRequest?.status === "rejected" ? (
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
