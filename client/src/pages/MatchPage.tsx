import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "../lib/trpc";
import { useAuth } from "../_core/hooks/useAuth";
import {
  CheckCircle, XCircle, MessageSquare, AlertTriangle,
  Copy, ChevronLeft, Clock, Swords, Trophy, Users,
  Send, Shield, Activity, Flag
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function timeAgo(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return "hace un momento";
  if (diff < 3600000) return `hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `hace ${Math.floor(diff / 3600000)} h`;
  return `hace ${Math.floor(diff / 86400000)} d`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-gray-700 text-gray-300" },
    in_progress: { label: "En Curso", cls: "bg-green-900/60 text-green-400 border border-green-700" },
    completed: { label: "Completado", cls: "bg-blue-900/60 text-blue-400 border border-blue-700" },
    betting_open: { label: "Apuestas Abiertas", cls: "bg-yellow-900/60 text-yellow-400 border border-yellow-700" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-700 text-gray-300" };
  return <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${s.cls}`}>{s.label}</span>;
}

// ─── Team Card ────────────────────────────────────────────────────────────────
function TeamCard({ team, isWinner, checkedIn, score }: {
  team: any; isWinner: boolean; checkedIn: boolean; score?: number;
}) {
  if (!team) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-xl bg-[#111] border border-[#222] min-h-[120px]">
      <span className="text-gray-500 text-sm">Por determinar</span>
    </div>
  );
  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${
      isWinner ? "bg-[#1a2a1a] border-green-700 shadow-lg shadow-green-900/20" : "bg-[#111] border-[#222]"
    }`}>
      {isWinner && <Trophy className="w-5 h-5 text-yellow-400 mb-2" />}
      {team.logo ? (
        <img src={team.logo} alt={team.name} className="w-16 h-16 rounded-full object-cover mb-3 border-2 border-[#333]" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-[#222] flex items-center justify-center mb-3 text-2xl font-bold text-gray-400 border-2 border-[#333]">
          {team.name?.[0]?.toUpperCase()}
        </div>
      )}
      <span className="font-bold text-white text-lg text-center">{team.name}</span>
      <span className="text-gray-500 text-xs mt-1">#{team.tag}</span>
      {score !== undefined && <span className="text-3xl font-black text-white mt-2">{score}</span>}
      {checkedIn && (
        <span className="mt-2 flex items-center gap-1 text-green-400 text-xs">
          <CheckCircle className="w-3 h-3" /> Check-in confirmado
        </span>
      )}
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
function MatchChat({ matchId, currentUserId }: { matchId: number; currentUserId?: number }) {
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: messages, refetch } = trpc.matchPage.getChat.useQuery({ matchId }, { refetchInterval: 3000 });
  const sendMutation = trpc.matchPage.sendMessage.useMutation({ onSuccess: () => { setMessage(""); refetch(); } });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {!messages?.length && (
          <div className="text-center text-gray-600 text-sm py-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Sin mensajes aún. ¡Sé el primero en escribir!</p>
          </div>
        )}
        {messages?.map((msg: any) => (
          <div key={msg.id} className={`flex gap-2 ${msg.isSystem ? "justify-center" : ""}`}>
            {msg.isSystem ? (
              <span className="text-xs text-gray-500 bg-[#1a1a1a] px-3 py-1 rounded-full">{msg.message}</span>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                  {msg.userAvatar ? <img src={msg.userAvatar} alt="" className="w-full h-full object-cover" /> : msg.userName[0]?.toUpperCase()}
                </div>
                <div className={`max-w-[80%] ${msg.userId === currentUserId ? "ml-auto" : ""}`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-xs font-semibold text-gray-400">{msg.userName}</span>
                    <span className="text-xs text-gray-600">{timeAgo(msg.createdAt)}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-xl text-sm ${
                    msg.userId === currentUserId
                      ? "bg-red-900/40 text-white rounded-tr-none"
                      : "bg-[#1a1a1a] text-gray-200 rounded-tl-none"
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {currentUserId && (
        <form className="flex gap-2 p-3 border-t border-[#222]" onSubmit={e => {
          e.preventDefault();
          if (message.trim()) sendMutation.mutate({ matchId, message: message.trim() });
        }}>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600"
            maxLength={500}
          />
          <button type="submit" disabled={!message.trim() || sendMutation.isPending}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "chat" | "activity">("info");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [reportScore, setReportScore] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const mId = parseInt(matchId || "0");
  const { data, isLoading, refetch } = trpc.matchPage.get.useQuery({ matchId: mId }, { enabled: !!mId, refetchInterval: 10000 });

  const checkInMutation = trpc.matchPage.checkIn.useMutation({ onSuccess: () => refetch() });
  const reportMutation = trpc.matchPage.reportResult.useMutation({ onSuccess: () => { setShowReportForm(false); refetch(); } });
  const confirmMutation = trpc.matchPage.confirmResult.useMutation({ onSuccess: () => refetch() });
  const disputeMutation = trpc.matchPage.disputeResult.useMutation({ onSuccess: () => { setShowDisputeForm(false); refetch(); } });

  const { data: activityLog } = trpc.matchPage.getActivityLog.useQuery(
    { tournamentId: data?.match?.tournamentId || 0 },
    { enabled: !!data?.match?.tournamentId && activeTab === "activity" }
  );

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-gray-500">Cargando match...</div>
    </div>
  );
  if (!data) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-gray-500">Match no encontrado</div>
    </div>
  );

  const { match, tournament, team1, team2, checkins, confirmations, disputes, notes } = data;

  // Determinar si el usuario es parte de algún equipo
  const isPartOfMatch = isAuthenticated; // simplificado — el backend valida
  const team1CheckedIn = checkins.some((c: any) => c.teamId === match.team1Id);
  const team2CheckedIn = checkins.some((c: any) => c.teamId === match.team2Id);
  const hasPendingResult = !!notes.pendingWinner;
  const openDisputes = disputes.filter((d: any) => d.status_md === "open");

  // Parsear seriesFormat
  const seriesFormat = notes.seriesFormat || "BO1";
  const riotCodes: string[] = notes.riotCodes || [];

  // Scores
  const team1Score = match.team1Score ?? 0;
  const team2Score = match.team2Score ?? 0;

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(`/tournaments/${match.tournamentId}`)}
              className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" />
              {tournament?.name || "Torneo"}
            </button>
            <span className="text-gray-700">/</span>
            <span className="text-gray-400 text-sm">Match #{match.id}</span>
          </div>

          {/* VS Header */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={match.status} />
                <span className="text-gray-500 text-xs">{seriesFormat}</span>
                {openDisputes.length > 0 && (
                  <span className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-900/20 px-2 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3" /> {openDisputes.length} disputa{openDisputes.length > 1 ? "s" : ""} abierta{openDisputes.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {match.scheduledAt && (
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Clock className="w-3 h-3" />
                  {formatDate(match.scheduledAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* VS Card */}
            <div className="bg-[#0d0d0d] rounded-xl border border-[#1a1a1a] p-6">
              <div className="flex items-center gap-4">
                <TeamCard
                  team={team1}
                  isWinner={match.winnerId === match.team1Id}
                  checkedIn={team1CheckedIn}
                  score={match.status !== "pending" ? team1Score : undefined}
                />
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <Swords className="w-8 h-8 text-red-600" />
                  <span className="text-gray-600 font-bold text-sm">VS</span>
                  {match.status === "completed" && (
                    <span className="text-xs text-gray-500">Final</span>
                  )}
                </div>
                <TeamCard
                  team={team2}
                  isWinner={match.winnerId === match.team2Id}
                  checkedIn={team2CheckedIn}
                  score={match.status !== "pending" ? team2Score : undefined}
                />
              </div>
            </div>

            {/* Resultado pendiente de confirmación */}
            {hasPendingResult && match.status !== "completed" && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-300 mb-1">Resultado pendiente de confirmación</p>
                    <p className="text-sm text-yellow-200/70 mb-3">
                      {notes.pendingWinner === match.team1Id ? team1?.name : team2?.name} reportó que ganó el match.
                      {notes.pendingScore && ` Score: ${notes.pendingScore}`}
                    </p>
                    {isAuthenticated && (
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => confirmMutation.mutate({ matchId: mId })}
                          disabled={confirmMutation.isPending}
                          className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                          <CheckCircle className="w-4 h-4" /> Confirmar resultado
                        </button>
                        <button onClick={() => setShowDisputeForm(true)}
                          className="flex items-center gap-1 bg-red-900/50 hover:bg-red-800 border border-red-700 text-red-300 px-3 py-1.5 rounded-lg text-sm transition-colors">
                          <XCircle className="w-4 h-4" /> Disputar resultado
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de disputa */}
            {showDisputeForm && (
              <div className="bg-[#0d0d0d] border border-red-800 rounded-xl p-4">
                <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <Flag className="w-4 h-4" /> Reportar disputa
                </h3>
                <textarea
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  placeholder="Describe el problema con detalle (mínimo 10 caracteres)..."
                  className="w-full bg-[#111] border border-[#333] rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600 resize-none h-24"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => disputeMutation.mutate({ matchId: mId, reason: disputeReason })}
                    disabled={disputeReason.length < 10 || disputeMutation.isPending}
                    className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Enviar disputa
                  </button>
                  <button onClick={() => setShowDisputeForm(false)}
                    className="bg-[#222] hover:bg-[#333] text-gray-400 px-4 py-2 rounded-lg text-sm transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-[#0d0d0d] rounded-xl border border-[#1a1a1a] overflow-hidden">
              <div className="flex border-b border-[#1a1a1a]">
                {[
                  { id: "info", label: "Información", icon: Shield },
                  { id: "chat", label: "Chat", icon: MessageSquare },
                  { id: "activity", label: "Actividad", icon: Activity },
                ].map(tab => (
                  <button key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-white border-b-2 border-red-600"
                        : "text-gray-500 hover:text-gray-300"
                    }`}>
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="h-80">
                {activeTab === "info" && (
                  <div className="p-4 space-y-4 overflow-y-auto h-full">
                    {/* Códigos de sala Riot */}
                    {riotCodes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Códigos de Sala Riot</h4>
                        <div className="space-y-2">
                          {riotCodes.map((code: string, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-[#111] border border-[#222] rounded-lg px-3 py-2">
                              <div>
                                <span className="text-xs text-gray-500">Juego {i + 1}</span>
                                <p className="font-mono text-sm text-white">{code}</p>
                              </div>
                              <button onClick={() => copyToClipboard(code, `code-${i}`)}
                                className="text-gray-500 hover:text-white transition-colors">
                                {copied === `code-${i}` ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          En LoL: <strong>Jugar → Personalizada → Unirse con código</strong>
                        </p>
                      </div>
                    )}

                    {/* Info del match */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Formato", value: seriesFormat },
                        { label: "Ronda", value: notes.round || match.bracketPosition || "—" },
                        { label: "Torneo", value: tournament?.name || "—" },
                        { label: "Juego", value: tournament?.game || "—" },
                      ].map(item => (
                        <div key={item.label} className="bg-[#111] rounded-lg p-3">
                          <span className="text-xs text-gray-500 uppercase">{item.label}</span>
                          <p className="text-sm text-white font-medium mt-0.5">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Stats de Riot si existen */}
                    {notes.riotStats && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Stats de Partida (Riot)</h4>
                        <div className="space-y-1">
                          {notes.riotStats.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-[#111] rounded px-3 py-2 text-xs">
                              <span className="text-gray-400">{p.summonerName}</span>
                              <span className="text-white">{p.championName}</span>
                              <span className={p.win ? "text-green-400" : "text-red-400"}>{p.kills}/{p.deaths}/{p.assists}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "chat" && (
                  <MatchChat matchId={mId} currentUserId={user?.id} />
                )}

                {activeTab === "activity" && (
                  <div className="p-4 overflow-y-auto h-full space-y-2">
                    {!activityLog?.length && (
                      <div className="text-center text-gray-600 text-sm py-8">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Sin actividad registrada
                      </div>
                    )}
                    {activityLog?.filter((a: any) => !a.matchId || a.matchId === mId).map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-gray-300">{log.description}</p>
                          <p className="text-xs text-gray-600">{timeAgo(log.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Acciones del jugador */}
            {isAuthenticated && match.status !== "completed" && (
              <div className="bg-[#0d0d0d] rounded-xl border border-[#1a1a1a] p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-500" /> Mis Acciones
                </h3>
                <div className="space-y-2">
                  {/* Check-in */}
                  <button
                    onClick={() => checkInMutation.mutate({ matchId: mId })}
                    disabled={checkInMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 bg-green-900/30 hover:bg-green-900/50 border border-green-800 text-green-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" />
                    {checkInMutation.isPending ? "Confirmando..." : "Confirmar Presencia (Check-in)"}
                  </button>

                  {/* Reportar resultado */}
                  {!hasPendingResult && (
                    <button
                      onClick={() => setShowReportForm(!showReportForm)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 text-blue-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                      <Trophy className="w-4 h-4" />
                      Reportar Resultado
                    </button>
                  )}

                  {showReportForm && (
                    <div className="bg-[#111] border border-[#222] rounded-lg p-3 space-y-2">
                      <p className="text-xs text-gray-500">¿Qué equipo ganó?</p>
                      <div className="space-y-1">
                        {[team1, team2].filter(Boolean).map((team: any) => (
                          <button key={team.id}
                            onClick={() => reportMutation.mutate({
                              matchId: mId,
                              winnerTeamId: team.id,
                              score: reportScore || undefined,
                            })}
                            disabled={reportMutation.isPending}
                            className="w-full text-left flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white transition-colors disabled:opacity-50">
                            {team.logo && <img src={team.logo} alt="" className="w-5 h-5 rounded-full" />}
                            {team.name}
                          </button>
                        ))}
                      </div>
                      <input
                        value={reportScore}
                        onChange={e => setReportScore(e.target.value)}
                        placeholder="Score (ej: 2-1) — opcional"
                        className="w-full bg-[#0d0d0d] border border-[#333] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Estado del check-in */}
            <div className="bg-[#0d0d0d] rounded-xl border border-[#1a1a1a] p-4">
              <h3 className="font-semibold text-white mb-3 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> Estado del Check-in
              </h3>
              <div className="space-y-2">
                {[
                  { team: team1, checkedIn: team1CheckedIn },
                  { team: team2, checkedIn: team2CheckedIn },
                ].map(({ team, checkedIn }) => (
                  <div key={team?.id || Math.random()} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{team?.name || "Por determinar"}</span>
                    {checkedIn
                      ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="w-3 h-3" /> Listo</span>
                      : <span className="flex items-center gap-1 text-gray-600 text-xs"><Clock className="w-3 h-3" /> Esperando</span>
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Disputas abiertas */}
            {openDisputes.length > 0 && (
              <div className="bg-yellow-900/10 rounded-xl border border-yellow-800 p-4">
                <h3 className="font-semibold text-yellow-400 mb-2 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Disputas Abiertas
                </h3>
                {openDisputes.map((d: any) => (
                  <div key={d.id} className="text-xs text-yellow-200/70 bg-yellow-900/20 rounded p-2 mb-1">
                    {d.reason.substring(0, 100)}{d.reason.length > 100 ? "..." : ""}
                  </div>
                ))}
                <p className="text-xs text-yellow-600 mt-2">El organizador resolverá esta disputa.</p>
              </div>
            )}

            {/* Link al torneo */}
            <Link to={`/tournaments/${match.tournamentId}`}
              className="flex items-center justify-center gap-2 w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-gray-400 hover:text-white px-4 py-2.5 rounded-xl text-sm transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Ver torneo completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
