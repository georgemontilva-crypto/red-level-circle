/**
 * TournamentCard — Componente universal de tarjeta de torneo.
 * Estructura basada en el diseño de referencia, adaptada a los colores RLC.
 * Usado en: Home (scroll horizontal), Tournaments (grid), MyTournaments, Dashboard, Betting, etc.
 */
import { Link } from "wouter";
import { Trophy, Calendar, Users, GitBranch, Hash, Radio, Coins, CheckCircle2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function bracketLabel(b: string | null | undefined) {
  const m: Record<string, string> = {
    single_elimination: "Elim. Simple",
    double_elimination: "Doble Elim.",
    groups: "Grupos",
  };
  return m[b ?? ""] ?? b ?? "";
}

export function tournamentStatusInfo(s: string | null | undefined) {
  const map: Record<string, { text: string; color: string; dot: string; badgeBg: string; badgeBorder: string; badgeText: string }> = {
    registration_open: {
      text: "Inscripciones abiertas",
      color: "text-emerald-400",
      dot: "bg-emerald-500",
      badgeBg: "oklch(0.25 0.10 145 / 0.20)",
      badgeBorder: "oklch(0.45 0.15 145 / 0.40)",
      badgeText: "oklch(0.70 0.18 145)",
    },
    in_progress: {
      text: "En curso",
      color: "text-yellow-400",
      dot: "bg-yellow-400 animate-pulse",
      badgeBg: "oklch(0.25 0.10 80 / 0.20)",
      badgeBorder: "oklch(0.55 0.18 80 / 0.40)",
      badgeText: "oklch(0.75 0.18 80)",
    },
    upcoming: {
      text: "Próximamente",
      color: "text-blue-400",
      dot: "bg-blue-500",
      badgeBg: "oklch(0.25 0.10 240 / 0.20)",
      badgeBorder: "oklch(0.45 0.15 240 / 0.40)",
      badgeText: "oklch(0.65 0.18 240)",
    },
    registration_closed: {
      text: "Inscripciones cerradas",
      color: "text-orange-400",
      dot: "bg-orange-500",
      badgeBg: "oklch(0.25 0.10 50 / 0.20)",
      badgeBorder: "oklch(0.50 0.18 50 / 0.40)",
      badgeText: "oklch(0.70 0.18 50)",
    },
    completed: {
      text: "Finalizado",
      color: "text-zinc-400",
      dot: "bg-zinc-600",
      badgeBg: "oklch(0.18 0.005 0 / 0.40)",
      badgeBorder: "oklch(0.30 0.005 0 / 0.50)",
      badgeText: "oklch(0.50 0.005 0)",
    },
    cancelled: {
      text: "Cancelado",
      color: "text-red-500",
      dot: "bg-red-700",
      badgeBg: "oklch(0.25 0.18 25 / 0.20)",
      badgeBorder: "oklch(0.40 0.18 25 / 0.40)",
      badgeText: "oklch(0.55 0.18 25)",
    },
    draft: {
      text: "Borrador",
      color: "text-zinc-500",
      dot: "bg-zinc-600",
      badgeBg: "oklch(0.18 0.005 0 / 0.40)",
      badgeBorder: "oklch(0.30 0.005 0 / 0.50)",
      badgeText: "oklch(0.45 0.005 0)",
    },
    pending_approval: {
      text: "Pendiente de aprobación",
      color: "text-orange-400",
      dot: "bg-orange-500",
      badgeBg: "oklch(0.25 0.10 50 / 0.20)",
      badgeBorder: "oklch(0.50 0.18 50 / 0.40)",
      badgeText: "oklch(0.70 0.18 50)",
    },
  };
  return map[s ?? ""] ?? {
    text: s ?? "",
    color: "text-zinc-400",
    dot: "bg-zinc-600",
    badgeBg: "oklch(0.18 0.005 0 / 0.40)",
    badgeBorder: "oklch(0.30 0.005 0 / 0.50)",
    badgeText: "oklch(0.50 0.005 0)",
  };
}

export function formatTournamentDate(d: Date | string | null | undefined) {
  if (!d) return "Por anunciar";
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface TournamentCardData {
  id: number;
  name: string;
  game?: string | null;
  banner?: string | null;
  status?: string | null;
  bracketType?: string | null;
  registrationType?: string | null;
  minPlayersPerTeam?: number | null;
  maxPlayersPerTeam?: number | null;
  maxTeams?: number | null;
  registeredCount?: number | null;
  creatorName?: string | null;
  startDate?: Date | string | null;
  prizeAmount?: number | null;
  prizeDescription?: string | null;
  isLive?: boolean | null;
  isFeatured?: boolean | null;
}

// ─── Variantes ────────────────────────────────────────────────────────────────
type CardVariant = "default" | "compact" | "horizontal";

interface TournamentCardProps {
  tournament: TournamentCardData;
  variant?: CardVariant;
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function TournamentCard({
  tournament: t,
  variant = "default",
  href,
  onClick,
  selected = false,
  className = "",
}: TournamentCardProps) {
  const st = tournamentStatusInfo(t.status);
  const formatLabel =
    t.minPlayersPerTeam && t.maxPlayersPerTeam
      ? t.minPlayersPerTeam === t.maxPlayersPerTeam
        ? `${t.maxPlayersPerTeam}v${t.maxPlayersPerTeam}`
        : `${t.minPlayersPerTeam}-${t.maxPlayersPerTeam}v${t.maxPlayersPerTeam}`
      : t.maxPlayersPerTeam
      ? `${t.maxPlayersPerTeam}v${t.maxPlayersPerTeam}`
      : null;

  const defaultHref = href ?? `/tournaments/${t.id}`;

  // ── Variante compacta (fila) ──────────────────────────────────────────────
  if (variant === "compact") {
    const inner = (
      <div
        className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all duration-200 ${className}`}
        style={{
          background: selected ? "var(--bg-hover)" : "var(--bg-card)",
          border: `1px solid ${selected ? "oklch(0.55 0.22 25 / 0.5)" : "oklch(0.18 0.01 0)"}`,
          borderRadius: "12px",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.55 0.22 25 / 0.3)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = selected ? "var(--bg-hover)" : "var(--bg-card)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.borderColor = selected ? "oklch(0.55 0.22 25 / 0.5)" : "oklch(0.18 0.01 0)";
        }}
        onClick={onClick}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
          {t.banner ? (
            <img src={t.banner || undefined} alt={t.name} className="w-full h-full object-cover" />
          ) : (
            <Trophy size={16} className="text-red-500/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{t.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {t.game && <span className="text-muted-foreground text-xs font-mono">{t.game}</span>}
            <span className={`flex items-center gap-1 text-xs ${st.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />{st.text}
            </span>
          </div>
        </div>
        {(t.prizeAmount ?? 0) > 0 && (
          <span className="font-orbitron font-bold text-xs shrink-0 flex items-center gap-0.5" style={{ color: "oklch(0.65 0.18 80)" }}>
            <Coins size={11} />{t.prizeAmount} RLC
          </span>
        )}
      </div>
    );
    return onClick ? inner : <Link href={defaultHref}>{inner}</Link>;
  }

  // ── Variante horizontal (fila con banner) ─────────────────────────────────
  if (variant === "horizontal") {
    const inner = (
      <div
        className={`flex gap-4 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${className}`}
        style={{
          background: selected ? "var(--bg-hover)" : "var(--bg-card)",
          border: `1px solid ${selected ? "oklch(0.55 0.22 25 / 0.5)" : "oklch(0.18 0.01 0)"}`,
          borderRadius: "12px",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.55 0.22 25 / 0.3)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = selected ? "var(--bg-hover)" : "var(--bg-card)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.borderColor = selected ? "oklch(0.55 0.22 25 / 0.5)" : "oklch(0.18 0.01 0)";
        }}
        onClick={onClick}
      >
        <div className="w-28 h-24 shrink-0 bg-card overflow-hidden relative">
          {t.banner ? (
            <img src={t.banner || undefined} alt={t.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-950/30 to-zinc-900">
              <Trophy size={24} className="text-red-500/30" />
            </div>
          )}
          {t.isLive && (
            <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-mono animate-pulse">
              <Radio size={8} /> EN VIVO
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-3 pr-4">
          {t.game && <p className="text-xs font-mono text-red-400 mb-0.5">{t.game}</p>}
          <p className="text-white font-bold text-sm line-clamp-1 mb-1">{t.name}</p>
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
            <span className={`text-xs ${st.color}`}>{st.text}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {t.bracketType && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono bg-secondary/80 text-muted-foreground">
                <GitBranch size={9} /> {bracketLabel(t.bracketType)}
              </span>
            )}
            {formatLabel && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono bg-secondary/80 text-muted-foreground">
                <Users size={9} /> {formatLabel}
              </span>
            )}
            {t.maxTeams != null && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono bg-secondary/80 text-muted-foreground">
                <Hash size={9} /> {t.registeredCount ?? 0}/{t.maxTeams}
              </span>
            )}
          </div>
        </div>
      </div>
    );
    return onClick ? inner : <Link href={defaultHref}>{inner}</Link>;
  }

  // ── Variante default (tarjeta vertical) ──────────────────────────────────
  const inner = (
    <div
      className={`shrink-0 overflow-hidden cursor-pointer group transition-all duration-300 ${className}`}
      style={{
        scrollSnapAlign: "start",
        width: "340px",
        background: selected
          ? "linear-gradient(to bottom, oklch(0.16 0.01 0), oklch(0.11 0.005 0))"
          : "linear-gradient(to bottom, oklch(0.14 0.01 0), oklch(0.10 0.005 0))",
        border: `1px solid ${selected ? "oklch(0.55 0.22 25 / 0.5)" : "oklch(0.20 0.01 0)"}`,
        borderRadius: "16px",
        boxShadow: selected
          ? "0 0 0 1px oklch(0.55 0.22 25 / 0.3), 0 8px 32px rgba(0,0,0,0.5)"
          : "0 4px 24px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.55 0.22 25 / 0.35)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px oklch(0.55 0.22 25 / 0.2)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.borderColor = selected ? "oklch(0.55 0.22 25 / 0.5)" : "oklch(0.20 0.01 0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = selected
          ? "0 0 0 1px oklch(0.55 0.22 25 / 0.3), 0 8px 32px rgba(0,0,0,0.5)"
          : "0 4px 24px rgba(0,0,0,0.4)";
      }}
      onClick={onClick}
    >
      {/* ── Banner Section ── */}
      <div className="relative h-40 w-full overflow-hidden" style={{ borderRadius: "16px 16px 0 0" }}>
        {t.banner ? (
          <img
            src={t.banner || undefined}
            alt={t.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, oklch(0.14 0.04 25) 0%, oklch(0.09 0.005 0) 100%)" }}
          >
            <Trophy size={40} style={{ color: "oklch(0.55 0.22 25 / 0.25)" }} />
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, oklch(0.10 0.005 0) 0%, transparent 55%)" }}
        />

        {/* LIVE badge */}
        {t.isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-display tracking-wider font-bold animate-pulse"
            style={{ background: "oklch(0.45 0.22 25)", color: "#fff", boxShadow: "0 0 10px oklch(0.55 0.22 25 / 0.6)" }}>
            <Radio size={9} /> EN VIVO
          </div>
        )}

        {/* Game badge — top right */}
        {t.game && (
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-display font-semibold tracking-wider"
            style={{
              background: "rgba(0,0,0,0.75)",
              color: "oklch(0.85 0.005 0)",
              border: "1px solid oklch(0.28 0.01 0)",
              backdropFilter: "blur(8px)",
            }}
          >
            {t.game}
          </div>
        )}
      </div>

      {/* ── Content Section ── */}
      <div className="px-5 py-5">

        {/* Tournament title */}
        <h2
          className="font-display text-base font-bold tracking-wide leading-snug mb-4 line-clamp-2 group-hover:text-red-300 transition-colors duration-200"
          style={{ color: "var(--text-primary)" }}
        >
          {t.name}
        </h2>

        {/* Status badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-5"
          style={{
            background: st.badgeBg,
            borderColor: st.badgeBorder,
            color: st.badgeText,
          }}
        >
          <CheckCircle2 size={14} />
          <span className="text-xs font-display font-semibold tracking-wider">{st.text}</span>
        </div>

        {/* Stats grid */}
        <div
          className="space-y-2.5 mb-5 pb-5"
          style={{ borderBottom: "1px solid oklch(0.20 0.01 0)" }}
        >
          {/* Equipos */}
          {t.maxTeams != null && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={14} style={{ color: "oklch(0.45 0.005 0)" }} />
                <span className="text-xs font-display tracking-wider" style={{ color: "oklch(0.50 0.005 0)" }}>
                  Equipos
                </span>
              </div>
              <span className="text-xs font-display font-bold tracking-wider" style={{ color: "var(--text-primary)" }}>
                {t.registeredCount ?? 0} / {t.maxTeams}
              </span>
            </div>
          )}

          {/* Formato */}
          {(t.bracketType || formatLabel) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch size={14} style={{ color: "oklch(0.45 0.005 0)" }} />
                <span className="text-xs font-display tracking-wider" style={{ color: "oklch(0.50 0.005 0)" }}>
                  Formato
                </span>
              </div>
              <span className="text-xs font-display font-bold tracking-wider" style={{ color: "var(--text-primary)" }}>
                {bracketLabel(t.bracketType)}{formatLabel ? ` · ${formatLabel}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Bottom row: organizer + date (left) / prize badge (right) */}
        <div className="flex items-end justify-between gap-3">
          {/* Left: organizer + date */}
          <div className="min-w-0">
            {t.creatorName && (
              <div className="mb-2">
                <p
                  className="text-xs font-display tracking-widest uppercase mb-0.5"
                  style={{ color: "oklch(0.38 0.005 0)" }}
                >
                  Organizador
                </p>
                <p className="text-sm font-display font-semibold truncate" style={{ color: "oklch(0.65 0.005 0)" }}>
                  {t.creatorName}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2" style={{ color: "oklch(0.45 0.005 0)" }}>
              <Calendar size={14} />
              <span className="text-xs font-display tracking-wider">{formatTournamentDate(t.startDate)}</span>
            </div>
          </div>

          {/* Right: prize badge */}
          {(t.prizeDescription?.trim() || (t.prizeAmount ?? 0) > 0) && (
            <div className="flex-shrink-0 flex flex-col items-end">
              <p
                className="text-xs font-display tracking-widest uppercase mb-1"
                style={{ color: "oklch(0.38 0.005 0)" }}
              >
                Premio
              </p>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg max-w-[120px]"
                style={{
                  background: "oklch(0.22 0.08 80 / 0.25)",
                  border: "1px solid oklch(0.50 0.18 80 / 0.40)",
                }}
              >
                <Trophy size={12} style={{ color: "oklch(0.72 0.18 80)", flexShrink: 0 }} />
                <span
                  className="text-xs font-display font-bold tracking-wider truncate"
                  style={{ color: "oklch(0.72 0.18 80)" }}
                >
                  {t.prizeDescription?.trim() || `${t.prizeAmount} RLC`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return onClick ? inner : <Link href={defaultHref}>{inner}</Link>;
}

// ─── Variante para grid (sin shrink-0, ancho 100%) ────────────────────────────
export function TournamentGridCard({ tournament, ...props }: Omit<TournamentCardProps, "variant">) {
  return (
    <TournamentCard
      tournament={tournament}
      variant="default"
      className="!w-full !shrink-1"
      {...props}
    />
  );
}
