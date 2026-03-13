import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown,
  Star, Coins, Wallet, Zap, ShoppingBag, Calendar,
} from "lucide-react";
import { RLCIcon } from "@/components/RLCIcon";

// ─── Types ────────────────────────────────────────────────────────────────────
type TxType = "deposit" | "withdrawal" | "bet_placed" | "bet_won" | "bet_lost" | "reward" | "refund";

type Tx = {
  id: number;
  type: TxType;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: Date | string;
};

// ─── Config por tipo (mirror de RightPanel TX_TYPE_CONFIG) ────────────────────
const TX_TYPE_CONFIG: Record<TxType, { label: string; icon: React.ReactNode; color: string }> = {
  deposit:    { label: "Depósito",        icon: <ArrowDownLeft className="w-4 h-4" />, color: "#22c55e" },
  withdrawal: { label: "Gasto",           icon: <ArrowUpRight  className="w-4 h-4" />, color: "#ef4444" },
  bet_placed: { label: "Apuesta",         icon: <TrendingDown  className="w-4 h-4" />, color: "#f97316" },
  bet_won:    { label: "Apuesta ganada",  icon: <TrendingUp    className="w-4 h-4" />, color: "#22c55e" },
  bet_lost:   { label: "Apuesta perdida", icon: <TrendingDown  className="w-4 h-4" />, color: "#ef4444" },
  reward:     { label: "Recompensa",      icon: <Star          className="w-4 h-4" />, color: "#FACC15" },
  refund:     { label: "Reembolso",       icon: <ArrowDownLeft className="w-4 h-4" />, color: "#60a5fa" },
};

// ─── Filters ──────────────────────────────────────────────────────────────────
const FILTER_MAP: Record<TxType, string> = {
  deposit:    "deposits",
  withdrawal: "gastos",
  reward:     "rewards",
  refund:     "rewards",
  bet_won:    "apuestas",
  bet_placed: "apuestas",
  bet_lost:   "apuestas",
};

