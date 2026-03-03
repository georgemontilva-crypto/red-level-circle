import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Swords, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "../components/AdminUI";

export function BetsPage() {
  const { data: allBets, refetch, isLoading } = trpc.bets.adminList.useQuery();
  const [cancelTarget, setCancelTarget] = useState<null | {
    id: number; userLabel: string; vsLabel: string; amount: number; potentialWin: number | null; chosenTeamName: string | null;
  }>(null);
  const cancelBet = trpc.bets.cancelBet.useMutation({
    onSuccess: () => { toast.success("Apuesta anulada y RLC reembolsado"); refetch(); setCancelTarget(null); },
    onError: (e) => { toast.error(e.message); setCancelTarget(null); },
  });
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMatch, setFilterMatch] = useState<string>("all");

  const matchGroups = allBets ? Object.values(
    allBets.reduce((acc, b) => {
      const key = b.matchId ? `m${b.matchId}` : `t${b.tournamentId}`;
      if (!acc[key]) acc[key] = { matchId: b.matchId, tournamentId: b.tournamentId, tournamentName: b.tournamentName, team1Name: b.team1Name, team2Name: b.team2Name, scheduledAt: b.scheduledAt, totalAmount: 0, betCount: 0, pendingCount: 0 };
      acc[key].totalAmount += b.amount;
      acc[key].betCount += 1;
      if (b.status === "pending") acc[key].pendingCount += 1;
      return acc;
    }, {} as Record<string, any>)
  ) : [];

  const filtered = allBets?.filter(b => {
    const statusOk = filterStatus === "all" || b.status === filterStatus;
    const matchOk = filterMatch === "all" || (b.matchId ? `m${b.matchId}` : `t${b.tournamentId}`) === filterMatch;
    return statusOk && matchOk;
  }) ?? [];

  const matchOptions = matchGroups.map((g: any) => ({
    value: g.matchId ? `m${g.matchId}` : `t${g.tournamentId}`,
    label: g.team1Name && g.team2Name ? `${g.team1Name} vs ${g.team2Name}` : g.tournamentName ?? `Partido #${g.matchId}`,
  }));

  return (
    <div className="space-y-6 w-full">
      <PageHeader icon={Swords} title="APUESTAS" subtitle="Gestión de apuestas activas, historial y anulaciones" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total apuestas", value: allBets?.length ?? 0, color: "text-white" },
          { label: "Pendientes", value: allBets?.filter(b => b.status === "pending").length ?? 0, color: "text-yellow-400" },
          { label: "Volumen total (RLC)", value: (allBets?.reduce((s, b) => s + b.amount, 0) ?? 0).toLocaleString(), color: "text-red-400" },
          { label: "Partidos con apuestas", value: matchGroups.length, color: "text-blue-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 bg-zinc-900/60 border border-white/8">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`text-2xl font-orbitron ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Per-match summary */}
      {matchGroups.length > 0 && (
        <div className="rounded-xl p-4 space-y-3 bg-zinc-900/60 border border-white/8">
          <p className="text-xs font-orbitron text-zinc-500 tracking-wider">RESUMEN POR PARTIDO</p>
          <div className="space-y-2">
            {(matchGroups as any[]).map((g, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0 border-white/5">
                <div>
                  <p className="text-white font-mono text-xs">{g.team1Name && g.team2Name ? `${g.team1Name} vs ${g.team2Name}` : g.tournamentName ?? `Partido #${g.matchId}`}</p>
                  {g.scheduledAt && <p className="text-zinc-500 text-xs">{new Date(g.scheduledAt).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>}
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-mono text-xs">{g.totalAmount.toLocaleString()} RLC</p>
                  <p className="text-zinc-500 text-xs">{g.betCount} apuestas · {g.pendingCount} pendientes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 text-xs h-8"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="won">Ganada</SelectItem>
            <SelectItem value="lost">Perdida</SelectItem>
            <SelectItem value="cancelled">Anulada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterMatch} onValueChange={setFilterMatch}>
          <SelectTrigger className="w-56 text-xs h-8"><SelectValue placeholder="Partido" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los partidos</SelectItem>
            {matchOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setCancelTarget(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-5 bg-zinc-900 border border-red-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-900/30 border border-red-700/40">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-orbitron text-white text-sm tracking-wider">CONFIRMAR ANULACIÓN</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Esta acción reembolsará los RLC al usuario</p>
              </div>
            </div>
            <div className="rounded-xl p-4 space-y-2 bg-zinc-800/60 border border-white/5">
              <div className="flex justify-between text-xs"><span className="text-zinc-500">Usuario</span><span className="text-white font-mono">{cancelTarget.userLabel}</span></div>
              <div className="flex justify-between text-xs"><span className="text-zinc-500">Partido</span><span className="text-white font-mono">{cancelTarget.vsLabel}</span></div>
              {cancelTarget.chosenTeamName && <div className="flex justify-between text-xs"><span className="text-zinc-500">Equipo apostado</span><span className="text-blue-300 font-mono">{cancelTarget.chosenTeamName}</span></div>}
              <div className="flex justify-between text-xs border-t border-white/5 pt-2"><span className="text-zinc-500">Monto a reembolsar</span><span className="font-orbitron text-green-400">+{cancelTarget.amount.toLocaleString()} RLC</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => cancelBet.mutate({ betId: cancelTarget.id })} disabled={cancelBet.isPending}
                className="flex-1 py-2.5 rounded-xl text-xs font-orbitron tracking-wider bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50">
                {cancelBet.isPending ? "ANULANDO..." : "CONFIRMAR ANULACIÓN"}
              </button>
              <button onClick={() => setCancelTarget(null)} disabled={cancelBet.isPending}
                className="px-4 py-2.5 rounded-xl text-xs font-orbitron tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bets table */}
      {isLoading ? (
        <p className="text-zinc-500 text-sm">Cargando apuestas...</p>
      ) : filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm">No hay apuestas con los filtros seleccionados.</p>
      ) : (
        <div className="rounded-xl overflow-hidden border border-white/8">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-900/80">
                <th className="text-left p-3 text-zinc-500 font-orbitron">USUARIO</th>
                <th className="text-left p-3 text-zinc-500 font-orbitron">PARTIDO</th>
                <th className="text-left p-3 text-zinc-500 font-orbitron">EQUIPO</th>
                <th className="text-right p-3 text-zinc-500 font-orbitron">MONTO</th>
                <th className="text-right p-3 text-zinc-500 font-orbitron">GANANCIA</th>
                <th className="text-center p-3 text-zinc-500 font-orbitron">ESTADO</th>
                <th className="text-center p-3 text-zinc-500 font-orbitron">ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const statusColor = b.status === "won" ? "text-green-400" : b.status === "lost" ? "text-red-400" : b.status === "cancelled" ? "text-zinc-500" : "text-yellow-400";
                const vsLabel = b.team1Name && b.team2Name ? `${b.team1Name} vs ${b.team2Name}` : b.tournamentName ?? `#${b.matchId}`;
                return (
                  <tr key={b.id} className="border-t border-white/5 hover:bg-white/2">
                    <td className="p-3"><p className="text-white">{b.userNickname ?? b.userName ?? `#${b.userId}`}</p></td>
                    <td className="p-3">
                      <p className="text-white font-mono">{vsLabel}</p>
                      {b.scheduledAt && <p className="text-zinc-600 text-xs">{new Date(b.scheduledAt).toLocaleDateString("es")}</p>}
                    </td>
                    <td className="p-3"><p className="text-blue-300 font-mono">{b.chosenTeamName ?? "—"}</p></td>
                    <td className="p-3 text-right"><p className="text-white font-orbitron">{b.amount.toLocaleString()}</p></td>
                    <td className="p-3 text-right"><p className="text-green-400 font-orbitron">{b.potentialWin?.toLocaleString() ?? "—"}</p></td>
                    <td className="p-3 text-center"><span className={`font-mono ${statusColor}`}>{b.status.toUpperCase()}</span></td>
                    <td className="p-3 text-center">
                      {b.status === "pending" && (
                        <button onClick={() => setCancelTarget({ id: b.id, userLabel: b.userNickname ?? b.userName ?? `#${b.userId}`, vsLabel, amount: b.amount, potentialWin: b.potentialWin ?? null, chosenTeamName: b.chosenTeamName ?? null })}
                          className="text-xs text-red-400 hover:text-red-300 font-mono border border-red-700/40 px-2 py-0.5 rounded hover:bg-red-900/20 transition-colors">
                          ANULAR
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
