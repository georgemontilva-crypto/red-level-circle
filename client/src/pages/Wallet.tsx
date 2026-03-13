import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Coins, ArrowDownCircle, ArrowUpCircle, Trophy, Swords,
  Star, RotateCcw, XCircle, TrendingUp, TrendingDown,
  Calendar, Zap, ShoppingBag, Loader2,
} from "lucide-react";

const GOLD = "#FFD700";

// ─── Types ────────────────────────────────────────────────────────────────────
type TxType = "deposit" | "withdrawal" | "bet_placed" | "bet_won" | "bet_lost" | "reward" | "refund";

type Tx = {
  id: number;
  type: TxType;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: Date;
};

// ─── Config por tipo ──────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<TxType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  filterKey: string;
}> = {
  deposit:     { label: "Depósito",       icon: <ArrowDownCircle className="w-5 h-5" />, color: "#4ade80", filterKey: "deposits" },
  withdrawal:  { label: "Gasto",          icon: <ArrowUpCircle   className="w-5 h-5" />, color: "#f87171", filterKey: "gastos"   },
  reward:      { label: "Recompensa",     icon: <Star            className="w-5 h-5" />, color: GOLD,      filterKey: "rewards"  },
  refund:      { label: "Reembolso",      icon: <RotateCcw       className="w-5 h-5" />, color: "#60a5fa", filterKey: "rewards"  },
  bet_won:     { label: "Apuesta ganada", icon: <Trophy          className="w-5 h-5" />, color: GOLD,      filterKey: "apuestas" },
  bet_placed:  { label: "Apuesta",        icon: <Swords          className="w-5 h-5" />, color: "#a1a1aa", filterKey: "apuestas" },
  bet_lost:    { label: "Apuesta perdida",icon: <XCircle         className="w-5 h-5" />, color: "#f87171", filterKey: "apuestas" },
};

const FILTERS = [
  { key: "all",      label: "Todas"      },
  { key: "deposits", label: "Depósitos"  },
  { key: "rewards",  label: "Recompensas"},
  { key: "apuestas", label: "Apuestas"   },
  { key: "gastos",   label: "Gastos"     },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("es", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat("es").format(Math.abs(n));
}

// ─── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ tx }: { tx: Tx }) {
  const cfg = TYPE_CONFIG[tx.type];
  const isCredit = tx.amount > 0;
  const label = tx.description || cfg.label;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors"
      style={{ background: "#16191f", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${cfg.color}14`, color: cfg.color }}
      >
        {cfg.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{label}</p>
        <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
          <Calendar className="w-3 h-3" />
          {formatDate(tx.createdAt)}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p
          className="font-orbitron font-bold text-sm"
          style={{ color: isCredit ? "#4ade80" : "#f87171" }}
        >
          {isCredit ? "+" : "−"}{formatAmount(tx.amount)} RLC
        </p>
        <p className="text-zinc-600 text-[10px] mt-0.5">
          Saldo: {new Intl.NumberFormat("es").format(tx.balanceAfter)} RLC
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const [, navigate] = useLocation();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const { data, isLoading } = trpc.users.wallet.useQuery();
  const balance      = data?.balance ?? 0;
  const transactions = (data?.transactions ?? []) as Tx[];

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalGanado  = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalGastado = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const now = new Date();
  const thisMo = transactions.filter(t => {
    const d = new Date(t.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const mayorDeposito = Math.max(0, ...transactions.filter(t => t.amount > 0).map(t => t.amount));

  // ── Filter counts ──────────────────────────────────────────────────────────
  const countFor = (key: FilterKey) =>
    key === "all"
      ? transactions.length
      : transactions.filter(t => TYPE_CONFIG[t.type].filterKey === key).length;

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = activeFilter === "all"
    ? transactions
    : transactions.filter(t => TYPE_CONFIG[t.type].filterKey === activeFilter);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ background: "#0a0a0a" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 space-y-5 px-4 py-6" style={{ background: "#0a0a0a" }}>

      {/* ── 1. Header / Balance ──────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 text-center space-y-4"
        style={{
          background: "linear-gradient(135deg, rgba(255,215,0,0.08) 0%, #16191f 60%)",
          border: "1px solid rgba(255,215,0,0.15)",
        }}
      >
        {/* Animated coin icon */}
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center animate-pulse"
          style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.25)" }}
        >
          <Coins className="w-8 h-8" style={{ color: GOLD }} />
        </div>

        <div>
          <p className="font-orbitron font-black text-4xl" style={{ color: GOLD }}>
            {new Intl.NumberFormat("es").format(balance)}
            <span className="text-xl ml-2 font-bold opacity-70">RLC</span>
          </p>
          <p className="text-zinc-400 text-sm mt-1">Tu saldo disponible</p>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/missions")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron font-bold text-xs text-black transition-all hover:scale-105"
            style={{ background: GOLD }}
          >
            <Zap className="w-3.5 h-3.5" /> Ganar RLC
          </button>
          <button
            onClick={() => navigate("/shop")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron font-bold text-xs transition-all hover:scale-105"
            style={{
              background: "rgba(255,215,0,0.08)",
              border: "1px solid rgba(255,215,0,0.25)",
              color: GOLD,
            }}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Gastar RLC
          </button>
        </div>
      </div>

      {/* ── 2. Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total ganado",       value: totalGanado,    icon: <TrendingUp  className="w-4 h-4" />, color: "#4ade80" },
          { label: "Total gastado",      value: totalGastado,   icon: <TrendingDown className="w-4 h-4" />, color: "#f87171" },
          { label: "Transac. este mes",  value: thisMo,         icon: <Calendar    className="w-4 h-4" />, color: "#60a5fa", raw: true },
          { label: "Mayor depósito",     value: mayorDeposito,  icon: <Star        className="w-4 h-4" />, color: GOLD      },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-xl p-4 space-y-1"
            style={{ background: "#16191f", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-1.5" style={{ color: s.color }}>
              {s.icon}
              <span className="text-[10px] font-mono tracking-wider text-zinc-500">{s.label.toUpperCase()}</span>
            </div>
            <p className="font-orbitron font-bold text-lg" style={{ color: s.color }}>
              {(s as any).raw
                ? s.value
                : new Intl.NumberFormat("es").format(s.value)
              }
              {!(s as any).raw && <span className="text-xs ml-1 opacity-60">RLC</span>}
            </p>
          </div>
        ))}
      </div>

      {/* ── 3. Filtros ───────────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {FILTERS.map(f => {
          const count = countFor(f.key);
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all"
              style={{
                background: active ? "rgba(255,215,0,0.12)" : "#16191f",
                border: active ? "1px solid rgba(255,215,0,0.35)" : "1px solid rgba(255,255,255,0.06)",
                color: active ? GOLD : "#71717a",
              }}
            >
              {f.label}
              {count > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: active ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.06)",
                    color: active ? GOLD : "#52525b",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── 4. Lista de transacciones ─────────────────────────────────────────── */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center space-y-3"
            style={{ background: "#16191f", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Coins className="w-12 h-12 mx-auto opacity-20" style={{ color: GOLD }} />
            <p className="font-orbitron font-bold text-zinc-400 text-sm tracking-wide">Sin transacciones</p>
            <p className="text-zinc-600 text-xs">
              {activeFilter === "all"
                ? "Aún no tienes movimientos en tu wallet."
                : "No hay transacciones en esta categoría."}
            </p>
          </div>
        ) : (
          filtered.map(tx => <TxRow key={tx.id} tx={tx} />)
        )}
      </div>

    </div>
  );
}