const FILTERS = [
  { key: "all",      label: "Todas",       color: "#a1a1aa" },
  { key: "deposits", label: "Depósitos",   color: "#22c55e" },
  { key: "rewards",  label: "Recompensas", color: "#FACC15" },
  { key: "apuestas", label: "Apuestas",    color: "#f97316" },
  { key: "gastos",   label: "Gastos",      color: "#ef4444" },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

// ─── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ tx }: { tx: Tx }) {
  const cfg = TX_TYPE_CONFIG[tx.type] ?? { label: tx.type, icon: <Coins className="w-4 h-4" />, color: "#FACC15" };
  const isPositive = tx.amount > 0;
  const amountColor = isPositive ? "#22c55e" : "#ef4444";
  const date = new Date(tx.createdAt);
  const dateStr = date.toLocaleDateString("es", { day: "2-digit", month: "short" });
  const timeStr = date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
      >
        {cfg.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#ffffff" }}>
          {tx.description || cfg.label}
        </p>
        <p className="text-xs font-mono" style={{ color: "#71717a" }}>
          {dateStr} · {timeStr}
        </p>
      </div>

      {/* Amount */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-black font-mono flex items-center gap-1 justify-end" style={{ color: amountColor }}>
          {isPositive ? "+" : ""}{tx.amount.toLocaleString()} <RLCIcon size={13} />
        </p>
        <p className="text-xs font-mono" style={{ color: "rgba(250,204,21,0.5)" }}>
          {tx.balanceAfter?.toLocaleString()} <span style={{ fontSize: 9 }}>RLC</span>
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const [, navigate] = useLocation();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const { data, isLoading } = trpc.auth.wallet.useQuery();
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

  // ── Filter ─────────────────────────────────────────────────────────────────
  const countFor = (key: FilterKey) =>
    key === "all"
      ? transactions.length
      : transactions.filter(t => FILTER_MAP[t.type] === key).length;

  const filtered = activeFilter === "all"
    ? transactions
    : transactions.filter(t => FILTER_MAP[t.type] === activeFilter);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
        <div className="max-w-[480px] mx-auto px-4 py-6 space-y-5">
          <div className="h-48 rounded-2xl animate-pulse" style={{ background: "rgba(220,38,38,0.08)" }} />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "#0a0a0a" }}>
      <div className="max-w-[480px] mx-auto px-4 py-6 space-y-5">

        {/* ── 1. Header / Balance ───────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(220,38,38,0.22) 0%, rgba(180,20,20,0.10) 60%, rgba(0,0,0,0) 100%)",
            border: "1px solid rgba(220,38,38,0.30)",
          }}
        >
          {/* Skull decorativo semitransparente */}
          <img
            src="/rlcskull.webp"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none select-none"
            style={{
              right: "-28px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "170px",
              height: "170px",
              objectFit: "contain",
              opacity: 0.15,
              filter: "grayscale(1) brightness(1.5)",
            }}
          />
          {/* Decorative glow */}
          <div
            className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: "rgba(220,38,38,0.15)", filter: "blur(28px)" }}
          />

          <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: "rgba(220,38,38,0.7)" }}>
            Saldo disponible
          </p>

          <div className="flex items-center gap-3 mb-5">
            <RLCIcon size={48} />
            <div>
              <p className="text-5xl font-black font-mono leading-none" style={{ color: "#ef4444" }}>
                {balance.toLocaleString()}
              </p>
              <p className="text-xs font-mono mt-1" style={{ color: "rgba(220,38,38,0.55)" }}>RLC Coins</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/missions")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron font-bold text-xs transition-all hover:opacity-90"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              <Zap className="w-3.5 h-3.5" /> Ganar RLC
            </button>
            <button
              onClick={() => navigate("/shop")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron font-bold text-xs transition-all hover:opacity-90"
              style={{
                background: "rgba(220,38,38,0.12)",
                border: "1px solid rgba(220,38,38,0.30)",
                color: "#ef4444",
              }}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Gastar RLC
            </button>
          </div>
        </div>

        {/* ── 2. Stats row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total ganado",   value: totalGanado,   icon: <TrendingUp   className="w-4 h-4" />, color: "#22c55e" },
            { label: "Total gastado",  value: totalGastado,  icon: <TrendingDown className="w-4 h-4" />, color: "#ef4444" },
            { label: "Txs este mes",   value: thisMo,        icon: <Calendar     className="w-4 h-4" />, color: "#60a5fa", raw: true },
            { label: "Mayor depósito", value: mayorDeposito, icon: <Star         className="w-4 h-4" />, color: "#FACC15" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl p-4 space-y-1"
              style={{ background: "#16191f", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-1.5" style={{ color: s.color }}>
                {s.icon}
                <span className="text-[10px] font-mono tracking-wider" style={{ color: "#52525b" }}>
                  {s.label.toUpperCase()}
                </span>
              </div>
              <p className="font-orbitron font-bold text-lg" style={{ color: s.color }}>
                {(s as any).raw ? s.value : s.value.toLocaleString()}
                {!(s as any).raw && <span className="text-xs ml-1 opacity-60">RLC</span>}
              </p>
            </div>
          ))}
        </div>

        {/* ── 3. Filtros ────────────────────────────────────────────────────── */}
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
                  background: active ? `${f.color}14` : "rgba(255,255,255,0.04)",
                  border: active ? `1px solid ${f.color}40` : "1px solid rgba(255,255,255,0.06)",
                  color: active ? f.color : "#71717a",
                }}
              >
                {f.label}
                {count > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{
                      background: active ? `${f.color}20` : "rgba(255,255,255,0.06)",
                      color: active ? f.color : "#52525b",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── 4. Lista de transacciones ─────────────────────────────────────── */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center space-y-3"
              style={{ background: "#16191f", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <Wallet className="w-12 h-12 mx-auto opacity-20" style={{ color: "#FACC15" }} />
              <p className="font-orbitron font-bold text-sm tracking-wide" style={{ color: "#71717a" }}>
                Sin transacciones
              </p>
              <p className="text-xs" style={{ color: "#3f3f46" }}>
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
    </div>
  );
}
