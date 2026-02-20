import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "premium", "admin"]).default("user").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Teams ────────────────────────────────────────────────────────────────────
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  logo: text("logo"),
  banner: text("banner"),
  captainId: int("captainId").notNull(), // FK → users.id
  description: text("description"),
  game: varchar("game", { length: 64 }),
  points: int("points").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// ─── Team Members ─────────────────────────────────────────────────────────────
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(), // FK → teams.id
  userId: int("userId").notNull(), // FK → users.id
  role: mysqlEnum("role", ["captain", "player", "substitute"]).default("player").notNull(),
  gameId: varchar("gameId", { length: 128 }), // in-game username/ID
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ─── Tournaments ──────────────────────────────────────────────────────────────
export const tournaments = mysqlTable("tournaments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  game: varchar("game", { length: 64 }).notNull(),
  description: text("description"),
  rules: text("rules"),
  bracketType: mysqlEnum("bracketType", [
    "single_elimination",
    "double_elimination",
    "groups",
  ]).notNull(),
  maxTeams: int("maxTeams").default(16).notNull(),
  minPlayersPerTeam: int("minPlayersPerTeam").default(1).notNull(),
  maxPlayersPerTeam: int("maxPlayersPerTeam").default(5).notNull(),
  prizeDescription: text("prizeDescription"),
  prizeAmount: int("prizeAmount").default(0), // in platform coins
  registrationStart: timestamp("registrationStart"),
  registrationEnd: timestamp("registrationEnd"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", [
    "draft",
    "registration_open",
    "registration_closed",
    "in_progress",
    "completed",
    "cancelled",
  ]).default("draft").notNull(),
  creatorId: int("creatorId").notNull(), // FK → users.id (must be premium/admin)
  winnerId: int("winnerId"), // FK → teams.id
  banner: text("banner"),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = typeof tournaments.$inferInsert;

// ─── Tournament Registrations ─────────────────────────────────────────────────
export const tournamentRegistrations = mysqlTable("tournament_registrations", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(), // FK → tournaments.id
  teamId: int("teamId").notNull(), // FK → teams.id
  status: mysqlEnum("status", [
    "Pendiente",
    "Aprobado",
    "Rechazado",
    "Cancelado",
  ]).default("Pendiente").notNull(),
  creatorMessage: text("creatorMessage"), // optional rejection/approval note
  teamMessage: text("teamMessage"), // optional note from team
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TournamentRegistration = typeof tournamentRegistrations.$inferSelect;
export type InsertTournamentRegistration = typeof tournamentRegistrations.$inferInsert;

// ─── Registration Audit Log ───────────────────────────────────────────────────
export const registrationAuditLog = mysqlTable("registration_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(), // FK → tournament_registrations.id
  previousStatus: varchar("previousStatus", { length: 32 }),
  newStatus: varchar("newStatus", { length: 32 }).notNull(),
  changedById: int("changedById").notNull(), // FK → users.id
  note: text("note"),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type RegistrationAuditLog = typeof registrationAuditLog.$inferSelect;

// ─── Tournament Matches ───────────────────────────────────────────────────────
export const tournamentMatches = mysqlTable("tournament_matches", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(), // FK → tournaments.id
  round: int("round").notNull(),
  matchNumber: int("matchNumber").notNull(),
  team1Id: int("team1Id"), // FK → teams.id (null = TBD)
  team2Id: int("team2Id"), // FK → teams.id (null = TBD)
  winnerId: int("winnerId"), // FK → teams.id
  team1Score: int("team1Score"),
  team2Score: int("team2Score"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  bracketPosition: json("bracketPosition"), // { round, position, side? }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TournamentMatch = typeof tournamentMatches.$inferSelect;
export type InsertTournamentMatch = typeof tournamentMatches.$inferInsert;
