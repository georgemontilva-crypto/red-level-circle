import { trpc } from "@/lib/trpc";
import { Trophy, Search, Filter, ChevronRight, Calendar, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const GAMES = ["Todos", "League of Legends", "Valorant", "CS2", "FIFA", "Fortnite", "Dota 2", "Rocket League"];
const STATUSES = [
  { value: "", label: "Todos" },
  { value: "registration_open", label: "Inscripciones Abiertas" },
  { value: "in_progress", label: "En Curso" },
  { value: "completed", label: "Finalizados" },
];
const BRACKET_LABELS: Record<string, string> = {
  single_elimination: "Elim. Simple",
  double_elimination: "Doble Elim.",
  groups: "Grupos",
};
const STATUS_COLORS: Record<string, string> = {
  registration_open: "oklch(0.65 0.18 145)",
  in_progress: "oklch(0.65 0.18 80)",
  completed: "oklch(0.50 0.005 0)",
  draft: "oklch(0.55 0.18 220)",
  registration_closed: "oklch(0.55 0.22 25)",
  cancelled: "oklch(0.40 0.005 0)",
};
const STATUS_LABELS: Record<string, string> = {
  registration_open: "Inscripciones Abiertas",
  in_progress: "En Curso",
  completed: "Finalizado",
  draft: "Próximamente",
  registration_closed: "Inscripciones Cerradas",
  cancelled: "Cancelado",
};

export default function Tournaments() {
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState("Todos");
  const [selectedStatus, setSelectedStatus] = useState("");

  const { data: tournaments, isLoading } = trpc.tournaments.list.useQuery({
    search: search || undefined,
    game: selectedGame !== "Todos" ? selectedGame : undefined,
    status: selectedStatus || undefined,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "oklch(0.07 0.005 0 / 0.95)",
          borderBottom: "1px solid oklch(0.20 0.01 0)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/">
          <span className="font-display text-xl tracking-widest cursor-pointer">
            <span className="neon-text">RED</span>
            <span className="text-foreground">LEVEL</span>
            <span className="text-muted-foreground text-sm ml-1">CIRCLE</span>
          </span>
        </Link>
        <Link href="/dashboard">
          <button
            className="px-5 py-2 rounded-full font-display text-xs tracking-widest transition-all duration-300"
            style={{
              background: "oklch(0.55 0.22 25)",
              color: "oklch(0.98 0 0)",
              boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)",
            }}
          >
            DASHBOARD
          </button>
        </Link>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold tracking-wider text-foreground mb-2">
            TORNEOS
          </h1>
          <p className="text-muted-foreground">Explora y únete a torneos de esports</p>
        </div>

        {/* Filters */}
        <div
          className="rounded-xl p-5 mb-8"
          style={{
            background: "oklch(0.10 0.005 0)",
            border: "1px solid oklch(0.18 0.01 0)",
          }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "oklch(0.45 0.005 0)" }}
              />
              <input
                type="text"
                placeholder="Buscar torneos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm font-sans transition-all duration-200"
                style={{
                  background: "oklch(0.09 0.005 0)",
                  border: "1px solid oklch(0.22 0.01 0)",
                  color: "oklch(0.90 0.005 0)",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "oklch(0.55 0.22 25)";
                  e.target.style.boxShadow = "0 0 8px oklch(0.55 0.22 25 / 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "oklch(0.22 0.01 0)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 rounded-lg text-sm font-display tracking-wider transition-all duration-200"
              style={{
                background: "oklch(0.09 0.005 0)",
                border: "1px solid oklch(0.22 0.01 0)",
                color: "oklch(0.80 0.005 0)",
                outline: "none",
              }}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value} style={{ background: "oklch(0.09 0.005 0)" }}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Game filter chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {GAMES.map((game) => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className="px-3 py-1 rounded-full font-display text-xs tracking-wider transition-all duration-200"
                style={
                  selectedGame === game
                    ? {
                        background: "oklch(0.55 0.22 25)",
                        color: "oklch(0.98 0 0)",
                        boxShadow: "0 0 8px oklch(0.55 0.22 25 / 0.4)",
                      }
                    : {
                        background: "oklch(0.13 0.005 0)",
                        border: "1px solid oklch(0.22 0.01 0)",
                        color: "oklch(0.60 0.005 0)",
                      }
                }
              >
                {game}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-xl h-52 animate-pulse"
                style={{ background: "oklch(0.10 0.005 0)" }}
              />
            ))}
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <>
            <p className="text-muted-foreground text-sm mb-6 font-display tracking-wider">
              {tournaments.length} torneo{tournaments.length !== 1 ? "s" : ""} encontrado
              {tournaments.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((t) => {
                const statusColor = STATUS_COLORS[t.status] ?? "oklch(0.55 0.005 0)";
                const statusLabel = STATUS_LABELS[t.status] ?? t.status;
                return (
                  <Link key={t.id} href={`/tournaments/${t.id}`}>
                    <div
                      className="rounded-xl p-5 cursor-pointer transition-all duration-300 h-full flex flex-col"
                      style={{
                        background: "oklch(0.10 0.005 0)",
                        border: "1px solid oklch(0.18 0.01 0)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0.4)";
                        e.currentTarget.style.boxShadow = "0 0 20px oklch(0.55 0.22 25 / 0.1)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "oklch(0.18 0.01 0)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span
                          className="text-xs font-display tracking-wider px-2 py-1 rounded-full"
                          style={{
                            background: `${statusColor}20`,
                            border: `1px solid ${statusColor}50`,
                            color: statusColor,
                          }}
                        >
                          {statusLabel}
                        </span>
                        <span
                          className="text-xs font-tech px-2 py-1 rounded"
                          style={{
                            background: "oklch(0.13 0.005 0)",
                            color: "oklch(0.60 0.005 0)",
                          }}
                        >
                          {t.game}
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-foreground mb-2 tracking-wide">
                        {t.name}
                      </h3>

                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                        {t.description ?? "Sin descripción"}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: "oklch(0.50 0.005 0)" }} className="font-display tracking-wider">
                            {BRACKET_LABELS[t.bracketType] ?? t.bracketType}
                          </span>
                          <span style={{ color: "oklch(0.50 0.005 0)" }} className="flex items-center gap-1">
                            <Users size={12} />
                            Máx. {t.maxTeams} equipos
                          </span>
                        </div>

                        {t.startDate && (
                          <div
                            className="flex items-center gap-1 text-xs"
                            style={{ color: "oklch(0.55 0.005 0)" }}
                          >
                            <Calendar size={12} />
                            <span>
                              {new Date(t.startDate).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}

                        {t.prizeDescription && (
                          <div
                            className="text-xs font-display tracking-wider"
                            style={{ color: "oklch(0.65 0.18 80)" }}
                          >
                            🏆 {t.prizeDescription}
                          </div>
                        )}
                      </div>

                      <div
                        className="mt-4 pt-3 flex items-center justify-between"
                        style={{ borderTop: "1px solid oklch(0.15 0.005 0)" }}
                      >
                        <span className="text-xs text-muted-foreground">
                          por {t.creatorName ?? "Organizador"}
                        </span>
                        <ChevronRight size={16} style={{ color: "oklch(0.55 0.22 25)" }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div
            className="rounded-xl p-16 text-center"
            style={{
              background: "oklch(0.10 0.005 0)",
              border: "1px solid oklch(0.18 0.01 0)",
            }}
          >
            <Trophy size={48} className="mx-auto mb-4" style={{ color: "oklch(0.25 0.01 0)" }} />
            <p className="text-muted-foreground font-display tracking-wider text-lg">
              No se encontraron torneos
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Intenta con otros filtros o vuelve más tarde
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
