import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Coins, Users, TrendingUp } from "lucide-react";
import { PageHeader } from "../components/AdminUI";
import { Button } from "@/components/ui/button";

export function RLCPage() {
  const { data: users, refetch } = trpc.admin.listUsers.useQuery({});
  const [rlcForm, setRlcForm] = useState<{ userId: number; amount: string; reason: string; userName: string } | null>(null);
  const adjustRLC = trpc.admin.adjustRLC.useMutation({
    onSuccess: () => { toast.success("RLC ajustado"); setRlcForm(null); refetch(); },
    onError: e => toast.error(e.message),
  });

  const totalRLC = users?.reduce((sum, u) => sum + (u.rlcBalance ?? 0), 0) ?? 0;
  const topHolders = [...(users ?? [])].sort((a, b) => (b.rlcBalance ?? 0) - (a.rlcBalance ?? 0)).slice(0, 10);

  return (
    <div className="space-y-8 w-full">
      <PageHeader icon={Coins} title="RLC COINS" subtitle="Gestiona el balance de RLC Coins de los usuarios" />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-5 text-center">
          <p className="font-orbitron font-black text-3xl text-yellow-400">{totalRLC.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><Coins className="w-3 h-3" /> RLC en circulación</p>
        </div>
        <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-5 text-center">
          <p className="font-orbitron font-black text-3xl text-blue-400">{users?.length ?? 0}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Usuarios con balance</p>
        </div>
        <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-5 text-center">
          <p className="font-orbitron font-black text-3xl text-green-400">
            {users?.length ? Math.round(totalRLC / users.length).toLocaleString() : 0}
          </p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> Promedio por usuario</p>
        </div>
      </div>

      {/* Top holders */}
      <div>
        <h3 className="font-orbitron text-sm text-zinc-400 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> TOP TENEDORES DE RLC</h3>
        <div className="space-y-2">
          {topHolders.map((u, i) => (
            <div key={u.id} className="bg-zinc-900/60 border border-white/8 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-orbitron font-bold text-xs flex-shrink-0 ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-zinc-400/20 text-zinc-300" : i === 2 ? "bg-orange-700/20 text-orange-400" : "bg-zinc-800 text-zinc-500"}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-rajdhani font-semibold truncate">{u.nickname ?? u.name ?? "Sin nombre"}</p>
                <p className="text-zinc-500 text-xs truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-orbitron font-bold text-yellow-400">{(u.rlcBalance ?? 0).toLocaleString()} RLC</span>
                <Button size="sm" variant="outline" onClick={() => setRlcForm({ userId: u.id, amount: "", reason: "", userName: u.nickname ?? u.name ?? "Usuario" })}
                  className="h-7 text-xs border-yellow-700/40 text-yellow-400 hover:bg-yellow-950/40">
                  Ajustar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adjust RLC modal */}
      {rlcForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-red-900/50 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-orbitron text-red-400 text-sm tracking-widest">AJUSTAR RLC — {rlcForm.userName}</h3>
            <p className="text-zinc-500 text-xs">Usa valores positivos para agregar y negativos para quitar.</p>
            <input type="number" value={rlcForm.amount} onChange={e => setRlcForm(f => f ? { ...f, amount: e.target.value } : null)}
              placeholder="Cantidad (ej: 500 o -100)"
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            <input value={rlcForm.reason} onChange={e => setRlcForm(f => f ? { ...f, reason: e.target.value } : null)}
              placeholder="Motivo (ej: Premio torneo)"
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            <div className="flex gap-3">
              <Button onClick={() => adjustRLC.mutate({ userId: rlcForm.userId, amount: parseInt(rlcForm.amount), reason: rlcForm.reason })}
                disabled={!rlcForm.amount || !rlcForm.reason || adjustRLC.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs flex-1">
                APLICAR
              </Button>
              <Button onClick={() => setRlcForm(null)} variant="outline" className="border-white/10 text-zinc-400 font-orbitron text-xs">CANCELAR</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
