import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import BracketView from "@/components/BracketView";
import {
  Trophy,
  Calendar,
  Users,
  Shield,
  ChevronLeft,
  Swords,
  Clock,
  AlertCircle,
  CheckCircle,
  Star,
  Zap,
  ChevronRight,
  Crown,
} from "lucide-react";
import { useState, useRef } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

const BRACKET_LABELS: Record<string, string> = {
  single_elimination: "Eliminación Simple",
  double_elimination: "Doble Eliminación",
  groups: "Fase de Grupos",
};
const STATUS_COLORS: Record<string, string> = {
  registration_open: "oklch(0.65 0.18 145)",
  in_progress: "oklch(0.65 0.18 80)",
  completed: "oklch(0.50 0.005 0)",
  draft: "oklch(0.55 0.18 220)",
  registration_closed: "oklch(0.55 0.22 25)",
  cancelled: "oklch(0.40 0.005 0)",
};
const STATUS_LABELS: Record<string, string> = {
  registration_open: "Inscripciones Abiertas",
  in_progress: "En Curso",
  completed: "Finalizado",
  draft: "Próximamente",
  registration_closed: "Inscripciones Cerradas",
  cancelled: "Cancelado",
};

// ─── Team Card for Carousel ───────────────────────────────────────────────────
function TeamCard({
  team,
}: {
  team: {
    teamId: number;
    teamName: string;
    teamLogo: string | null;
    teamTag: string | null;
    teamPoints: number;
    teamIsVerified: boolean;
    captainName: string | null;
    rankPosition: number;
    tournamentWins: number;
    tournamentLosses: number;
  };
}) {
  const hasPlayed = team.tournamentWins + team.tournamentLosses > 0;
  return (
    <Link href={`/teams/${team.teamId}`}>
      <div
        className="flex-shrink-0 w-52 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-105"
        style={{
          background: "oklch(0.10 0.005 0)",
          border: "1px solid oklch(0.18 0.01 0)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.55 0.22 25 / 0.5)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 20px oklch(0.55 0.22 25 / 0.15)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.18 0.01 0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-3">
          {team.teamLogo ? (
            <img
              src={team.teamLogo}
              alt={team.teamName}
              className="w-14 h-14 rounded-full object-cover"
              style={{ border: "2px solid oklch(0.55 0.22 25 / 0.4)" }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black"
              style={{
                background: "oklch(0.55 0.22 25 / 0.15)",
                border: "2px solid oklch(0.55 0.22 25 / 0.4)",
                color: "oklch(0.70 0.28 25)",
              }}
            >
              {team.teamName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {/* Name + tag */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-1">
            <span className="font-display text-sm font-bold tracking-wide text-foreground truncate max-w-[120px]">
              {team.teamName}
            </span>
            {team.teamIsVerified && (
              <CheckCircle size={12} style={{ color: "oklch(0.65 0.18 145)", flexShrink: 0 }} />
            )}
          </div>
          {team.teamTag && (
            <span className="text-xs font-mono text-muted-foreground">[{team.teamTag}]</span>
          )}
        </div>
        {/* Captain */}
        {team.captainName && (
          <div className="text-center mb-3">
            <span className="text-xs text-muted-foreground">Cap: </span>
            <span className="text-xs text-foreground font-mono">{team.captainName}</span>
          </div>
        )}
        {/* Stats row */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-muted-foreground">#{team.rankPosition}</span>
          {hasPlayed ? (
            <span className="font-mono font-bold">
              <span style={{ color: "oklch(0.65 0.18 145)" }}>{team.tournamentWins}V</span>
              <span className="text-muted-foreground mx-0.5">-</span>
              <span style={{ color: "oklch(0.55 0.22 25)" }}>{team.tournamentLosses}D</span>
            </span>
          ) : (
            <span className="text-muted-foreground font-mono text-xs">Sin partidos</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TournamentDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const { isAuthenticated, user } = useAuth();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamMessage, setTeamMessage] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);

  const { data: tournament, isLoading } = trpc.tournaments.byId.useQuery({ id });
  const { data: myTeams } = trpc.teams.myTeams.useQuery(undefined, { enabled: isAuthenticated });
  const { data: matches, refetch: refetchMatches } = trpc.matches.byTournament.useQuery({ tournamentId: id });
  const { data: registeredTeams, refetch: refetchTeams } = trpc.tournaments.registeredTeams.useQuery({ tournamentId: id });

  const updateResultMutation = trpc.matches.updateResult.useMutation({
    onSuccess: () => {
      toast.success("Resultado registrado");
      refetchMatches();
      refetchTeams();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateBracketMutation = trpc.matches.generateBracketManual.useMutation({
    onSuccess: (data) => {
      toast.success(`Bracket generado con ${data.matchCount} partidos`);
      refetchMatches();
    },
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.registrations.register.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud de inscripción enviada! El organizador revisará tu solicitud.");
      setShowRegisterModal(false);
      setSelectedTeamId(null);
      setTeamMessage("");
    },
    onError: (err) => toast.error(err.message),
  });

  const scrollCarousel = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir === "right" ? 220 : -220, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="w-12 h-12 rounded-full border-2 animate-spin"
          style={{ borderColor: "oklch(0.55 0.22 25)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Torneo no encontrado</h2>
          <Link href="/tournaments">
            <button
              className="mt-4 px-6 py-2 rounded-lg font-display text-sm tracking-wider"
              style={{ background: "oklch(0.55 0.22 25)", color: "white" }}
            >
              VER TORNEOS
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[tournament.status] ?? "oklch(0.55 0.22 25)";
  const statusLabel = STATUS_LABELS[tournament.status] ?? tournament.status;
  const isOrganizer = user?.id === tournament.creatorId || user?.role === "admin";
  const canGenerateBracket =
    isOrganizer &&
    (tournament.status === "registration_closed" || tournament.status === "in_progress") &&
    (!matches || matches.length === 0);
  const hasBracket = matches && matches.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: "460px" }}>
        {tournament.banner ? (
          <img
            src={tournament.banner}
            alt={tournament.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.12 0.03 25) 0%, oklch(0.07 0.005 0) 60%, oklch(0.10 0.01 0) 100%)",
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.95) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, transparent 60%)" }}
        />

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link href="/tournaments">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-300 hover:text-white transition-colors text-xs font-mono tracking-wider"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
              }}
            >
              <ChevronLeft size={14} /> VOLVER A TORNEOS
            </button>
          </Link>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 max-w-4xl">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="text-xs font-display tracking-wider px-3 py-1 rounded-full font-bold"
              style={{
                background: `${statusColor}30`,
                border: `1px solid ${statusColor}60`,
                color: statusColor,
              }}
            >
              {statusLabel}
            </span>
            {tournament.game && (
              <span
                className="text-xs font-mono px-3 py-1 rounded"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {tournament.game}
              </span>
            )}
            <span
              className="text-xs font-mono px-3 py-1 rounded"
              style={{
                background: "rgba(0,0,0,0.5)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {BRACKET_LABELS[tournament.bracketType] ?? tournament.bracketType}
            </span>
          </div>

          {/* Organizer */}
          {tournament.creatorName && (
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "oklch(0.55 0.22 25 / 0.8)", color: "white" }}
              >
                {tournament.creatorName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-zinc-300 font-mono">
                Organizado por{" "}
                {tournament.creatorId ? (
                  <Link
                    href={`/profile/${tournament.creatorId}`}
                    className="text-white font-semibold hover:text-red-400 transition-colors"
                  >
                    {tournament.creatorName}
                  </Link>
                ) : (
                  <span className="text-white font-semibold">{tournament.creatorName}</span>
                )}
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            className="font-display text-4xl md:text-5xl font-black tracking-wider text-white mb-3 drop-shadow-lg"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
          >
            {tournament.name}
          </h1>

          {/* Description */}
          {tournament.description && (
            <p className="text-zinc-300 text-sm leading-relaxed mb-4 max-w-xl">
              {tournament.description}
            </p>
          )}

          {/* Quick info row */}
          <div className="flex flex-wrap items-center gap-4 mb-5">
            <span className="flex items-center gap-1.5 text-sm text-zinc-300">
              <Users size={14} style={{ color: statusColor }} />
              <span className="font-mono">
                {registeredTeams?.length ?? 0}/{tournament.maxTeams} equipos
              </span>
            </span>
            {tournament.prizeAmount ? (
              <span className="flex items-center gap-1.5 text-sm">
                <Trophy size={14} style={{ color: "oklch(0.65 0.18 80)" }} />
                <span
                  className="font-orbitron font-bold"
                  style={{ color: "oklch(0.65 0.18 80)" }}
                >
                  {tournament.prizeAmount} RLC
                </span>
              </span>
            ) : tournament.prizeDescription ? (
              <span className="flex items-center gap-1.5 text-sm text-zinc-300">
                <Trophy size={14} style={{ color: "oklch(0.65 0.18 80)" }} />
                <span>{tournament.prizeDescription}</span>
              </span>
            ) : null}
            {tournament.startDate && (
              <span className="flex items-center gap-1.5 text-sm text-zinc-300">
                <Calendar size={14} style={{ color: statusColor }} />
                <span className="font-mono">
                  {new Date(tournament.startDate).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </span>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            {tournament.status === "registration_open" &&
              (isAuthenticated ? (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-6 py-2.5 rounded-lg font-display text-sm tracking-widest transition-all duration-300"
                  style={{
                    background: "oklch(0.55 0.22 25)",
                    color: "white",
                    boxShadow: "0 0 20px oklch(0.55 0.22 25 / 0.5)",
                  }}
                >
                  INSCRIBIR EQUIPO
                </button>
              ) : (
                <button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="px-6 py-2.5 rounded-lg font-display text-sm tracking-widest transition-all duration-300"
                  style={{ background: "oklch(0.55 0.22 25)", color: "white" }}
                >
                  INICIAR SESIÓN PARA INSCRIBIRSE
                </button>
              ))}
            {canGenerateBracket && (
              <button
                onClick={() => generateBracketMutation.mutate({ tournamentId: id })}
                disabled={generateBracketMutation.isPending}
                className="px-6 py-2.5 rounded-lg font-display text-sm tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{
                  background: "oklch(0.55 0.18 220)",
                  color: "white",
                  boxShadow: "0 0 20px oklch(0.55 0.18 220 / 0.4)",
                }}
              >
                <Zap size={14} className="inline mr-1.5" />
                {generateBracketMutation.isPending ? "GENERANDO..." : "GENERAR BRACKET"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── CONTENT ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* ─── EQUIPOS INSCRITOS ──────────────────────────────────────────────── */}
        {registeredTeams && registeredTeams.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold tracking-wider text-foreground flex items-center gap-2">
                <Shield size={18} style={{ color: "oklch(0.55 0.22 25)" }} />
                EQUIPOS INSCRITOS
                <span className="text-sm font-mono text-muted-foreground ml-1">
                  ({registeredTeams.length})
                </span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => scrollCarousel("left")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background: "oklch(0.12 0.005 0)",
                    border: "1px solid oklch(0.20 0.01 0)",
                    color: "oklch(0.70 0.005 0)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "oklch(0.55 0.22 25 / 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.20 0.01 0)";
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => scrollCarousel("right")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background: "oklch(0.12 0.005 0)",
                    border: "1px solid oklch(0.20 0.01 0)",
                    color: "oklch(0.70 0.005 0)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "oklch(0.55 0.22 25 / 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.20 0.01 0)";
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {registeredTeams.map((team) => (
                <TeamCard key={team.teamId} team={team} />
              ))}
            </div>
          </section>
        )}

        {/* ─── INFO GRID ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: <Users size={20} />,
                  label: "Máx. Equipos",
                  value: tournament.maxTeams.toString(),
                },
                {
                  icon: <Shield size={20} />,
                  label: "Jugadores/Equipo",
                  value: `${tournament.minPlayersPerTeam}-${tournament.maxPlayersPerTeam}`,
                },
                {
                  icon: <Swords size={20} />,
                  label: "Formato",
                  value: BRACKET_LABELS[tournament.bracketType] ?? tournament.bracketType,
                },
                {
                  icon: <Trophy size={20} />,
                  label: "Premio",
                  value:
                    tournament.prizeDescription ??
                    (tournament.prizeAmount ? `${tournament.prizeAmount} RLC` : "Sin premio"),
                },
              ].map((info) => (
                <div
                  key={info.label}
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: "oklch(0.10 0.005 0)",
                    border: "1px solid oklch(0.18 0.01 0)",
                  }}
                >
                  <div className="neon-text flex justify-center mb-2">{info.icon}</div>
                  <div className="font-display text-sm font-bold text-foreground tracking-wide">
                    {info.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{info.label}</div>
                </div>
              ))}
            </div>

            {/* Prize breakdown */}
            {(tournament.prizeFirst || tournament.prizeSecond || tournament.prizeThird) && (
              <div
                className="rounded-xl p-6"
                style={{
                  background: "oklch(0.10 0.005 0)",
                  border: "1px solid oklch(0.18 0.01 0)",
                }}
              >
                <h2 className="font-display text-lg font-bold tracking-wider text-foreground mb-4 flex items-center gap-2">
                  <Trophy size={16} style={{ color: "oklch(0.65 0.18 80)" }} />
                  PREMIOS
                </h2>
                <div className="space-y-3">
                  {tournament.prizeFirst && (
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{
                        background: "oklch(0.65 0.18 80 / 0.08)",
                        border: "1px solid oklch(0.65 0.18 80 / 0.2)",
                      }}
                    >
                      <Crown size={18} style={{ color: "oklch(0.65 0.18 80)" }} />
                      <div>
                        <div className="text-xs text-muted-foreground font-mono">1er LUGAR</div>
                        <div className="font-display text-sm font-bold text-foreground">
                          {tournament.prizeFirst}
                        </div>
                      </div>
                    </div>
                  )}
                  {tournament.prizeSecond && (
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{
                        background: "oklch(0.75 0.005 0 / 0.08)",
                        border: "1px solid oklch(0.50 0.005 0 / 0.3)",
                      }}
                    >
                      <Star size={18} style={{ color: "oklch(0.75 0.005 0)" }} />
                      <div>
                        <div className="text-xs text-muted-foreground font-mono">2do LUGAR</div>
                        <div className="font-display text-sm font-bold text-foreground">
                          {tournament.prizeSecond}
                        </div>
                      </div>
                    </div>
                  )}
                  {tournament.prizeThird && (
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{
                        background: "oklch(0.55 0.18 50 / 0.08)",
                        border: "1px solid oklch(0.55 0.18 50 / 0.2)",
                      }}
                    >
                      <Star size={18} style={{ color: "oklch(0.55 0.18 50)" }} />
                      <div>
                        <div className="text-xs text-muted-foreground font-mono">3er LUGAR</div>
                        <div className="font-display text-sm font-bold text-foreground">
                          {tournament.prizeThird}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rules */}
            {tournament.rules && (
              <div
                className="rounded-xl p-6"
                style={{
                  background: "oklch(0.10 0.005 0)",
                  border: "1px solid oklch(0.18 0.01 0)",
                }}
              >
                <h2 className="font-display text-lg font-bold tracking-wider text-foreground mb-4">
                  REGLAS DEL TORNEO
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {tournament.rules}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Dates */}
            <div
              className="rounded-xl p-5"
              style={{
                background: "oklch(0.10 0.005 0)",
                border: "1px solid oklch(0.18 0.01 0)",
              }}
            >
              <h3 className="font-display text-sm font-bold tracking-wider text-foreground mb-4">
                FECHAS IMPORTANTES
              </h3>
              <div className="space-y-3">
                {tournament.registrationStart && (
                  <div className="flex items-start gap-3">
                    <Clock size={14} className="mt-0.5" style={{ color: "oklch(0.55 0.22 25)" }} />
                    <div>
                      <div className="text-xs text-muted-foreground">Inicio inscripciones</div>
                      <div className="text-sm text-foreground font-display tracking-wide">
                        {new Date(tournament.registrationStart).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {tournament.registrationEnd && (
                  <div className="flex items-start gap-3">
                    <Clock size={14} className="mt-0.5" style={{ color: "oklch(0.55 0.22 25)" }} />
                    <div>
                      <div className="text-xs text-muted-foreground">Cierre inscripciones</div>
                      <div className="text-sm text-foreground font-display tracking-wide">
                        {new Date(tournament.registrationEnd).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {tournament.startDate && (
                  <div className="flex items-start gap-3">
                    <Calendar
                      size={14}
                      className="mt-0.5"
                      style={{ color: "oklch(0.65 0.18 80)" }}
                    />
                    <div>
                      <div className="text-xs text-muted-foreground">Inicio del torneo</div>
                      <div className="text-sm text-foreground font-display tracking-wide">
                        {new Date(tournament.startDate).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {tournament.endDate && (
                  <div className="flex items-start gap-3">
                    <Calendar
                      size={14}
                      className="mt-0.5"
                      style={{ color: "oklch(0.65 0.18 80)" }}
                    />
                    <div>
                      <div className="text-xs text-muted-foreground">Fin del torneo</div>
                      <div className="text-sm text-foreground font-display tracking-wide">
                        {new Date(tournament.endDate).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Organizer */}
            <div
              className="rounded-xl p-5"
              style={{
                background: "oklch(0.10 0.005 0)",
                border: "1px solid oklch(0.18 0.01 0)",
              }}
            >
              <h3 className="font-display text-sm font-bold tracking-wider text-foreground mb-4">
                ORGANIZADOR
              </h3>
              {tournament.creatorId ? (
                <Link href={`/profile/${tournament.creatorId}`} className="flex items-center gap-3 group">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                    style={{
                      background: "oklch(0.55 0.22 25 / 0.2)",
                      border: "1px solid oklch(0.55 0.22 25 / 0.5)",
                      color: "oklch(0.70 0.28 25)",
                    }}
                  >
                    {tournament.creatorName?.charAt(0)?.toUpperCase() ?? "O"}
                  </div>
                  <span className="text-sm text-foreground font-display tracking-wide group-hover:text-red-400 transition-colors">
                    {tournament.creatorName ?? "Organizador"}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: "oklch(0.55 0.22 25 / 0.2)",
                      border: "1px solid oklch(0.55 0.22 25 / 0.5)",
                      color: "oklch(0.70 0.28 25)",
                    }}
                  >
                    {tournament.creatorName?.charAt(0)?.toUpperCase() ?? "O"}
                  </div>
                  <span className="text-sm text-foreground font-display tracking-wide">
                    {tournament.creatorName ?? "Organizador"}
                  </span>
                </div>
              )}
            </div>

            {/* Register CTA */}
            <div
              className="rounded-xl p-5"
              style={{
                background: "oklch(0.10 0.005 0)",
                border: "1px solid oklch(0.18 0.01 0)",
              }}
            >
              <h3 className="font-display text-sm font-bold tracking-wider text-foreground mb-4">
                PARTICIPAR
              </h3>
              {tournament.status === "registration_open" ? (
                isAuthenticated ? (
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="w-full py-3 rounded-lg font-display text-sm tracking-widest transition-all duration-300"
                    style={{
                      background: "oklch(0.55 0.22 25)",
                      color: "white",
                      boxShadow: "0 0 15px oklch(0.55 0.22 25 / 0.4)",
                    }}
                  >
                    INSCRIBIR EQUIPO
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-xs text-center">
                      Inicia sesión para inscribir tu equipo
                    </p>
                    <button
                      onClick={() => (window.location.href = getLoginUrl())}
                      className="w-full py-3 rounded-lg font-display text-sm tracking-widest transition-all duration-300"
                      style={{ background: "oklch(0.55 0.22 25)", color: "white" }}
                    >
                      INICIAR SESIÓN
                    </button>
                  </div>
                )
              ) : (
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "oklch(0.50 0.005 0)" }}
                >
                  <AlertCircle size={16} />
                  <span className="font-display tracking-wider text-xs">
                    {tournament.status === "completed"
                      ? "Torneo finalizado"
                      : tournament.status === "in_progress"
                      ? "Torneo en curso"
                      : "Inscripciones cerradas"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ─── BRACKET ────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold tracking-wider text-foreground flex items-center gap-2">
              <Swords size={18} style={{ color: "oklch(0.55 0.22 25)" }} />
              BRACKET DEL TORNEO
              {hasBracket && (
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full ml-1"
                  style={{
                    background: "oklch(0.65 0.18 80 / 0.15)",
                    color: "oklch(0.65 0.18 80)",
                    border: "1px solid oklch(0.65 0.18 80 / 0.3)",
                  }}
                >
                  {matches!.filter((m) => m.status === "completed").length}/{matches!.length}{" "}
                  partidas
                </span>
              )}
            </h2>
            {isOrganizer && hasBracket && tournament.status === "in_progress" && (
              <button
                onClick={() => generateBracketMutation.mutate({ tournamentId: id })}
                disabled={generateBracketMutation.isPending}
                className="px-4 py-1.5 rounded-lg font-display text-xs tracking-widest transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "oklch(0.12 0.005 0)",
                  border: "1px solid oklch(0.55 0.22 25 / 0.4)",
                  color: "oklch(0.70 0.28 25)",
                }}
              >
                {generateBracketMutation.isPending ? "REGENERANDO..." : "REGENERAR BRACKET"}
              </button>
            )}
          </div>

          {!hasBracket ? (
            <div
              className="rounded-xl p-12 text-center"
              style={{
                background: "oklch(0.10 0.005 0)",
                border: "1px dashed oklch(0.22 0.01 0)",
              }}
            >
              <Swords size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-display text-sm tracking-wider text-muted-foreground mb-2">
                {tournament.status === "registration_open"
                  ? "El bracket se generará cuando cierren las inscripciones"
                  : tournament.status === "registration_closed" && isOrganizer
                  ? "Las inscripciones están cerradas. Genera el bracket para comenzar."
                  : "El bracket aún no ha sido generado"}
              </p>
              {canGenerateBracket && (
                <button
                  onClick={() => generateBracketMutation.mutate({ tournamentId: id })}
                  disabled={generateBracketMutation.isPending}
                  className="mt-4 px-6 py-2.5 rounded-lg font-display text-sm tracking-widest transition-all duration-300 disabled:opacity-50"
                  style={{
                    background: "oklch(0.55 0.22 25)",
                    color: "white",
                    boxShadow: "0 0 20px oklch(0.55 0.22 25 / 0.4)",
                  }}
                >
                  <Zap size={14} className="inline mr-1.5" />
                  {generateBracketMutation.isPending ? "GENERANDO..." : "GENERAR BRACKET AHORA"}
                </button>
              )}
            </div>
          ) : (
            <div
              className="rounded-xl overflow-x-auto"
              style={{
                background: "oklch(0.08 0.005 0)",
                border: "1px solid oklch(0.15 0.01 0)",
              }}
            >
              <div className="p-6" style={{ minWidth: "fit-content" }}>
                <BracketView
                  matches={matches ?? []}
                  showDemo={false}
                  canEditResults={tournament.status === "in_progress" && isOrganizer}
                  onDeclareWinner={async (matchId, team1Score, team2Score) => {
                    await updateResultMutation.mutateAsync({ matchId, tournamentId: id, team1Score, team2Score });
                  }}
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ─── REGISTER MODAL ───────────────────────────────────────────────────── */}
      {showRegisterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.8)" }}
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "oklch(0.10 0.005 0)",
              border: "1px solid oklch(0.55 0.22 25 / 0.3)",
              boxShadow: "0 0 40px oklch(0.55 0.22 25 / 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-2">
              INSCRIBIR EQUIPO
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Selecciona el equipo que deseas inscribir en{" "}
              <span className="text-foreground font-semibold">{tournament.name}</span>
            </p>
            {!myTeams || myTeams.length === 0 ? (
              <div className="text-center py-6">
                <Shield size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground text-sm mb-4">No tienes equipos creados</p>
                <Link href="/my-teams">
                  <button
                    className="px-4 py-2 rounded-lg font-display text-xs tracking-widest"
                    style={{ background: "oklch(0.55 0.22 25)", color: "white" }}
                  >
                    CREAR EQUIPO
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {myTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left"
                      style={
                        selectedTeamId === team.id
                          ? {
                              background: "oklch(0.55 0.22 25 / 0.15)",
                              border: "1px solid oklch(0.55 0.22 25 / 0.5)",
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
                          background: "oklch(0.55 0.22 25 / 0.2)",
                          color: "oklch(0.70 0.28 25)",
                        }}
                      >
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-display tracking-wide text-foreground">
                          {team.name}
                        </div>
                        {team.game && (
                          <div className="text-xs text-muted-foreground">{team.game}</div>
                        )}
                      </div>
                      {selectedTeamId === team.id && (
                        <CheckCircle
                          size={16}
                          className="ml-auto"
                          style={{ color: "oklch(0.65 0.22 25)" }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
                    MENSAJE PARA EL ORGANIZADOR (OPCIONAL)
                  </label>
                  <textarea
                    value={teamMessage}
                    onChange={(e) => setTeamMessage(e.target.value)}
                    placeholder="Información adicional sobre tu equipo..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg text-sm font-sans resize-none transition-all duration-200"
                    style={{
                      background: "oklch(0.09 0.005 0)",
                      border: "1px solid oklch(0.22 0.01 0)",
                      color: "oklch(0.90 0.005 0)",
                      outline: "none",
                    }}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowRegisterModal(false)}
                    className="flex-1 py-3 rounded-lg font-display text-xs tracking-widest transition-all duration-200"
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
                      if (!selectedTeamId) {
                        toast.error("Selecciona un equipo para inscribir");
                        return;
                      }
                      registerMutation.mutate({
                        tournamentId: id,
                        teamId: selectedTeamId,
                        teamMessage: teamMessage || undefined,
                      });
                    }}
                    disabled={!selectedTeamId || registerMutation.isPending}
                    className="flex-1 py-3 rounded-lg font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                    style={{
                      background: "oklch(0.55 0.22 25)",
                      color: "white",
                      boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)",
                    }}
                  >
                    {registerMutation.isPending ? "ENVIANDO..." : "INSCRIBIR"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
