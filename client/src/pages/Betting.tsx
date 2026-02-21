import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Coins, Lock, Trophy, Zap } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

function NavBar() {
  const { isAuthenticated } = useAuth();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <span className="font-orbitron font-black text-xl tracking-widest cursor-pointer">
            <span className="text-red-500">RED</span><span className="text-white">LEVEL</span>
            <span className="text-zinc-400 text-sm ml-1">CIRCLE</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-rajdhani font-semibold tracking-wider">
          <Link href="/tournaments"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">TORNEOS</span></Link>
          <Link href="/ranking"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">RANKING</span></Link>
          <Link href="/news"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">NOTICIAS</span></Link>
          <Link href="/streams"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">EN VIVO</span></Link>
          <Link href="/betting"><span className="text-white cursor-pointer">APUESTAS</span></Link>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard"><Button size="sm" className="bg-red-600 hover:bg-red-700 font-orbitron text-xs tracking-wider">DASHBOARD</Button></Link>
          ) : (
            <a href={getLoginUrl()}><Button size="sm" className="bg-red-600 hover:bg-red-700 font-orbitron text-xs tracking-wider">INGRESAR</Button></a>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function Betting() {
  const { isAuthenticated } = useAuth();
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(100);

  const { data: wallet } = trpc.auth.wallet.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myBets } = trpc.bets.myBets.useQuery(undefined, { enabled: isAuthenticated });
  const { data: activeTournaments, isLoading } = trpc.tournaments.list.useQuery({ status: "in_progress" });

  const placeBet = trpc.bets.place.useMutation({
    onSuccess: () => {
      toast.success("¡Apuesta realizada!", { description: `${betAmount} RLC apostados` });
      setSelectedTournamentId(null);
      setBetAmount(100);
    },
    onError: (err: { message: string }) => toast.error("Error al apostar", { description: err.message }),
  });

  const handlePlaceBet = (teamId: number) => {
    if (!selectedTournamentId) return;
    placeBet.mutate({ tournamentId: selectedTournamentId, teamId, amount: betAmount });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <div className="pt-24 pb-16 max-w-2xl mx-auto px-4 text-center">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-12">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="font-orbitron font-black text-2xl text-white mb-3">ACCESO RESTRINGIDO</h2>
            <p className="text-zinc-400 font-rajdhani mb-6">Debes iniciar sesión para acceder al centro de apuestas y usar tus RLC Coins.</p>
            <a href={getLoginUrl()}>
              <Button className="bg-red-600 hover:bg-red-700 font-orbitron text-xs tracking-wider">INICIAR SESIÓN</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <h1 className="font-orbitron font-black text-3xl text-white tracking-wider">CENTRO DE APUESTAS</h1>
            </div>
            <p className="text-zinc-500 font-rajdhani">Apuesta RLC Coins en los torneos activos de la plataforma</p>
          </div>
          {/* Wallet */}
          <div className="bg-zinc-900/80 border border-yellow-500/30 rounded-xl px-6 py-4">
            <p className="text-xs font-mono text-zinc-500 mb-1">TU SALDO</p>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-orbitron font-black text-2xl text-yellow-400">{(wallet?.balance ?? 0).toLocaleString()}</span>
              <span className="text-zinc-500 font-mono text-sm">RLC</span>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Coins className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-rajdhani font-bold text-yellow-400 text-sm">CÓMO FUNCIONA</p>
              <p className="text-zinc-400 font-rajdhani text-xs mt-1">
                Los RLC Coins son la moneda interna de la plataforma. Úsalos para apostar en torneos en curso.
                Si tu equipo gana, recibirás 1.5× tu apuesta. Los coins se otorgan al registrarte y al participar en torneos.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active tournaments to bet on */}
          <div className="lg:col-span-2">
            <h2 className="font-orbitron font-bold text-sm text-zinc-400 tracking-wider mb-4">TORNEOS EN CURSO</h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-zinc-900/50 rounded-xl animate-pulse" />)}
              </div>
            ) : activeTournaments && activeTournaments.length > 0 ? (
              <div className="space-y-3">
                {activeTournaments.map((t) => (
                  <div key={t.id}
                    onClick={() => setSelectedTournamentId(t.id)}
                    className={`bg-zinc-900/80 border rounded-xl p-4 cursor-pointer transition-all ${selectedTournamentId === t.id ? "border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.1)]" : "border-zinc-800 hover:border-zinc-700"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-rajdhani font-bold text-white">{t.name}</h3>
                      <span className="text-xs font-mono text-red-400">{t.game}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="font-mono">Multiplicador: ×1.5</span>
                      <span>Apuesta mínima: 10 RLC</span>
                    </div>
                    {selectedTournamentId === t.id && (
                      <div className="mt-3 pt-3 border-t border-zinc-800">
                        <p className="text-xs font-mono text-zinc-500 mb-2">CANTIDAD A APOSTAR</p>
                        <div className="flex gap-2 mb-2">
                          {[50, 100, 250, 500].map((amount) => (
                            <button key={amount} onClick={(e) => { e.stopPropagation(); setBetAmount(amount); }}
                              className={`flex-1 py-1.5 text-xs font-mono rounded border transition-all ${betAmount === amount ? "bg-red-600 border-red-600 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-red-500/50"}`}>
                              {amount}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          value={betAmount}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 10))}
                          min={10}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-red-500/50 mb-3"
                        />
                        <p className="text-xs text-zinc-500 mb-3">
                          Ganancia potencial: <span className="text-yellow-400 font-mono">{Math.floor(betAmount * 1.5).toLocaleString()} RLC</span>
                        </p>
                        <Button
                          onClick={(e) => { e.stopPropagation(); handlePlaceBet(0); }}
                          disabled={placeBet.isPending || betAmount > (wallet?.balance ?? 0)}
                          className="w-full bg-red-600 hover:bg-red-700 font-orbitron text-xs tracking-wider">
                          {placeBet.isPending ? "PROCESANDO..." : `APOSTAR ${betAmount} RLC`}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                <p className="font-orbitron text-zinc-600 text-sm">NO HAY TORNEOS EN CURSO</p>
                <p className="text-zinc-700 font-rajdhani text-xs mt-1">Las apuestas se abren cuando hay torneos activos</p>
                <Link href="/tournaments">
                  <Button className="mt-4 bg-red-600 hover:bg-red-700 font-orbitron text-xs">VER TORNEOS</Button>
                </Link>
              </div>
            )}
          </div>

          {/* My bets history */}
          <div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <h3 className="font-orbitron font-bold text-xs text-zinc-400 tracking-wider mb-4">MIS APUESTAS</h3>
              {myBets && myBets.length > 0 ? (
                <div className="space-y-2">
                  {myBets.slice(0, 10).map((b) => (
                    <div key={b.id} className="flex items-center justify-between text-xs py-2 border-b border-zinc-800/50 last:border-0">
                      <div>
                        <p className="font-rajdhani text-zinc-300">{b.amount} RLC</p>
                        <p className="text-zinc-600 font-mono">×{b.multiplier}</p>
                      </div>
                      <span className={`font-mono px-2 py-0.5 rounded text-xs ${
                        b.status === "won" ? "bg-green-500/20 text-green-400" :
                        b.status === "lost" ? "bg-red-900/20 text-red-500" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>
                        {b.status === "won" ? `+${b.potentialWin} RLC` : b.status === "lost" ? "PERDIDA" : "PENDIENTE"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                  <p className="text-xs text-zinc-600 font-rajdhani">Sin apuestas aún</p>
                </div>
              )}
            </div>

            {/* Wallet transactions */}
            {wallet?.transactions && wallet.transactions.length > 0 && (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 mt-4">
                <h3 className="font-orbitron font-bold text-xs text-zinc-400 tracking-wider mb-4">TRANSACCIONES</h3>
                <div className="space-y-2">
                  {wallet.transactions.slice(0, 8).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/50 last:border-0">
                      <span className="text-zinc-500 font-rajdhani line-clamp-1 flex-1">{tx.description ?? tx.type}</span>
                      <span className={`font-mono ml-2 ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
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
