/**
 * TournamentCard — Componente universal de tarjeta de torneo.
 * Muestra: banner, juego, nombre, estado, bracket, formato, slots, organizador, fecha y premio.
 * Usado en: Home (scroll horizontal), Tournaments (grid), MyTournaments, Dashboard, Betting, etc.
 */
import { Link } from "wouter";
import { Trophy, Calendar, Users, GitBranch, Hash, Radio, Coins } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function bracketLabel(b: string | null | undefined) {
  const m: Record<string, string> = {
    single_elimination: "Eliminación Simple",
    double_elimination: "Eliminación Doble",
    groups: "Grupos",
  };
  return m[b ?? ""] ?? b ?? "";
}

export function tournamentStatusInfo(s: string | null | undefined) {
  const map: Record<string, { text: string; color: string; dot: string }> = {
    registration_open: { text: "Inscripciones abiertas", color: "text-green-400", dot: "bg-green-500" },
    in_progress:       { text: "En curso",               color: "text-yellow-400", dot: "bg-yellow-400 animate-pulse" },
    upcoming:          { text: "Próximamente",            color: "text-blue-400",   dot: "bg-blue-500" },
    completed:         { text: "Finalizado",              color: "text-muted-foreground",   dot: "bg-zinc-600" },
    cancelled:         { text: "Cancelado",               color: "text-red-600",    dot: "bg-red-700" },
    draft:             { text: "Borrador",                color: "text-muted-foreground",   dot: "bg-muted" },
    pending_approval:  { text: "Pendiente de aprobación", color: "text-orange-400", dot: "bg-orange-500" },
    registration_closed: { text: "Inscripciones cerradas", color: "text-muted-foreground", dot: "bg-zinc-600" },
  };
  return map[s ?? ""] ?? { text: s ?? "", color: "text-muted-foreground", dot: "bg-zinc-600" };
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
  isLive?: boolean | null;
  isFeatured?: boolean | null;
}

// ─── Variantes ────────────────────────────────────────────────────────────────
type CardVariant = "default" | "compact" | "horizontal";

interface TournamentCardProps {
  tournament: TournamentCardData;
  /** default = tarjeta vertical estándar (scroll horizontal, grid)
   *  compact  = fila horizontal compacta (dashboard, listas)
   *  horizontal = fila con banner a la izquierda (betting, inscripciones)
   */
  variant?: CardVariant;
  /** Si se pasa, envuelve en Link; si no, solo renderiza el div */
  href?: string;
  /** Callback al hacer click (para Betting, etc.) */
  onClick?: () => void;
  /** Resaltar como seleccionado */
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
          background: "var(--bg-card)",
        border: `1px solid ${selected ? "var(--accent-red)" : "var(--border-main)"}`,
        borderRadius: "12px",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent-red)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.borderColor = selected ? "var(--accent-red)" : "var(--border-main)";
      }}
        onClick={onClick}
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
          {t.banner ? (
            <img src={t.banner || undefined} alt={t.name} className="w-full h-full object-cover" />
          ) : (
            <Trophy size={16} className="text-red-500/40" />
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{t.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {t.game && <span className="text-muted-foreground text-xs font-mono">{t.game}</span>}
            <span className={`flex items-center gap-1 text-xs ${st.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />{st.text}
            </span>
          </div>
        </div>
        {/* Prize */}
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
        background: "var(--bg-card)",
        border: `1px solid ${selected ? "var(--accent-red)" : "var(--border-main)"}`,
        borderRadius: "12px",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent-red)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.borderColor = selected ? "var(--accent-red)" : "var(--border-main)";
      }}
        onClick={onClick}
      >
        {/* Banner lateral */}
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
        {/* Info */}
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
      className={`shrink-0 w-64 overflow-hidden cursor-pointer group transition-all duration-300 ${className}`}
      style={{
        scrollSnapAlign: "start",
        background: "var(--bg-card)",
        border: `1px solid ${selected ? "var(--accent-red)" : "var(--border-main)"}`,
        borderRadius: "12px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent-red)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.borderColor = selected ? "var(--accent-red)" : "var(--border-main)";
      }}
      onClick={onClick}
    >
      {/* Banner */}
      <div className="relative h-36 bg-card overflow-hidden">
        {t.banner ? (
          <img src={t.banner || undefined} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.12 0.02 25) 0%, oklch(0.08 0.005 0) 100%)" }}>
            <Trophy size={36} style={{ color: "oklch(0.55 0.22 25 / 0.3)" }} />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.12 0.005 0) 0%, transparent 60%)" }} />
        {/* Game badge */}
        {t.game && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-xs font-mono font-semibold"
            style={{ background: "rgba(0,0,0,0.70)", color: "oklch(0.75 0.18 80)", border: "1px solid oklch(0.55 0.18 80 / 0.4)", backdropFilter: "blur(8px)" }}>
            {t.game}
          </div>
        )}
        {/* EN VIVO badge */}
        {t.isLive && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-mono animate-pulse">
            <Radio size={9} /> EN VIVO
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Título */}
        <p className="text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-red-300 transition-colors">{t.name}</p>

        {/* Estado */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
          <span className={`text-xs font-semibold ${st.color}`}>{st.text}</span>
        </div>

        {/* Meta tags: bracket + formato + slots */}
        <div className="flex flex-wrap gap-1.5">
          {t.bracketType && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono"
              style={{ background: "oklch(0.18 0.01 0)", color: "oklch(0.55 0.01 0)" }}>
              <GitBranch size={10} /> {bracketLabel(t.bracketType)}
            </span>
          )}
          {formatLabel && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono"
              style={{ background: "oklch(0.18 0.01 0)", color: "oklch(0.55 0.01 0)" }}>
              <Users size={10} /> {formatLabel}
            </span>
          )}
          {t.maxTeams != null && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono"
              style={{ background: "oklch(0.18 0.01 0)", color: "oklch(0.55 0.01 0)" }}>
              <Hash size={10} /> {t.registeredCount ?? 0} / {t.maxTeams}
            </span>
          )}
        </div>

        {/* Organizador */}
        {t.creatorName && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs font-mono">Organizado por</span>
            <span className="text-muted-foreground text-xs font-semibold truncate">{t.creatorName}</span>
          </div>
        )}

        {/* Fecha + Premio */}
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <span className="text-muted-foreground text-xs flex items-center gap-1 font-mono">
            <Calendar size={10} />{formatTournamentDate(t.startDate)}
          </span>
          {(t.prizeAmount ?? 0) > 0 && (
            <span className="flex items-center gap-1 font-orbitron font-bold text-xs" style={{ color: "oklch(0.65 0.18 80)" }}>
              <Coins size={11} className="inline mr-0.5" />{t.prizeAmount} RLC
            </span>
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
