import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Database, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

export function AuditPage() {
  const [enabled, setEnabled] = useState(false);
  const { data, isFetching, refetch } = trpc.games.auditConsistency.useQuery(undefined, { enabled, staleTime: 0 });

  const handleRun = () => {
    if (!enabled) setEnabled(true);
    else refetch();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader icon={Database} title="AUDITORÍA" subtitle="Verifica que gameSlug esté correctamente poblado en torneos y equipos" />

      <div className="flex items-center gap-4">
        <button onClick={handleRun} disabled={isFetching}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-orbitron rounded-lg transition-colors">
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "EJECUTANDO..." : enabled ? "VOLVER A EJECUTAR" : "EJECUTAR AUDITORÍA"}
        </button>
        {data && !isFetching && <span className="text-xs text-zinc-500">Última ejecución completada</span>}
      </div>

      {data && !isFetching && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Torneos", value: data.summary.totalTournaments, color: "text-white" },
              { label: "Torneos Inconsistentes", value: data.summary.inconsistentTournaments, color: data.summary.inconsistentTournaments > 0 ? "text-red-400" : "text-green-400" },
              { label: "Total Equipos", value: data.summary.totalTeams, color: "text-white" },
              { label: "Equipos Inconsistentes", value: data.summary.inconsistentTeams, color: data.summary.inconsistentTeams > 0 ? "text-red-400" : "text-green-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-zinc-900/60 border border-white/8 rounded-xl p-4 text-center">
                <div className={`text-3xl font-orbitron font-bold ${color}`}>{value}</div>
                <div className="text-xs text-zinc-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${data.summary.inconsistentTournaments === 0 && data.summary.inconsistentTeams === 0 ? "bg-green-900/20 border-green-700/40 text-green-400" : "bg-red-900/20 border-red-700/40 text-red-400"}`}>
            {data.summary.inconsistentTournaments === 0 && data.summary.inconsistentTeams === 0 ? (
              <><CheckCircle2 className="w-5 h-5" /><span className="text-sm font-semibold">Sin inconsistencias — todos los registros tienen gameSlug correcto</span></>
            ) : (
              <><AlertTriangle className="w-5 h-5" /><span className="text-sm font-semibold">Se encontraron inconsistencias. Revisar los detalles abajo.</span></>
            )}
          </div>

          {data.tournaments.length > 0 && (
            <div>
              <h3 className="text-sm font-orbitron text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> TORNEOS INCONSISTENTES ({data.tournaments.length})</h3>
              <div className="overflow-x-auto rounded-xl border border-white/8">
                <table className="w-full text-sm">
                  <thead><tr className="bg-zinc-900/80 text-zinc-500 text-xs"><th className="text-left p-3">ID</th><th className="text-left p-3">Nombre</th><th className="text-left p-3">game (legacy)</th><th className="text-left p-3">gameSlug actual</th><th className="text-left p-3">gameSlug esperado</th></tr></thead>
                  <tbody>
                    {data.tournaments.map((t: any) => (
                      <tr key={t.id} className="border-t border-white/5 hover:bg-white/2">
                        <td className="p-3 text-zinc-500">{t.id}</td>
                        <td className="p-3 text-white">{t.name}</td>
                        <td className="p-3 text-yellow-400">{t.game ?? "—"}</td>
                        <td className="p-3 text-red-400">{t.gameSlug ?? <span className="text-zinc-600">NULL</span>}</td>
                        <td className="p-3 text-green-400">{t.expectedSlug ?? <span className="text-zinc-600">sin juego registrado</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.teams.length > 0 && (
            <div>
              <h3 className="text-sm font-orbitron text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> EQUIPOS INCONSISTENTES ({data.teams.length})</h3>
              <div className="overflow-x-auto rounded-xl border border-white/8">
                <table className="w-full text-sm">
                  <thead><tr className="bg-zinc-900/80 text-zinc-500 text-xs"><th className="text-left p-3">ID</th><th className="text-left p-3">Nombre</th><th className="text-left p-3">game (legacy)</th><th className="text-left p-3">gameSlug actual</th><th className="text-left p-3">gameSlug esperado</th></tr></thead>
                  <tbody>
                    {data.teams.map((t: any) => (
                      <tr key={t.id} className="border-t border-white/5 hover:bg-white/2">
                        <td className="p-3 text-zinc-500">{t.id}</td>
                        <td className="p-3 text-white">{t.name}</td>
                        <td className="p-3 text-yellow-400">{t.game ?? "—"}</td>
                        <td className="p-3 text-red-400">{t.gameSlug ?? <span className="text-zinc-600">NULL</span>}</td>
                        <td className="p-3 text-green-400">{t.expectedSlug ?? <span className="text-zinc-600">sin juego registrado</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.tournaments.length === 0 && data.teams.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500/40" />
              <p className="text-sm">No hay registros inconsistentes. La base de datos está limpia.</p>
            </div>
          )}
        </div>
      )}

      {!data && !isFetching && (
        <div className="text-center py-12 text-zinc-600">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Haz clic en "Ejecutar Auditoría" para analizar la consistencia de gameSlug.</p>
        </div>
      )}
    </div>
  );
}
