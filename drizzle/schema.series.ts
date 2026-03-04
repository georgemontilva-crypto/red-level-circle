// ─── Match Series (BOx Format) ────────────────────────────────────────────────
// Extiende tournament_matches con soporte para series BO1/BO2/BO3/BO5/BO7.
// Cada tournamentMatch puede tener UNA serie asociada (relación 1:1).
//
// Relaciones:
//   tournament_matches (1) ──── (1) match_series ──── (N) series_maps
//
// Flujo de vida:
//   1. Al crear/programar un match con formato BOx, se crea un matchSeries.
//   2. Se generan N seriesMaps (N = max del formato: 2, 3, 5 o 7).
//   3. betsOpenAt = scheduledAt - 60 min; betsCloseAt = scheduledAt - 5 min.
//   4. Al reportar resultado de cada mapa, se actualiza winsTeam1/winsTeam2.
//   5. Cuando un equipo alcanza el umbral de victorias, la serie se completa.
//   6. Se pagan las apuestas y se actualizan rankings.

import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

export const matchSeries = mysqlTable("match_series", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull().unique(), // FK → tournament_matches.id
  tournamentId: int("tournamentId").notNull(),
  // Formato de la serie
  format: mysqlEnum("format", ["BO1", "BO2", "BO3", "BO5", "BO7"]).default("BO1").notNull(),
  // Victorias acumuladas por cada equipo en la serie
  winsTeam1: int("winsTeam1").default(0).notNull(),
  winsTeam2: int("winsTeam2").default(0).notNull(),
  // Mapas totales jugados (para estadísticas de desempate en ranking)
  mapsWonTeam1: int("mapsWonTeam1").default(0).notNull(),
  mapsWonTeam2: int("mapsWonTeam2").default(0).notNull(),
  // Equipo ganador de la serie (se rellena al completarse)
  seriesWinnerId: int("seriesWinnerId"),
  // Estado de la serie
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  // Ventana de apuestas de la serie completa:
  //   betsOpenAt  = scheduledAt del mapa 1 - 60 min
  //   betsCloseAt = scheduledAt del mapa 1 - 5 min
  betsOpenAt: timestamp("betsOpenAt"),
  betsCloseAt: timestamp("betsCloseAt"),
  // Escrow: suma total de RLC apostado en custodia hasta resolver la serie
  escrowAmount: int("escrowAmount").default(0).notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MatchSeries = typeof matchSeries.$inferSelect;
export type InsertMatchSeries = typeof matchSeries.$inferInsert;

// ─── Series Maps (Sub-Matches / Mapas individuales) ───────────────────────────
// Cada fila representa un mapa/juego individual dentro de una serie.
// mapNumber = 1, 2, 3... hasta el máximo del formato (2, 3, 5 o 7).
// Los mapas que no se juegan (ej. mapa 3 en un 2-0 de BO3) quedan en
// status = "cancelled" e isCancelled = true.
export const seriesMaps = mysqlTable("series_maps", {
  id: int("id").autoincrement().primaryKey(),
  seriesId: int("seriesId").notNull(),   // FK → match_series.id
  matchId: int("matchId").notNull(),     // FK → tournament_matches.id (para joins rápidos)
  mapNumber: int("mapNumber").notNull(), // 1-indexed
  mapName: varchar("mapName", { length: 128 }), // nombre del mapa/escenario (opcional)
  // Resultado del mapa
  scoreTeam1: int("scoreTeam1"),
  scoreTeam2: int("scoreTeam2"),
  winnerId: int("winnerId"), // teamId ganador de este mapa
  // Estado del mapa
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  // Mapa cancelado: ej. mapa 3 de BO3 si alguien ya ganó 2-0
  isCancelled: boolean("isCancelled").default(false).notNull(),
  scheduledAt: timestamp("scheduledAt"),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SeriesMap = typeof seriesMaps.$inferSelect;
export type InsertSeriesMap = typeof seriesMaps.$inferInsert;
