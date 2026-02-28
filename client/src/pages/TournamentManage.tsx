import { trpc } from "@/lib/trpc";
import BracketView from "@/components/BracketView";
import PremiumLayout from "@/components/PremiumLayout";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import {
  Trophy,
  Play,
  ChevronLeft,
  Settings,
  Users,
  Swords,
  Crown,
  CheckCircle,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Edit,
  Eye,
  CalendarClock,
} from "lucide-react";
import { Link } from "wouter";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "oklch(0.55 0.18 220)" },
  registration_open: { label: "Inscripciones Abiertas", color: "oklch(0.65 0.18 145)" },
  registration_closed: { label: "Inscripciones Cerradas", color: "oklch(0.55 0.22 25)" },
  in_progress: { label: "En Curso", color: "oklch(0.65 0.18 80)" },
  completed: { label: "Finalizado", color: "oklch(0.50 0.005 0)" },
  cancelled: { label: "Cancelado", color: "oklch(0.40 0.005 0)" },
};

const NEXT_STATUS: Record<string, string> = {
  draft: "registration_open",
  registration_open: "registration_closed",
  registration_closed: "in_progress",
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  draft: "ABRIR INSCRIPCIONES",
  registration_open: "CERRAR INSCRIPCIONES",
  registration_closed: "INICIAR TORNEO",
};

