import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Coins, Lock, Trophy, Zap, Clock, Swords, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// Countdown hook
function useCountdown(targetMs: number | null) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!targetMs) { setRemaining(null); return; }
    const update = () => setRemaining(Math.max(0, targetMs - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return remaining;
}

function CountdownBadge({ targetMs }: { targetMs: number }) {
  const remaining = useCountdown(targetMs);
  if (remaining === null) return null;
  if (remaining <= 0) return (
    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "oklch(0.55 0.22 25 / 0.2)", color: "oklch(0.65 0.22 25)" }}>
      CERRADAS
    </span>
  );
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const label = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  const isUrgent = remaining < 300000;
  return (
    <span
      className="text-xs font-mono px-2 py-0.5 rounded flex items-center gap-1"
      style={isUrgent
        ? { background: "oklch(0.55 0.22 25 / 0.25)", color: "oklch(0.75 0.22 25)" }
        : { background: "oklch(0.55 0.18 145 / 0.15)", color: "oklch(0.65 0.18 145)" }
      }
    >
      <Clock size={10} />
      {label}
    </span>
  );
}

type OpenMatch = {
  matchId: number;
  tournamentId: number;
  tournamentName: string;
  game: string;
  round: number;
  matchNumber: number;
  team1Id: number | null;
  team1Name: string;
  team2Id: number | null;
  team2Name: string;
  scheduledAt: Date;
  betsCloseAt: Date;
  team1TotalBets: number;
  team2TotalBets: number;
};

