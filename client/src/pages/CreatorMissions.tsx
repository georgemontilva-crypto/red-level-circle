import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Clapperboard, ChevronLeft, ExternalLink, Plus, Trash2,
  Award, Clock, Link2, CheckCircle2, AlertCircle, Lock,
  Send, Loader2, Calendar, Users
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Mission = {
  id: number;
  title: string;
  description: string;
  requirements: string | null;
  resourcesUrl: string | null;
  platforms: string | null;
  rewardRlc: number;
  bonusRlc: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  accepted: boolean;
  submission: {
    id: number;
    status: "pending" | "approved" | "rejected";
    adminNote: string | null;
    rewardPaid: boolean;
    links: { url: string; platform: string | null }[];
  } | null;
};

// ─── Mission Detail / Submit ──────────────────────────────────────────────────
function MissionDetail({ mission, onBack, onRefetch }: {
  mission: Mission;
  onBack: () => void;
  onRefetch: () => void;
}) {
  const [links, setLinks] = useState<{ url: string; platform: string }[]>(
    mission.submission?.links.map(l => ({ url: l.url, platform: l.platform ?? "" })) ?? [{ url: "", platform: "" }]
  );
  const [submitting, setSubmitting] = useState(false);

  const acceptMutation = trpc.creatorMissions.accept.useMutation({
    onSuccess: () => { toast.success("¡Misión aceptada! Ahora complétala y sube tus links."); onRefetch(); },
    onError: (e) => toast.error(e.message),
  });

  const submitMutation = trpc.creatorMissions.submit.useMutation({
    onSuccess: () => {
      toast.success("¡Entrega enviada! El admin revisará tu contenido pronto.");
      setSubmitting(false);
      onRefetch();
    },
    onError: (e) => { toast.error(e.message); setSubmitting(false); },
  });

  const addLink = () => setLinks(l => [...l, { url: "", platform: "" }]);
  const removeLink = (i: number) => setLinks(l => l.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: "url" | "platform", val: string) =>
    setLinks(l => l.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleSubmit = () => {
    const validLinks = links.filter(l => l.url.trim());
    if (validLinks.length === 0) { toast.error("Debes añadir al menos un link"); return; }
    setSubmitting(true);
    submitMutation.mutate({ missionId: mission.id, links: validLinks });
  };

  const isExpired = mission.endDate && new Date(mission.endDate) < new Date();
  const sub = mission.submission;

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver a misiones
      </button>

      {/* Header */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clapperboard className="w-5 h-5 text-red-400" />
                <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Misión para Creadores</span>
              </div>
              <h2 className="font-orbitron text-white font-bold text-2xl leading-tight">{mission.title}</h2>
            </div>
            {sub?.status === "approved" && (
              <span className="shrink-0 flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full border border-green-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aprobada
              </span>
            )}
            {sub?.status === "pending" && (
              <span className="shrink-0 flex items-center gap-1.5 bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-500/30">
                <Clock className="w-3.5 h-3.5" /> En revisión
              </span>
            )}
            {sub?.status === "rejected" && (
              <span className="shrink-0 flex items-center gap-1.5 bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full border border-red-500/30">
                <AlertCircle className="w-3.5 h-3.5" /> Rechazada
              </span>
            )}
          </div>

          {/* Rewards */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-600/30 rounded-lg px-3 py-2">
              <Award className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-bold">{mission.rewardRlc} RLC</span>
              <span className="text-zinc-500 text-xs">al ser aprobado</span>
            </div>
            {mission.bonusRlc > 0 && (
              <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-600/30 rounded-lg px-3 py-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-bold">+{mission.bonusRlc} RLC</span>
                <span className="text-zinc-500 text-xs">bonus mensual (más likes/compartidas)</span>
              </div>
            )}
          </div>

          {/* Dates */}
          {(mission.startDate || mission.endDate) && (
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
              {mission.startDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Desde {new Date(mission.startDate).toLocaleDateString("es", { day: "numeric", month: "long" })}
                </span>
              )}
              {mission.endDate && (
                <span className={`flex items-center gap-1.5 ${isExpired ? "text-red-400" : ""}`}>
                  <Clock className="w-4 h-4" />
                  {isExpired ? "Venció el" : "Vence el"} {new Date(mission.endDate).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
            </div>
          )}

          {/* Platforms */}
          {mission.platforms && (
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-500">Plataformas:</span> {mission.platforms}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Descripción</h3>
        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{mission.description}</p>
      </div>

      {/* Requirements */}
      {mission.requirements && (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-3">
          <h3 className="font-semibold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-400" /> Requisitos específicos
          </h3>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{mission.requirements}</p>
        </div>
      )}

      {/* Resources */}
      {mission.resourcesUrl && (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-400" /> Recursos disponibles
          </h3>
          <a href={mission.resourcesUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-900/20 border border-blue-600/30 text-blue-400 hover:text-blue-300 text-sm px-4 py-2.5 rounded-lg transition-colors">
            <ExternalLink className="w-4 h-4" />
            Abrir recursos (imágenes, assets, etc.)
          </a>
        </div>
      )}

      {/* Accept button */}
      {!mission.accepted && !isExpired && (
        <button
          onClick={() => acceptMutation.mutate({ missionId: mission.id })}
          disabled={acceptMutation.isPending}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
          {acceptMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clapperboard className="w-5 h-5" />}
          Tomar misión
        </button>
      )}

      {isExpired && !sub && (
        <div className="bg-zinc-800/50 border border-white/5 rounded-xl p-4 text-center text-zinc-500 text-sm">
          Esta misión ya venció y no acepta nuevas participaciones.
        </div>
      )}

      {/* Submit section */}
      {mission.accepted && !sub && (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4 text-red-400" /> Subir tu entrega
          </h3>
          <p className="text-zinc-400 text-sm">
            Una vez que hayas publicado tu contenido en redes sociales, pega los links aquí. Puedes añadir múltiples links si publicaste en varias plataformas.
          </p>

          <div className="space-y-3">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    value={link.url}
                    onChange={e => updateLink(i, "url", e.target.value)}
                    placeholder="https://www.instagram.com/p/... o https://www.tiktok.com/..."
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                  />
                  <input
                    value={link.platform}
                    onChange={e => updateLink(i, "platform", e.target.value)}
                    placeholder="Plataforma (Instagram, TikTok, YouTube...)"
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-zinc-400 text-sm focus:outline-none focus:border-zinc-500"
                  />
                </div>
                {links.length > 1 && (
                  <button onClick={() => removeLink(i)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors self-start mt-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addLink}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <Plus className="w-4 h-4" /> Añadir otro link
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Enviar entrega
          </button>
        </div>
      )}

      {/* Submission status */}
      {sub && (
        <div className={`border rounded-xl p-6 space-y-4 ${
          sub.status === "approved" ? "border-green-600/30 bg-green-900/10" :
          sub.status === "rejected" ? "border-red-600/30 bg-red-900/10" :
          "border-orange-600/30 bg-orange-900/10"
        }`}>
          <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Tu entrega</h3>

          <div className="space-y-2">
            {sub.links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{link.url}</span>
                {link.platform && <span className="text-zinc-500 text-xs shrink-0">({link.platform})</span>}
              </a>
            ))}
          </div>

          {sub.status === "pending" && (
            <div className="flex items-center gap-3 bg-orange-900/20 border border-orange-600/20 rounded-lg px-4 py-3">
              <Clock className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-orange-400 font-semibold text-sm">En revisión</p>
                <p className="text-zinc-400 text-xs">El admin revisará tu contenido y recibirás una notificación con el resultado.</p>
              </div>
            </div>
          )}

          {sub.status === "approved" && (
            <div className="flex items-center gap-3 bg-green-900/20 border border-green-600/20 rounded-lg px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="text-green-400 font-semibold text-sm">¡Aprobada! {sub.rewardPaid && `— ${mission.rewardRlc} RLC acreditados`}</p>
                {sub.adminNote && <p className="text-zinc-400 text-xs mt-0.5">{sub.adminNote}</p>}
              </div>
            </div>
          )}

          {sub.status === "rejected" && (
            <div className="flex items-center gap-3 bg-red-900/20 border border-red-600/20 rounded-lg px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-red-400 font-semibold text-sm">Rechazada</p>
                {sub.adminNote && <p className="text-zinc-400 text-xs mt-0.5">{sub.adminNote}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Mission Card ─────────────────────────────────────────────────────────────
function MissionCard({ mission, onClick }: { mission: Mission; onClick: () => void }) {
  const isExpired = mission.endDate && new Date(mission.endDate) < new Date();
  const sub = mission.submission;

  return (
    <div
      onClick={onClick}
      className="bg-zinc-900 border border-white/10 hover:border-white/25 rounded-xl p-5 cursor-pointer transition-all hover:bg-zinc-800/50 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-white leading-snug">{mission.title}</h3>
        <div className="shrink-0">
          {sub?.status === "approved" && (
            <span className="flex items-center gap-1 bg-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Aprobada
            </span>
          )}
          {sub?.status === "pending" && (
            <span className="flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" /> En revisión
            </span>
          )}
          {sub?.status === "rejected" && (
            <span className="flex items-center gap-1 bg-red-500/20 text-red-400 text-xs font-bold px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" /> Rechazada
            </span>
          )}
          {!sub && mission.accepted && (
            <span className="flex items-center gap-1 bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full">
              <Clapperboard className="w-3 h-3" /> Aceptada
            </span>
          )}
        </div>
      </div>

      <p className="text-zinc-500 text-sm line-clamp-2">{mission.description}</p>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="flex items-center gap-1 text-red-400 font-bold">
          <Award className="w-3.5 h-3.5" /> {mission.rewardRlc} RLC
        </span>
        {mission.bonusRlc > 0 && (
          <span className="flex items-center gap-1 text-yellow-400">
            <Award className="w-3.5 h-3.5" /> +{mission.bonusRlc} bonus
          </span>
        )}
        {mission.platforms && (
          <span className="text-zinc-500">{mission.platforms}</span>
        )}
        {mission.endDate && (
          <span className={`flex items-center gap-1 ${isExpired ? "text-red-400" : "text-zinc-500"}`}>
            <Clock className="w-3.5 h-3.5" />
            {isExpired ? "Venció" : "Vence"} {new Date(mission.endDate).toLocaleDateString("es", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreatorMissionsPage() {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const { data: creatorApp, isLoading: loadingCreator } = trpc.creators.getMyApplication.useQuery();
  const isApprovedCreator = creatorApp?.status === "approved";

  const { data: missions = [], refetch, isLoading } = trpc.creatorMissions.list.useQuery(undefined, {
    enabled: isApprovedCreator,
  });

  // If viewing detail
  if (selectedMission) {
    // Get fresh data from list
    const fresh = missions.find(m => m.id === selectedMission.id) ?? selectedMission;
    return (
      <div className="w-full px-4 py-6">
        <MissionDetail
          mission={fresh}
          onBack={() => setSelectedMission(null)}
          onRefetch={() => { refetch(); setSelectedMission(null); }}
        />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="font-orbitron text-white font-bold text-xl tracking-wide">MISIONES CREADORES</h1>
            <p className="text-zinc-500 text-sm">Crea contenido y gana RLC</p>
          </div>
        </div>
      </div>

      {/* Not a creator */}
      {!loadingCreator && !isApprovedCreator && (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-zinc-600" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Sección exclusiva para creadores</h3>
            <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto">
              Esta sección es exclusiva para creadores de contenido aprobados. Si eres creador, solicita tu acceso desde Configuración → Perfil de Creador.
            </p>
          </div>
          <a href="/settings"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors">
            <Users className="w-4 h-4" /> Ir a Configuración
          </a>
        </div>
      )}

      {/* Loading */}
      {isApprovedCreator && isLoading && (
        <div className="text-center py-12 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
          <p className="text-sm">Cargando misiones...</p>
        </div>
      )}

      {/* Empty */}
      {isApprovedCreator && !isLoading && missions.length === 0 && (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-10 text-center space-y-3">
          <Clapperboard className="w-12 h-12 text-zinc-700 mx-auto" />
          <p className="text-zinc-400 font-semibold">No hay misiones disponibles</p>
          <p className="text-zinc-600 text-sm">El equipo publicará misiones pronto. Recibirás una notificación cuando haya nuevas.</p>
        </div>
      )}

      {/* Mission list */}
      {isApprovedCreator && !isLoading && missions.length > 0 && (
        <div className="space-y-3">
          {missions.map(m => (
            <MissionCard key={m.id} mission={m} onClick={() => setSelectedMission(m)} />
          ))}
        </div>
      )}
    </div>
  );
}