export default function TournamentManage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();
  const [bracketView, setBracketView] = useState(true);
  const [resultModal, setResultModal] = useState<{
    matchId: number;
    team1Id: number | null;
    team2Id: number | null;
    team1Name: string;
    team2Name: string;
  } | null>(null);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [resultNotes, setResultNotes] = useState("");
  const [winnerModal, setWinnerModal] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(null);
  const [scheduleModal, setScheduleModal] = useState<{ matchId: number; matchLabel: string } | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [betsCloseMinutes, setBetsCloseMinutes] = useState(30);

  const { data: tournament, refetch: refetchTournament } = trpc.tournaments.byId.useQuery({ id });
  const { data: registrations, refetch: refetchRegs } = trpc.registrations.byTournament.useQuery(
    { tournamentId: id, status: "Aprobado" },
    { enabled: !!tournament }
  );
  const { data: allRegistrations } = trpc.registrations.byTournament.useQuery(
    { tournamentId: id },
    { enabled: !!tournament }
  );
  const { data: matches, refetch: refetchMatches } = trpc.matches.byTournament.useQuery({ tournamentId: id });

  const updateStatusMutation = trpc.tournaments.updateStatus.useMutation({
    onSuccess: () => { toast.success("Estado actualizado"); refetchTournament(); },
    onError: (err) => toast.error(err.message),
  });

  const startMutation = trpc.tournaments.startTournament.useMutation({
    onSuccess: (data) => {
      toast.success(`¡Torneo iniciado! ${data.matchCount} equipos en el bracket.`);
      refetchTournament();
      refetchMatches();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateResultMutation = trpc.matches.updateResult.useMutation({
    onSuccess: () => {
      toast.success("Resultado registrado");
      setResultModal(null);
      setWinnerId(null);
      setTeam1Score("");
      setTeam2Score("");
      setResultNotes("");
      refetchMatches();
    },
    onError: (err) => toast.error(err.message),
  });

  const declareWinnerMutation = trpc.tournaments.declareWinner.useMutation({
    onSuccess: () => {
      toast.success("¡Ganador declarado! El torneo ha finalizado.");
      setWinnerModal(false);
      refetchTournament();
    },
    onError: (err) => toast.error(err.message),
  });

  const scheduleMatchMutation = trpc.matches.schedule.useMutation({
    onSuccess: (data) => {
      const d = new Date(data.scheduledAt);
      const closeD = new Date(data.betsCloseAt);
      toast.success(`Partido programado para ${d.toLocaleString("es-ES")}. Apuestas cierran: ${closeD.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`);
      setScheduleModal(null);
      setScheduleDate("");
      setScheduleTime("");
      refetchMatches();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!tournament) {
    return (
      <PremiumLayout title="GESTIÓN DE TORNEO">
        <div className="flex items-center justify-center h-64">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: "oklch(0.55 0.22 25)", borderTopColor: "transparent" }}
          />
        </div>
      </PremiumLayout>
    );
  }

  const statusInfo = STATUS_LABELS[tournament.status] ?? { label: tournament.status, color: "oklch(0.55 0.005 0)" };
  const approvedCount = registrations?.length ?? 0;
  const pendingCount = allRegistrations?.filter((r) => r.status === "Pendiente").length ?? 0;
  const completedMatches = matches?.filter((m) => m.status === "completed").length ?? 0;
  const totalMatches = matches?.length ?? 0;

  const canAdvance = NEXT_STATUS[tournament.status];
  const canStart = tournament.status === "registration_closed" && approvedCount >= 2;

  return (
    <PremiumLayout title="GESTIÓN DE TORNEO">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: "oklch(0.10 0.005 0)",
            border: "1px solid oklch(0.18 0.01 0)",
          }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background:
                "radial-gradient(ellipse at top right, oklch(0.55 0.22 25) 0%, transparent 60%)",
            }}
          />
          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-xs font-display tracking-wider px-2 py-1 rounded-full"
                    style={{
                      background: `${statusInfo.color}20`,
                      border: `1px solid ${statusInfo.color}40`,
                      color: statusInfo.color,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                  <span className="text-xs text-muted-foreground font-tech">{tournament.game}</span>
                </div>
                <h1 className="font-display text-2xl font-black tracking-wider text-foreground">
                  {tournament.name}
                </h1>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/edit-tournament/${id}`}>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs tracking-widest transition-all duration-200"
                    style={{
                      background: "oklch(0.13 0.005 0)",
                      border: "1px solid oklch(0.55 0.22 25 / 0.4)",
                      color: "oklch(0.65 0.22 25)",
                    }}
                  >
                    <Edit size={14} /> EDITAR
                  </button>
                </Link>

                <Link href={`/tournaments/${id}`}>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs tracking-widest transition-all duration-200"
                    style={{
                      background: "oklch(0.13 0.005 0)",
                      border: "1px solid oklch(0.22 0.01 0)",
                      color: "oklch(0.60 0.005 0)",
                    }}
                  >
                    <Eye size={14} /> VER PÚBLICO
                  </button>
                </Link>

                {canAdvance && tournament.status !== "registration_closed" && (
                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id,
                        status: NEXT_STATUS[tournament.status] as any,
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                    style={{
                      background: "oklch(0.55 0.22 25)",
                      color: "oklch(0.98 0 0)",
                      boxShadow: "0 0 10px oklch(0.55 0.22 25 / 0.3)",
                    }}
                  >
                    <Play size={14} />
                    {NEXT_STATUS_LABEL[tournament.status]}
                  </button>
                )}

                {canStart && (
                  <button
                    onClick={() => startMutation.mutate({ id })}
                    disabled={startMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                    style={{
                      background: "oklch(0.55 0.22 25)",
                      color: "oklch(0.98 0 0)",
                      boxShadow: "0 0 10px oklch(0.55 0.22 25 / 0.3)",
                    }}
                  >
                    <Swords size={14} /> GENERAR BRACKET
                  </button>
                )}

                {tournament.status === "in_progress" && (
                  <button
                    onClick={() => setWinnerModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs tracking-widest transition-all duration-300"
                    style={{
                      background: "oklch(0.65 0.18 80 / 0.2)",
                      border: "1px solid oklch(0.65 0.18 80 / 0.4)",
                      color: "oklch(0.65 0.18 80)",
                    }}
                  >
                    <Crown size={14} /> DECLARAR GANADOR
                  </button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              {[
                { label: "Equipos Aprobados", value: approvedCount, color: "oklch(0.65 0.18 145)" },
                { label: "Pendientes", value: pendingCount, color: "oklch(0.65 0.18 80)" },
                { label: "Partidas Totales", value: totalMatches, color: "oklch(0.55 0.18 220)" },
                { label: "Completadas", value: completedMatches, color: "oklch(0.55 0.22 25)" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="font-display text-3xl font-black"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-display tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Approved teams */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "oklch(0.10 0.005 0)",
            border: "1px solid oklch(0.18 0.01 0)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold tracking-wider text-foreground flex items-center gap-2">
              <Users size={16} style={{ color: "oklch(0.55 0.22 25)" }} />
              EQUIPOS APROBADOS ({approvedCount})
            </h2>
            <Link href="/dashboard/registrations">
              <button
                className="text-xs font-display tracking-wider"
                style={{ color: "oklch(0.55 0.22 25)" }}
              >
                GESTIONAR →
              </button>
            </Link>
          </div>

          {approvedCount === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No hay equipos aprobados aún
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {registrations?.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{
                    background: "oklch(0.12 0.005 0)",
                    border: "1px solid oklch(0.20 0.01 0)",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: "oklch(0.55 0.22 25 / 0.15)",
                      color: "oklch(0.65 0.22 25)",
                    }}
                  >
                    {reg.teamName?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <span className="text-xs text-foreground font-display tracking-wide truncate">
                    {reg.teamName ?? `Equipo #${reg.teamId}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bracket / Matches */}
        {matches && matches.length > 0 && (
          <div
            className="rounded-xl p-5"
            style={{
              background: "oklch(0.10 0.005 0)",
              border: "1px solid oklch(0.18 0.01 0)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-bold tracking-wider text-foreground flex items-center gap-2">
                <Swords size={16} style={{ color: "oklch(0.55 0.22 25)" }} />
                PARTIDAS DEL TORNEO
              </h2>
              {/* View toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "oklch(0.08 0.005 0)" }}>
                <button
                  onClick={() => setBracketView(true)}
                  className="px-3 py-1 rounded-md text-xs font-mono tracking-wider transition-all duration-200"
                  style={bracketView ? { background: "oklch(0.55 0.22 25 / 0.2)", color: "oklch(0.65 0.22 25)" } : { color: "oklch(0.45 0.005 0)" }}
                >
                  BRACKET
                </button>
                <button
                  onClick={() => setBracketView(false)}
                  className="px-3 py-1 rounded-md text-xs font-mono tracking-wider transition-all duration-200"
                  style={!bracketView ? { background: "oklch(0.55 0.22 25 / 0.2)", color: "oklch(0.65 0.22 25)" } : { color: "oklch(0.45 0.005 0)" }}
                >
                  LISTA
                </button>
              </div>
            </div>

            {bracketView ? (
              <BracketView
                matches={matches}
                canEditResults={tournament.status === "in_progress"}
                onDeclareWinner={async (matchId, team1Score, team2Score) => {
                  await updateResultMutation.mutateAsync({
                    matchId,
                    tournamentId: id,
                    team1Score,
                    team2Score,
                  });
                }}
              />
            ) : (
              /* List view */
              <div>
                {Array.from(new Set(matches.map((m) => m.round))).map((round) => (
                  <div key={round} className="mb-5">
                    <div
                      className="text-xs font-display tracking-wider mb-3 flex items-center gap-2"
                      style={{ color: "oklch(0.55 0.22 25)" }}
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                        style={{ background: "oklch(0.55 0.22 25 / 0.2)" }}
                      >
                        {round}
                      </div>
                      RONDA {round}
                    </div>
                    <div className="space-y-2">
                      {matches
                        .filter((m) => m.round === round)
                        .map((match) => {
                          const isCompleted = match.status === "completed";
                          return (
                            <div
                              key={match.id}
                              className="flex items-center justify-between p-4 rounded-xl transition-all duration-200"
                              style={{
                                background: "oklch(0.12 0.005 0)",
                                border: isCompleted
                                  ? "1px solid oklch(0.65 0.18 145 / 0.2)"
                                  : "1px solid oklch(0.20 0.01 0)",
                              }}
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <span className="text-xs text-muted-foreground font-tech w-16 flex-shrink-0">
                                  #{match.matchNumber}
                                </span>
                                <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                                  <span className="text-sm text-foreground font-display tracking-wide truncate">
                                    {match.team1Name ?? `Equipo ${match.team1Id}`}
                                  </span>
                                  {isCompleted && match.team1Score !== null && (
                                    <span className="font-display text-lg font-black" style={{ color: match.winnerId === match.team1Id ? "oklch(0.65 0.18 145)" : "oklch(0.45 0.005 0)" }}>
                                      {match.team1Score}
                                    </span>
                                  )}
                                  <span className="text-muted-foreground text-xs font-display">VS</span>
                                  {isCompleted && match.team2Score !== null && (
                                    <span className="font-display text-lg font-black" style={{ color: match.winnerId === match.team2Id ? "oklch(0.65 0.18 145)" : "oklch(0.45 0.005 0)" }}>
                                      {match.team2Score}
                                    </span>
                                  )}
                                  <span className="text-sm text-foreground font-display tracking-wide truncate">
                                    {match.team2Name ?? `Equipo ${match.team2Id}`}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs font-display tracking-wider" style={{ color: isCompleted ? "oklch(0.65 0.18 145)" : "oklch(0.55 0.005 0)" }}>
                                  {isCompleted ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                </span>
                                {tournament.status === "in_progress" && !isCompleted && match.team1Id && match.team2Id && (
                                  <button
                                    onClick={() => {
                                      const existing = match.scheduledAt ? new Date(match.scheduledAt) : null;
                                      setScheduleDate(existing ? existing.toISOString().split("T")[0] : "");
                                      setScheduleTime(existing ? existing.toTimeString().slice(0, 5) : "");
                                      setBetsCloseMinutes(30);
                                      setScheduleModal({ matchId: match.id, matchLabel: `${match.team1Name ?? "Equipo 1"} vs ${match.team2Name ?? "Equipo 2"}` });
                                    }}
                                    className="px-3 py-1.5 rounded-lg font-display text-xs tracking-wider transition-all duration-200 flex items-center gap-1"
                                    style={{ background: "oklch(0.55 0.18 220 / 0.15)", border: "1px solid oklch(0.55 0.18 220 / 0.3)", color: "oklch(0.65 0.18 220)" }}
                                  >
                                    <CalendarClock size={12} />
                                    {match.scheduledAt ? "REPROG." : "PROGRAMAR"}
                                  </button>
                                )}
                                {tournament.status === "in_progress" && !isCompleted && (
                                  <button
                                    onClick={() => setResultModal({ matchId: match.id, team1Id: match.team1Id, team2Id: match.team2Id, team1Name: match.team1Name ?? `Equipo ${match.team1Id}`, team2Name: match.team2Name ?? `Equipo ${match.team2Id}` })}
                                    className="px-3 py-1.5 rounded-lg font-display text-xs tracking-wider transition-all duration-200"
                                    style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.3)", color: "oklch(0.65 0.22 25)" }}
                                  >
                                    RESULTADO
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Winner banner */}
        {tournament.status === "completed" && tournament.winnerId && (
          <div
            className="rounded-2xl p-6 text-center relative overflow-hidden"
            style={{
              background: "oklch(0.10 0.005 0)",
              border: "1px solid oklch(0.65 0.18 80 / 0.4)",
              boxShadow: "0 0 30px oklch(0.65 0.18 80 / 0.1)",
            }}
          >
            <div
              className="absolute inset-0 opacity-5"
              style={{
                background:
                  "radial-gradient(ellipse at center, oklch(0.65 0.18 80) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10">
              <Crown size={40} className="mx-auto mb-3" style={{ color: "oklch(0.65 0.18 80)" }} />
              <h2 className="font-display text-2xl font-black tracking-wider mb-2" style={{ color: "oklch(0.65 0.18 80)" }}>
                TORNEO FINALIZADO
              </h2>
              <p className="text-muted-foreground">El ganador ha sido declarado</p>
            </div>
          </div>
        )}
      </div>

      {/* Result Modal — Score-based */}
      {resultModal && (() => {
        const s1 = parseInt(team1Score);
        const s2 = parseInt(team2Score);
        const scoresValid = !isNaN(s1) && !isNaN(s2) && team1Score !== "" && team2Score !== "";
        const isDraw = scoresValid && s1 === s2;
        const predictedWinner = scoresValid && !isDraw
          ? (s1 > s2 ? resultModal.team1Name : resultModal.team2Name)
          : null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "oklch(0 0 0 / 0.8)" }}
            onClick={() => { setResultModal(null); setTeam1Score(""); setTeam2Score(""); setResultNotes(""); }}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-6"
              style={{
                background: "oklch(0.10 0.005 0)",
                border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                boxShadow: "0 0 40px oklch(0.55 0.22 25 / 0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-5">
                <Swords size={18} style={{ color: "oklch(0.55 0.22 25)" }} />
                <h3 className="font-display text-base font-bold tracking-wider text-foreground">
                  REGISTRAR RESULTADO
                </h3>
              </div>

              {/* Score inputs */}
              <div className="space-y-3 mb-4">
                {/* Team 1 row */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }}
                  >
                    {resultModal.team1Name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-display tracking-wide text-foreground truncate">
                    {resultModal.team1Name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={team1Score}
                    onChange={(e) => setTeam1Score(e.target.value)}
                    placeholder="0"
                    className="w-16 px-2 py-2 rounded-lg text-center text-lg font-mono font-bold transition-all duration-200"
                    style={{
                      background: "oklch(0.09 0.005 0)",
                      border: scoresValid && !isDraw && s1 > s2
                        ? "1px solid oklch(0.65 0.18 145 / 0.7)"
                        : "1px solid oklch(0.22 0.01 0)",
                      color: scoresValid && !isDraw && s1 > s2
                        ? "oklch(0.75 0.18 145)"
                        : "oklch(0.90 0.005 0)",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px" style={{ background: "oklch(0.20 0.01 0)" }} />
                  <span className="text-xs font-mono text-zinc-600">VS</span>
                  <div className="flex-1 h-px" style={{ background: "oklch(0.20 0.01 0)" }} />
                </div>

                {/* Team 2 row */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }}
                  >
                    {resultModal.team2Name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-display tracking-wide text-foreground truncate">
                    {resultModal.team2Name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={team2Score}
                    onChange={(e) => setTeam2Score(e.target.value)}
                    placeholder="0"
                    className="w-16 px-2 py-2 rounded-lg text-center text-lg font-mono font-bold transition-all duration-200"
                    style={{
                      background: "oklch(0.09 0.005 0)",
                      border: scoresValid && !isDraw && s2 > s1
                        ? "1px solid oklch(0.65 0.18 145 / 0.7)"
                        : "1px solid oklch(0.22 0.01 0)",
                      color: scoresValid && !isDraw && s2 > s1
                        ? "oklch(0.75 0.18 145)"
                        : "oklch(0.90 0.005 0)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Live winner preview */}
              {predictedWinner && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
                  style={{ background: "oklch(0.65 0.18 145 / 0.08)", border: "1px solid oklch(0.65 0.18 145 / 0.25)" }}
                >
                  <CheckCircle size={13} style={{ color: "oklch(0.65 0.18 145)" }} />
                  <span className="text-xs font-mono" style={{ color: "oklch(0.75 0.18 145)" }}>
                    Ganador: <strong>{predictedWinner}</strong>
                  </span>
                </div>
              )}
              {isDraw && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
                  style={{ background: "oklch(0.55 0.22 25 / 0.08)", border: "1px solid oklch(0.55 0.22 25 / 0.25)" }}
                >
                  <AlertCircle size={13} style={{ color: "oklch(0.65 0.22 25)" }} />
                  <span className="text-xs font-mono" style={{ color: "oklch(0.65 0.22 25)" }}>
                    El marcador no puede ser empate
                  </span>
                </div>
              )}

              {/* Notes */}
              <div className="mb-5">
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">
                  NOTAS (OPCIONAL)
                </label>
                <input
                  type="text"
                  value={resultNotes}
                  onChange={(e) => setResultNotes(e.target.value)}
                  placeholder="Observaciones del partido..."
                  className="w-full px-3 py-2 rounded-lg text-sm transition-all duration-200"
                  style={{
                    background: "oklch(0.09 0.005 0)",
                    border: "1px solid oklch(0.22 0.01 0)",
                    color: "oklch(0.90 0.005 0)",
                    outline: "none",
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setResultModal(null); setTeam1Score(""); setTeam2Score(""); setResultNotes(""); }}
                  className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest"
                  style={{
                    background: "transparent",
                    border: "1px solid oklch(0.25 0.01 0)",
                    color: "oklch(0.60 0.005 0)",
                  }}
                >
                  CANCELAR
                </button>
                <button
                  onClick={() => {
                    if (!scoresValid) { toast.error("Ingresa el marcador de ambos equipos"); return; }
                    if (isDraw) { toast.error("El marcador no puede ser empate"); return; }
                    updateResultMutation.mutate({
                      matchId: resultModal.matchId,
                      tournamentId: id,
                      team1Score: s1,
                      team2Score: s2,
                      notes: resultNotes || undefined,
                    });
                  }}
                  disabled={!scoresValid || isDraw || updateResultMutation.isPending}
                  className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                  style={{
                    background: "oklch(0.55 0.22 25)",
                    color: "oklch(0.98 0 0)",
                    boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)",
                  }}
                >
                  {updateResultMutation.isPending ? "GUARDANDO..." : "GUARDAR"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Schedule Match Modal */}
      {scheduleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.8)" }}
          onClick={() => setScheduleModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: "oklch(0.10 0.005 0)",
              border: "1px solid oklch(0.55 0.18 220 / 0.4)",
              boxShadow: "0 0 40px oklch(0.55 0.18 220 / 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock size={18} style={{ color: "oklch(0.65 0.18 220)" }} />
              <h3 className="font-display text-base font-bold tracking-wider text-foreground">PROGRAMAR PARTIDO</h3>
            </div>
            <p className="text-xs text-muted-foreground font-mono mb-4 truncate">{scheduleModal.matchLabel}</p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">FECHA</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "oklch(0.09 0.005 0)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.90 0.005 0)", outline: "none" }}
                />
              </div>
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">HORA</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "oklch(0.09 0.005 0)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.90 0.005 0)", outline: "none" }}
                />
              </div>
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">
                  CERRAR APUESTAS (minutos antes)
                </label>
                <div className="flex gap-2">
                  {[15, 30, 60, 120].map((m) => (
                    <button
                      key={m}
                      onClick={() => setBetsCloseMinutes(m)}
                      className="flex-1 py-2 rounded-lg text-xs font-mono transition-all duration-200"
                      style={betsCloseMinutes === m
                        ? { background: "oklch(0.55 0.18 220 / 0.3)", border: "1px solid oklch(0.55 0.18 220 / 0.6)", color: "oklch(0.75 0.18 220)" }
                        : { background: "oklch(0.09 0.005 0)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.50 0.005 0)" }
                      }
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Las apuestas se cerrarán {betsCloseMinutes} minutos antes del inicio.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setScheduleModal(null)}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest"
                style={{ background: "transparent", border: "1px solid oklch(0.25 0.01 0)", color: "oklch(0.60 0.005 0)" }}
              >
                CANCELAR
              </button>
              <button
                onClick={() => {
                  if (!scheduleDate || !scheduleTime) { toast.error("Selecciona fecha y hora"); return; }
                  const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).getTime();
                  if (isNaN(scheduledAt)) { toast.error("Fecha inválida"); return; }
                  if (scheduledAt <= Date.now()) { toast.error("La fecha debe ser en el futuro"); return; }
                  scheduleMatchMutation.mutate({
                    matchId: scheduleModal.matchId,
                    tournamentId: id,
                    scheduledAt,
                    betsCloseMinutesBefore: betsCloseMinutes,
                  });
                }}
                disabled={!scheduleDate || !scheduleTime || scheduleMatchMutation.isPending}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{ background: "oklch(0.55 0.18 220)", color: "oklch(0.98 0 0)", boxShadow: "0 0 12px oklch(0.55 0.18 220 / 0.4)" }}
              >
                {scheduleMatchMutation.isPending ? "GUARDANDO..." : "CONFIRMAR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Declare Winner Modal */}
      {winnerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.8)" }}
          onClick={() => setWinnerModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "oklch(0.10 0.005 0)",
              border: "1px solid oklch(0.65 0.18 80 / 0.4)",
              boxShadow: "0 0 40px oklch(0.65 0.18 80 / 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <Crown size={20} style={{ color: "oklch(0.65 0.18 80)" }} />
              <h3 className="font-display text-lg font-bold tracking-wider text-foreground">
                DECLARAR GANADOR
              </h3>
            </div>

            <p className="text-muted-foreground text-sm mb-4">
              Selecciona el equipo ganador del torneo. Esta acción finalizará el torneo.
            </p>

            <div className="space-y-2 mb-5">
              {registrations?.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setSelectedWinnerId(reg.teamId)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left"
                  style={
                    selectedWinnerId === reg.teamId
                      ? {
                          background: "oklch(0.65 0.18 80 / 0.15)",
                          border: "1px solid oklch(0.65 0.18 80 / 0.5)",
                        }
                      : {
                          background: "oklch(0.12 0.005 0)",
                          border: "1px solid oklch(0.20 0.01 0)",
                        }
                  }
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "oklch(0.55 0.22 25 / 0.15)",
                      color: "oklch(0.65 0.22 25)",
                    }}
                  >
                    {reg.teamName?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <span className="text-sm font-display tracking-wide text-foreground">
                    {reg.teamName ?? `Equipo #${reg.teamId}`}
                  </span>
                  {selectedWinnerId === reg.teamId && (
                    <Crown size={16} className="ml-auto" style={{ color: "oklch(0.65 0.18 80)" }} />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setWinnerModal(false)}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest"
                style={{
                  background: "transparent",
                  border: "1px solid oklch(0.25 0.01 0)",
                  color: "oklch(0.60 0.005 0)",
                }}
              >
                CANCELAR
              </button>
              <button
                onClick={() => {
                  if (!selectedWinnerId) { toast.error("Selecciona un ganador"); return; }
                  declareWinnerMutation.mutate({ tournamentId: id, winnerId: selectedWinnerId });
                }}
                disabled={!selectedWinnerId || declareWinnerMutation.isPending}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{
                  background: "oklch(0.65 0.18 80)",
                  color: "oklch(0.98 0 0)",
                  boxShadow: "0 0 12px oklch(0.65 0.18 80 / 0.4)",
                }}
              >
                {declareWinnerMutation.isPending ? "PROCESANDO..." : "CONFIRMAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PremiumLayout>
  );
}