export default function Betting() {
  const { isAuthenticated } = useAuth();
  const [selectedMatch, setSelectedMatch] = useState<OpenMatch | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(100);

  const { data: wallet, refetch: refetchWallet } = trpc.auth.wallet.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myBets, refetch: refetchMyBets } = trpc.bets.myBets.useQuery(undefined, { enabled: isAuthenticated });
  const { data: openMatches, isLoading } = trpc.bets.openMatches.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const placeOnMatch = trpc.bets.placeOnMatch.useMutation({
    onSuccess: (data) => {
      toast.success(`Apuesta realizada! Ganancia potencial: ${data.potentialWin.toLocaleString()} RLC (x${data.multiplier})`);
      setSelectedMatch(null);
      setSelectedTeamId(null);
      setBetAmount(100);
      refetchWallet();
      refetchMyBets();
    },
    onError: (err: { message: string }) => toast.error("Error al apostar", { description: err.message }),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-main)" }}>
        <div className="pt-24 pb-16 text-center">
          <div className="rounded-2xl p-12" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.20 0.01 0)" }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "oklch(0.55 0.22 25 / 0.1)", border: "1px solid oklch(0.55 0.22 25 / 0.3)" }}>
              <Lock className="w-10 h-10" style={{ color: "oklch(0.65 0.22 25)" }} />
            </div>
            <h2 className="font-display font-black text-2xl text-foreground mb-3 tracking-wider">ACCESO RESTRINGIDO</h2>
            <p className="text-muted-foreground mb-6">Debes iniciar sesion para acceder al centro de apuestas y usar tus RLC Coins.</p>
            <a href={getLoginUrl()}>
              <Button className="font-display text-xs tracking-wider" style={{ background: "oklch(0.55 0.22 25)", color: "var(--text-primary)" }}>
                INICIAR SESION
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;

  const getMultiplierPreview = (match: OpenMatch, teamId: number) => {
    const totalOnTeam = teamId === match.team1Id ? match.team1TotalBets : match.team2TotalBets;
    const totalOpponent = teamId === match.team1Id ? match.team2TotalBets : match.team1TotalBets;
    const ratio = totalOpponent > 0 ? (totalOnTeam + totalOpponent) / (totalOnTeam + betAmount) : 1.5;
    return Math.min(3.0, Math.max(1.2, parseFloat(ratio.toFixed(2))));
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-main)" }}>
      <div className="pt-6 sm:pt-24 pb-16 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5" style={{ color: "oklch(0.75 0.18 80)" }} />
              <h1 className="font-display font-black text-3xl text-foreground tracking-wider">CENTRO DE APUESTAS</h1>
            </div>
            <p className="text-muted-foreground text-sm">Apuesta RLC Coins al ganador de cada partido en tiempo real</p>
          </div>
          <div className="rounded-xl px-6 py-4" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.65 0.18 80 / 0.3)" }}>
            <p className="text-xs font-mono text-muted-foreground mb-1">TU SALDO</p>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5" style={{ color: "oklch(0.75 0.18 80)" }} />
              <span className="font-display font-black text-2xl" style={{ color: "oklch(0.75 0.18 80)" }}>{balance.toLocaleString()}</span>
              <span className="text-muted-foreground font-mono text-sm">RLC</span>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-xl p-4 mb-8" style={{ background: "oklch(0.65 0.18 80 / 0.05)", border: "1px solid oklch(0.65 0.18 80 / 0.2)" }}>
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.75 0.18 80)" }} />
            <div>
              <p className="font-display font-bold text-sm" style={{ color: "oklch(0.75 0.18 80)" }}>COMO FUNCIONA</p>
              <p className="text-muted-foreground text-xs mt-1">
                Elige un partido con apuestas abiertas, selecciona al equipo que crees que ganara y define tu monto.
                El multiplicador es dinamico: cuanto mas apuesten al rival, mayor sera tu ganancia potencial (min x1.2, max x3.0).
                Las apuestas se cierran automaticamente antes del inicio del partido.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Open matches */}
          <div className="lg:col-span-2">
            <h2 className="font-display font-bold text-sm text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
              <Swords size={14} /> PARTIDOS DISPONIBLES PARA APOSTAR
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "var(--bg-card)" }} />
                ))}
              </div>
            ) : openMatches && openMatches.length > 0 ? (
              <div className="space-y-3">
                {openMatches.map((match) => {
                  const isSelected = selectedMatch?.matchId === match.matchId;
                  const betsCloseMs = new Date(match.betsCloseAt).getTime();
                  const isClosed = Date.now() > betsCloseMs;
                  const totalBets = match.team1TotalBets + match.team2TotalBets;
                  const t1Pct = totalBets > 0 ? Math.round((match.team1TotalBets / totalBets) * 100) : 50;
                  const t2Pct = 100 - t1Pct;

                  return (
                    <div
                      key={match.matchId}
                      onClick={() => {
                        if (isClosed) return;
                        setSelectedMatch(isSelected ? null : match);
                        setSelectedTeamId(null);
                        setBetAmount(100);
                      }}
                      className="rounded-xl p-4 transition-all duration-300 cursor-pointer"
                      style={{
                        background: "var(--bg-card)",
                        border: isSelected ? "1px solid oklch(0.55 0.22 25 / 0.6)" : isClosed ? "1px solid oklch(0.18 0.005 0)" : "1px solid oklch(0.18 0.01 0)",
                        boxShadow: isSelected ? "0 0 20px oklch(0.55 0.22 25 / 0.1)" : "none",
                        opacity: isClosed ? 0.6 : 1,
                      }}
                    >
                      {/* Match header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{match.tournamentName}</span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }}>
                            R{match.round}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">{match.game}</span>
                        </div>
                        {isClosed ? (
                          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "oklch(0.55 0.22 25 / 0.2)", color: "oklch(0.65 0.22 25)" }}>
                            CERRADAS
                          </span>
                        ) : (
                          <CountdownBadge targetMs={betsCloseMs} />
                        )}
                      </div>

                      {/* VS row */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold mb-1" style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.75 0.22 25)" }}>
                            {match.team1Name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-xs font-display tracking-wide text-foreground truncate">{match.team1Name}</p>
                          <p className="text-xs font-mono font-bold" style={{ color: "oklch(0.70 0.22 25)" }}>x{getMultiplierPreview(match, match.team1Id ?? 0)}</p>
                          <p className="text-xs font-mono text-muted-foreground">{t1Pct}%</p>
                        </div>
                        <div className="text-center">
                          <span className="font-display font-black text-lg" style={{ color: "oklch(0.55 0.22 25)" }}>VS</span>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">
                            {new Date(match.scheduledAt).toLocaleString("es-ES", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {totalBets > 0 && (
                            <p className="text-xs font-mono mt-0.5" style={{ color: "oklch(0.45 0.005 0)" }}>{totalBets.toLocaleString()} RLC</p>
                          )}
                        </div>
                        <div className="flex-1 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold mb-1" style={{ background: "oklch(0.55 0.18 220 / 0.15)", color: "oklch(0.75 0.18 220)" }}>
                            {match.team2Name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-xs font-display tracking-wide text-foreground truncate">{match.team2Name}</p>
                          <p className="text-xs font-mono font-bold" style={{ color: "oklch(0.70 0.18 220)" }}>x{getMultiplierPreview(match, match.team2Id ?? 0)}</p>
                          <p className="text-xs font-mono text-muted-foreground">{t2Pct}%</p>
                        </div>
                      </div>

                      {/* Bet distribution bar + volume breakdown */}
                      <div className="mb-3">
                        <div className="flex rounded-full overflow-hidden h-1.5" style={{ background: "var(--bg-hover)" }}>
                          {totalBets > 0 ? (
                            <>
                              <div style={{ width: `${t1Pct}%`, background: "oklch(0.55 0.22 25)", transition: "width 0.5s ease" }} />
                              <div style={{ width: `${t2Pct}%`, background: "oklch(0.55 0.18 220)", transition: "width 0.5s ease" }} />
                            </>
                          ) : (
                            <div className="w-full h-full" style={{ background: "var(--bg-hover)" }} />
                          )}
                        </div>
                        {totalBets === 0 ? (
                          <p className="text-center text-xs font-mono text-muted-foreground mt-1.5">Sin apuestas aún — sé el primero</p>
                        ) : (
                          <div className="flex justify-between text-xs font-mono mt-1">
                            <span style={{ color: "oklch(0.60 0.22 25)" }}>{match.team1TotalBets.toLocaleString()} RLC</span>
                            <span style={{ color: "oklch(0.45 0.005 0)" }}>vol. total</span>
                            <span style={{ color: "oklch(0.60 0.18 220)" }}>{match.team2TotalBets.toLocaleString()} RLC</span>
                          </div>
                        )}
                      </div>

                      {/* Expanded bet panel */}
                      {isSelected && !isClosed && (
                        <div
                          className="mt-3 pt-3 rounded-xl p-3"
                          style={{ background: "var(--bg-main)", border: "1px solid oklch(0.18 0.01 0)" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-xs font-display tracking-wider text-muted-foreground mb-3">ELIGE TU EQUIPO</p>
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {[
                              { id: match.team1Id, name: match.team1Name, color: "oklch(0.55 0.22 25)" },
                              { id: match.team2Id, name: match.team2Name, color: "oklch(0.55 0.18 220)" },
                            ].map((team) => {
                              const mult = getMultiplierPreview(match, team.id ?? 0);
                              const isChosen = selectedTeamId === team.id;
                              return (
                                <button
                                  key={team.id}
                                  onClick={() => setSelectedTeamId(team.id)}
                                  className="p-3 rounded-xl text-left transition-all duration-200"
                                  style={isChosen
                                    ? { background: "var(--bg-card)", border: `1px solid ${team.color}`, boxShadow: `0 0 12px ${team.color} / 0.2` }
                                    : { background: "var(--bg-card)", border: "1px solid oklch(0.22 0.01 0)" }
                                  }
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {isChosen && <CheckCircle2 size={12} style={{ color: team.color }} />}
                                    <span className="text-xs font-display tracking-wide text-foreground truncate">{team.name}</span>
                                  </div>
                                  <span className="text-xs font-mono" style={{ color: team.color }}>x{mult}</span>
                                </button>
                              );
                            })}
                          </div>

                          <p className="text-xs font-display tracking-wider text-muted-foreground mb-2">CANTIDAD</p>
                          <div className="flex gap-2 mb-2">
                            {[50, 100, 250, 500].map((amount) => (
                              <button
                                key={amount}
                                onClick={() => setBetAmount(amount)}
                                className="flex-1 py-1.5 text-xs font-mono rounded-lg transition-all duration-200"
                                style={betAmount === amount
                                  ? { background: "oklch(0.55 0.22 25)", color: "var(--text-primary)" }
                                  : { background: "var(--bg-card)", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-muted)" }
                                }
                              >
                                {amount}
                              </button>
                            ))}
                          </div>
                          <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Math.max(10, Math.min(10000, parseInt(e.target.value) || 10)))}
                            min={10}
                            max={10000}
                            className="w-full px-3 py-2 rounded-lg text-sm font-mono mb-2"
                            style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-primary)", outline: "none" }}
                          />

                          {selectedTeamId && (
                            <p className="text-xs text-muted-foreground mb-3">
                              Ganancia potencial:{" "}
                              <span className="font-mono" style={{ color: "oklch(0.75 0.18 80)" }}>
                                {Math.floor(betAmount * getMultiplierPreview(match, selectedTeamId)).toLocaleString()} RLC
                              </span>
                              {" "}(x{getMultiplierPreview(match, selectedTeamId)})
                            </p>
                          )}

                          <Button
                            onClick={() => {
                              if (!selectedTeamId) { toast.error("Selecciona un equipo"); return; }
                              placeOnMatch.mutate({
                                matchId: match.matchId,
                                tournamentId: match.tournamentId,
                                teamId: selectedTeamId,
                                amount: betAmount,
                              });
                            }}
                            disabled={!selectedTeamId || placeOnMatch.isPending || betAmount > balance}
                            className="w-full font-display text-xs tracking-wider disabled:opacity-50"
                            style={{ background: "oklch(0.55 0.22 25)", color: "var(--text-primary)" }}
                          >
                            {placeOnMatch.isPending
                              ? "PROCESANDO..."
                              : !selectedTeamId
                              ? "SELECCIONA UN EQUIPO"
                              : betAmount > balance
                              ? "SALDO INSUFICIENTE"
                              : `APOSTAR ${betAmount.toLocaleString()} RLC`}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}>
                <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: "oklch(0.25 0.005 0)" }} />
                <p className="font-display text-sm tracking-wider" style={{ color: "oklch(0.40 0.005 0)" }}>NO HAY PARTIDOS DISPONIBLES</p>
                <p className="text-muted-foreground text-xs mt-1">Los partidos aparecen aqui cuando el organizador les asigna fecha y hora</p>
                <Link href="/tournaments">
                  <Button className="mt-4 font-display text-xs tracking-wider" style={{ background: "oklch(0.55 0.22 25)", color: "var(--text-primary)" }}>
                    VER TORNEOS
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}>
              <h3 className="font-display font-bold text-xs text-muted-foreground tracking-wider mb-4">MIS APUESTAS</h3>
              {myBets && myBets.length > 0 ? (
                <div className="space-y-3">
                  {myBets.slice(0, 10).map((b) => {
                    const statusStyle = b.status === "won"
                      ? { bg: "oklch(0.65 0.18 145 / 0.12)", color: "oklch(0.65 0.18 145)", label: `+${b.potentialWin?.toLocaleString()} RLC` }
                      : b.status === "lost"
                      ? { bg: "oklch(0.55 0.22 25 / 0.12)", color: "oklch(0.65 0.22 25)", label: "PERDIDA" }
                      : b.status === "cancelled"
                      ? { bg: "oklch(0.25 0.005 0)", color: "var(--text-muted)", label: "ANULADA" }
                      : { bg: "oklch(0.20 0.005 0)", color: "var(--text-muted)", label: "PENDIENTE" };
                    const vsLabel = b.team1Name && b.team2Name ? `${b.team1Name} vs ${b.team2Name}` : null;
                    return (
                      <div key={b.id} className="rounded-lg p-3 space-y-1.5" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.20 0.01 0)" }}>
                        {/* Tournament name */}
                        {b.tournamentName && (
                          <p className="text-xs font-display tracking-wider" style={{ color: "oklch(0.55 0.22 25)" }}>{b.tournamentName}</p>
                        )}
                        {/* VS line */}
                        {vsLabel && (
                          <p className="text-xs text-foreground font-mono">{vsLabel}</p>
                        )}
                        {/* Chosen team */}
                        {b.chosenTeamName && (
                          <p className="text-xs" style={{ color: "oklch(0.65 0.18 220)" }}>Apostado a: <span className="font-bold">{b.chosenTeamName}</span></p>
                        )}
                        {/* Match date */}
                        {b.scheduledAt && (
                          <p className="text-xs text-muted-foreground">{new Date(b.scheduledAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                        {/* Amount + status */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono text-xs text-foreground">{b.amount.toLocaleString()} RLC <span className="text-muted-foreground">x{b.multiplier}</span></span>
                          <span className="font-mono px-2 py-0.5 rounded text-xs" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {statusStyle.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="w-8 h-8 mx-auto mb-2" style={{ color: "oklch(0.25 0.005 0)" }} />
                  <p className="text-xs text-muted-foreground">Sin apuestas aún</p>
                </div>
              )}
            </div>

            {wallet?.transactions && wallet.transactions.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}>
                <h3 className="font-display font-bold text-xs text-muted-foreground tracking-wider mb-4">TRANSACCIONES</h3>
                <div className="space-y-2">
                  {wallet.transactions.slice(0, 8).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0" style={{ borderColor: "var(--border-main)" }}>
                      <span className="text-muted-foreground line-clamp-1 flex-1">{tx.description ?? tx.type}</span>
                      <span className="font-mono ml-2" style={{ color: tx.amount > 0 ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" }}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
