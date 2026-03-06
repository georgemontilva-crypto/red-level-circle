import { and, desc, eq, inArray, isNotNull, like, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";
import {
  InsertUser,
  registrationAuditLog,
  teamMembers,
  teams,
  tournamentMatches,
  tournamentRegistrations,
  tournaments,
  users,
  games,
  news,
  bets,
  streams,
  promotions,
  rlcTransactions,
  teamAchievements,
  shopItems,
  shopOrders,
  cosmetics,
  userCosmetics,
  rewardTasks,
  userRewardClaims,
  brandAds,
  userFollows,
  contentCreators,
  verificationRequests,
  type InsertGame,
  type InsertNews,
  type InsertBet,
  type InsertStream,
  type InsertShopItem,
  type InsertCosmetic,
  type InsertRewardTask,
  type InsertBrandAd,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

// ─── Pool de conexiones MySQL ─────────────────────────────────────────────────
//
// Configuración para producción en Railway Pro con TiDB/MySQL.
//
// connectionLimit: 25 conexiones paralelas a la DB.
//   - Cada request que necesita DB toma una conexión del pool.
//   - Si todas están ocupadas, el request espera en cola (waitForConnections).
//   - TiDB soporta miles de conexiones; 25 es conservador y suficiente para
//     1.000+ usuarios simultáneos con queries rápidas (<50ms).
//
// queueLimit: 200 requests pueden esperar en cola antes de recibir error.
//   - Protege contra picos de tráfico sin rechazar requests inmediatamente.
//
// idleTimeout: cierra conexiones inactivas después de 60s para liberar recursos.
// keepAlive: mantiene conexiones vivas y detecta desconexiones de red.

let _pool: mysql.Pool | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

function createDbPool(): mysql.Pool {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL no está configurado");

  const pool = mysql.createPool({
    uri,
    connectionLimit: 25,
    waitForConnections: true,
    queueLimit: 200,
    idleTimeout: 60_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    // Reconexión automática en caso de pérdida de conexión
    connectTimeout: 10_000,
    // TiDB/PlanetScale requieren SSL en producción
    ssl: uri.includes("tidb") || uri.includes("planetscale") ? { rejectUnauthorized: true } : undefined,
  });

  // Monitoreo del pool: loguear eventos críticos
  pool.on("connection", () => {
    // Nueva conexión creada en el pool
  });

  (pool as any).on("error", (err: Error) => {
    console.error("[DB Pool] Error inesperado:", err.message);
    // Resetear el pool para forzar reconexión en el próximo getDb()
    if ((err as any).code === "PROTOCOL_CONNECTION_LOST" || (err as any).code === "ECONNRESET") {
      console.warn("[DB Pool] Conexión perdida — reconectando en el próximo request");
      _pool = null;
      _db = null;
    }
  });

  return pool;
}

/**
 * Retorna la instancia de Drizzle ORM conectada al pool de MySQL.
 * El pool se crea una sola vez y se reutiliza en todos los requests.
 * Si la conexión se pierde, se reconecta automáticamente.
 */
export async function getDb() {
  if (!_db || !_pool) {
    if (!process.env.DATABASE_URL) return null;
    try {
      _pool = createDbPool();
      _db = drizzle(_pool);
      console.log("[DB Pool] Inicializado — connectionLimit: 25, queueLimit: 200");
    } catch (error) {
      console.error("[DB Pool] Error al inicializar:", (error as Error).message);
      _pool = null;
      _db = null;
    }
  }
  return _db;
}

/**
 * Cierra el pool de conexiones limpiamente.
 * Llamar en el graceful shutdown del servidor.
 */
export async function closeDbPool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
    console.log("[DB Pool] Cerrado limpiamente");
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "passwordHash", "avatar", "nickname", "country"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.emailVerified !== undefined) {
    values.emailVerified = user.emailVerified;
    updateSet.emailVerified = user.emailVerified;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result[0];
}

export async function updateUserRole(userId: number, role: "user" | "premium" | "organizer" | "admin" | "super_admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Teams ────────────────────────────────────────────────────────────────────
export async function createTeam(data: {
  name: string;
  captainId: number;
  description?: string;
  game?: string;
  logo?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Fase 3 dual-write: resolver gameSlug a partir del nombre del juego
  const gameSlug = await resolveGameSlug(data.game);
  const [result] = await db.insert(teams).values({ ...data, gameSlug: gameSlug ?? null });
  const teamId = (result as { insertId: number }).insertId;
  // Add captain as team member
  await db.insert(teamMembers).values({ teamId, userId: data.captainId, role: "captain" });
  return teamId;
}

export async function getTeamsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const members = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));
  if (!members.length) return [];
  const teamIds = members.map((m) => m.teamId);
  return db.select().from(teams).where(sql`${teams.id} IN (${sql.join(teamIds.map(id => sql`${id}`), sql`, `)})`);
}

export async function getTeamById(teamId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  return result[0];
}

export async function getTeamMembers(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  const equippedCosmetic = alias(userCosmetics, "equippedCosmeticMember");
  return db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      gameId: teamMembers.gameId,
      joinedAt: teamMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
      nickname: users.nickname,
      avatar: users.avatar,
      activeFrameImage: cosmetics.frameImage,
      // Perfil competitivo
      mainGame: users.mainGame,
      gameRole: users.gameRole,
      rosterImageUrl: users.rosterImageUrl,
      rosterPhoto: users.rosterPhoto,
      country: users.country,
      elo: users.elo,
      competitiveRegion: users.competitiveRegion,
      competitiveScore: users.competitiveScore,
    })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .leftJoin(equippedCosmetic, and(eq(equippedCosmetic.userId, users.id), eq(equippedCosmetic.isEquipped, true)))
    .leftJoin(cosmetics, eq(cosmetics.id, equippedCosmetic.cosmeticId))
    .where(eq(teamMembers.teamId, teamId));
}

export async function addTeamMember(data: {
  teamId: number;
  userId: number;
  role?: "captain" | "player" | "substitute" | "coach";
  gameId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(teamMembers).values({ ...data, role: data.role ?? "player" });
}

// ─── Tournaments ──────────────────────────────────────────────────────────────
export async function createTournament(data: {
  name: string;
  game: string;
  description?: string;
  rules?: string;
  bracketType: "single_elimination" | "double_elimination" | "groups";
  maxTeams?: number;
  minPlayersPerTeam?: number;
  maxPlayersPerTeam?: number;
  prizeDescription?: string;
  prizeAmount?: number;
  registrationStart?: Date;
  registrationEnd?: Date;
  startDate?: Date;
  endDate?: Date;
  creatorId: number;
  banner?: string;
  primaryColor?: string;
  secondaryColor?: string;
  streamUrl?: string;
  streamPlatform?: string;
  registrationType?: "team" | "player" | "both";
  prizeFirst?: string;
  prizeSecond?: string;
  prizeThird?: string;
  isPublic?: boolean;
  status?: "draft" | "pending_approval" | "registration_open" | "registration_closed" | "in_progress" | "completed" | "cancelled";
  adminNote?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Fase 3 dual-write: resolver gameSlug a partir del nombre del juego
  const gameSlug = await resolveGameSlug(data.game);
  const { status, streamPlatform, ...rest } = data;
  const [result] = await db.insert(tournaments).values({
    ...rest,
    gameSlug: gameSlug ?? null,
    status: (status ?? "draft") as any,
    streamPlatform: streamPlatform as any,
    maxTeams: data.maxTeams ?? 16,
    minPlayersPerTeam: data.minPlayersPerTeam ?? 1,
    maxPlayersPerTeam: data.maxPlayersPerTeam ?? 5,
    isPublic: data.isPublic ?? true,
  });
  return (result as { insertId: number }).insertId;
}

const PUBLIC_STATUSES = ["registration_open", "registration_closed", "in_progress", "completed"] as const;

export async function getTournaments(filters?: {
  status?: string;
  gameSlug?: string;  // slug canónico del juego (Fase 5a: única fuente de verdad)
  search?: string;
  creatorId?: number;
  isPublic?: boolean;
  publicOnly?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.publicOnly && !filters?.status) {
    conditions.push(inArray(tournaments.status, [...PUBLIC_STATUSES] as any[]));
  } else if (filters?.status) {
    conditions.push(eq(tournaments.status, filters.status as any));
  }
  // Filtro por juego: gameSlug es la única fuente de verdad (Fase 5a)
  if (filters?.gameSlug) {
    conditions.push(eq(tournaments.gameSlug, filters.gameSlug));
  }
  if (filters?.creatorId) conditions.push(eq(tournaments.creatorId, filters.creatorId));
  if (filters?.isPublic !== undefined) conditions.push(eq(tournaments.isPublic, filters.isPublic));
  if (filters?.search) {
    const safeSearch = filters.search.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_ ");
    conditions.push(
      or(
        like(tournaments.name, `%${safeSearch}%`),
        like(tournaments.game, `%${safeSearch}%`)
      )
    );
  }

  const query = db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      game: tournaments.game,
      description: tournaments.description,
      bracketType: tournaments.bracketType,
      registrationType: tournaments.registrationType,
      minPlayersPerTeam: tournaments.minPlayersPerTeam,
      maxPlayersPerTeam: tournaments.maxPlayersPerTeam,
      maxTeams: tournaments.maxTeams,
      status: tournaments.status,
      startDate: tournaments.startDate,
      registrationEnd: tournaments.registrationEnd,
      prizeDescription: tournaments.prizeDescription,
      prizeAmount: tournaments.prizeAmount,
      creatorId: tournaments.creatorId,
      banner: tournaments.banner,
      isPublic: tournaments.isPublic,
      isFeatured: tournaments.isFeatured,
      isLive: tournaments.isLive,
      createdAt: tournaments.createdAt,
      creatorName: users.name,
    })
    .from(tournaments)
    .leftJoin(users, eq(tournaments.creatorId, users.id))
    .orderBy(desc(tournaments.createdAt));

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function getTournamentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      game: tournaments.game,
      description: tournaments.description,
      rules: tournaments.rules,
      bracketType: tournaments.bracketType,
      maxTeams: tournaments.maxTeams,
      minPlayersPerTeam: tournaments.minPlayersPerTeam,
      maxPlayersPerTeam: tournaments.maxPlayersPerTeam,
      status: tournaments.status,
      startDate: tournaments.startDate,
      endDate: tournaments.endDate,
      registrationStart: tournaments.registrationStart,
      registrationEnd: tournaments.registrationEnd,
      prizeDescription: tournaments.prizeDescription,
      prizeAmount: tournaments.prizeAmount,
      prizeFirst: tournaments.prizeFirst,
      prizeSecond: tournaments.prizeSecond,
      prizeThird: tournaments.prizeThird,
      creatorId: tournaments.creatorId,
      winnerId: tournaments.winnerId,
      banner: tournaments.banner,
      isPublic: tournaments.isPublic,
      createdAt: tournaments.createdAt,
      updatedAt: tournaments.updatedAt,
      creatorName: users.name,
    })
    .from(tournaments)
    .leftJoin(users, eq(tournaments.creatorId, users.id))
    .where(eq(tournaments.id, id))
    .limit(1);
  return result[0];
}

export async function updateTournament(
  id: number,
  data: Partial<typeof tournaments.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Fase 3 dual-write: si se actualiza el campo game, recalcular gameSlug
  let payload = { ...data };
  if (data.game !== undefined) {
    const resolvedSlug = await resolveGameSlug(data.game);
    payload.gameSlug = resolvedSlug ?? null;
  }
  await db.update(tournaments).set(payload).where(eq(tournaments.id, id));
}

export async function updateTournamentStatus(
  id: number,
  status: typeof tournaments.$inferSelect["status"]
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tournaments).set({ status }).where(eq(tournaments.id, id));
}

// ─── Registrations ────────────────────────────────────────────────────────────
export async function createRegistration(data: {
  tournamentId: number;
  teamId: number;
  teamMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(tournamentRegistrations).values({
    ...data,
    status: "Pendiente",
  });
  return (result as { insertId: number }).insertId;
}

export async function getRegistrationsByTournament(
  tournamentId: number,
  statusFilter?: string
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(tournamentRegistrations.tournamentId, tournamentId)];
  if (statusFilter && statusFilter !== "Todos") {
    conditions.push(eq(tournamentRegistrations.status, statusFilter as any));
  }
  return db
    .select({
      id: tournamentRegistrations.id,
      tournamentId: tournamentRegistrations.tournamentId,
      teamId: tournamentRegistrations.teamId,
      status: tournamentRegistrations.status,
      creatorMessage: tournamentRegistrations.creatorMessage,
      teamMessage: tournamentRegistrations.teamMessage,
      registeredAt: tournamentRegistrations.registeredAt,
      updatedAt: tournamentRegistrations.updatedAt,
      teamName: teams.name,
      teamLogo: teams.logo,
    })
    .from(tournamentRegistrations)
    .leftJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
    .where(and(...conditions))
    .orderBy(desc(tournamentRegistrations.registeredAt));
}

export async function getRegistrationsByTeam(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: tournamentRegistrations.id,
      tournamentId: tournamentRegistrations.tournamentId,
      teamId: tournamentRegistrations.teamId,
      status: tournamentRegistrations.status,
      creatorMessage: tournamentRegistrations.creatorMessage,
      teamMessage: tournamentRegistrations.teamMessage,
      registeredAt: tournamentRegistrations.registeredAt,
      updatedAt: tournamentRegistrations.updatedAt,
      tournamentName: tournaments.name,
      tournamentGame: tournaments.game,
      tournamentStatus: tournaments.status,
    })
    .from(tournamentRegistrations)
    .leftJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
    .where(eq(tournamentRegistrations.teamId, teamId))
    .orderBy(desc(tournamentRegistrations.registeredAt));
}

export async function getRegistrationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(tournamentRegistrations)
    .where(eq(tournamentRegistrations.id, id))
    .limit(1);
  return result[0];
}

export async function updateRegistrationStatus(
  id: number,
  status: "Pendiente" | "Aprobado" | "Rechazado" | "Cancelado",
  changedById: number,
  creatorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const existing = await getRegistrationById(id);
  if (!existing) throw new Error("Registration not found");

  await db
    .update(tournamentRegistrations)
    .set({ status, creatorMessage: creatorMessage ?? null })
    .where(eq(tournamentRegistrations.id, id));

  // Audit log
  await db.insert(registrationAuditLog).values({
    registrationId: id,
    previousStatus: existing.status,
    newStatus: status,
    changedById,
    note: creatorMessage,
  });
}

export async function getRegistrationAuditLog(registrationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: registrationAuditLog.id,
      previousStatus: registrationAuditLog.previousStatus,
      newStatus: registrationAuditLog.newStatus,
      note: registrationAuditLog.note,
      changedAt: registrationAuditLog.changedAt,
      changedByName: users.name,
    })
    .from(registrationAuditLog)
    .leftJoin(users, eq(registrationAuditLog.changedById, users.id))
    .where(eq(registrationAuditLog.registrationId, registrationId))
    .orderBy(desc(registrationAuditLog.changedAt));
}

export async function countPendingRegistrations(creatorId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(tournamentRegistrations)
    .innerJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
    .where(
      and(
        eq(tournaments.creatorId, creatorId),
        eq(tournamentRegistrations.status, "Pendiente")
      )
    );
  return result[0]?.count ?? 0;
}

// ─── Matches ──────────────────────────────────────────────────────────────────
export async function getMatchesByTournament(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  const team1 = alias(teams, "team1");
  const team2 = alias(teams, "team2");
  return db
    .select({
      id: tournamentMatches.id,
      round: tournamentMatches.round,
      matchNumber: tournamentMatches.matchNumber,
      team1Id: tournamentMatches.team1Id,
      team2Id: tournamentMatches.team2Id,
      winnerId: tournamentMatches.winnerId,
      team1Score: tournamentMatches.team1Score,
      team2Score: tournamentMatches.team2Score,
       status: tournamentMatches.status,
      scheduledAt: tournamentMatches.scheduledAt,
      betsCloseAt: tournamentMatches.betsCloseAt,
      completedAt: tournamentMatches.completedAt,
      notes: tournamentMatches.notes,
      bracketPosition: tournamentMatches.bracketPosition,
      team1Name: team1.name,
      team2Name: team2.name,
      team1Logo: team1.logo,
      team2Logo: team2.logo,
    })
    .from(tournamentMatches)
    .leftJoin(team1, eq(tournamentMatches.team1Id, team1.id))
    .leftJoin(team2, eq(tournamentMatches.team2Id, team2.id))
    .where(eq(tournamentMatches.tournamentId, tournamentId))
    .orderBy(tournamentMatches.round, tournamentMatches.matchNumber);
}

export async function scheduleMatch(
  matchId: number,
  scheduledAt: Date,
  betsCloseAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(tournamentMatches)
    .set({ scheduledAt, betsCloseAt })
    .where(eq(tournamentMatches.id, matchId));
}

/**
 * Devuelve partidos pendientes de torneos en curso que tienen betsCloseAt en el futuro.
 * Incluye nombres y logos de equipos para mostrar en la sección de apuestas.
 */
export async function getOpenBetMatches() {
  const db = await getDb();
  if (!db) return [];
  const team1 = alias(teams, "team1");
  const team2 = alias(teams, "team2");
  const rows = await db
    .select({
      matchId: tournamentMatches.id,
      tournamentId: tournamentMatches.tournamentId,
      round: tournamentMatches.round,
      matchNumber: tournamentMatches.matchNumber,
      team1Id: tournamentMatches.team1Id,
      team2Id: tournamentMatches.team2Id,
      status: tournamentMatches.status,
      scheduledAt: tournamentMatches.scheduledAt,
      betsCloseAt: tournamentMatches.betsCloseAt,
      team1Name: team1.name,
      team2Name: team2.name,
      team1Logo: team1.logo,
      team2Logo: team2.logo,
      tournamentName: tournaments.name,
      game: tournaments.game,
    })
    .from(tournamentMatches)
    .leftJoin(team1, eq(tournamentMatches.team1Id, team1.id))
    .leftJoin(team2, eq(tournamentMatches.team2Id, team2.id))
    .innerJoin(tournaments, eq(tournamentMatches.tournamentId, tournaments.id))
    .where(
      and(
        eq(tournamentMatches.status, "pending"),
        eq(tournaments.status, "in_progress"),
        isNotNull(tournamentMatches.betsCloseAt),
        isNotNull(tournamentMatches.team1Id),
        isNotNull(tournamentMatches.team2Id),
      )
    )
    .orderBy(tournamentMatches.betsCloseAt);

  if (rows.length === 0) return [];

  // FIX MEDIO #10: Replace N+1 queries with a single aggregated query.
  // Previously: 1 query per match to fetch bets (N+1 problem).
  // Now: 1 query to get all bet totals grouped by (matchId, teamId).
  const matchIds = rows.map(r => r.matchId);
  const betTotals = await db
    .select({
      matchId: bets.matchId,
      teamId: bets.teamId,
      total: sql<number>`COALESCE(SUM(${bets.amount}), 0)`,
    })
    .from(bets)
    .where(and(
      inArray(bets.matchId, matchIds),
      eq(bets.status, "pending")
    ))
    .groupBy(bets.matchId, bets.teamId);

  // Build a lookup map: matchId -> { teamId -> total }
  const betMap = new Map<number, Map<number, number>>();
  for (const row of betTotals) {
    if (!row.matchId || !row.teamId) continue;
    if (!betMap.has(row.matchId)) betMap.set(row.matchId, new Map());
    betMap.get(row.matchId)!.set(row.teamId, row.total);
  }

  const enriched = rows.map((row) => {
    const matchBetMap = betMap.get(row.matchId) ?? new Map();
    const team1TotalBets = row.team1Id ? (matchBetMap.get(row.team1Id) ?? 0) : 0;
    const team2TotalBets = row.team2Id ? (matchBetMap.get(row.team2Id) ?? 0) : 0;
    return {
      ...row,
      team1Name: row.team1Name ?? "",
      team2Name: row.team2Name ?? "",
      scheduledAt: row.scheduledAt!,
      betsCloseAt: row.betsCloseAt!,
      team1TotalBets,
      team2TotalBets,
    };
  });
  return enriched;
}

export async function getBetsByMatch(matchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bets).where(eq(bets.matchId, matchId));
}

export async function resolveMatchBets(matchId: number, winnerTeamId: number) {
  const db = await getDb();
  if (!db) return;
  const pendingBets = await db.select().from(bets)
    .where(and(eq(bets.matchId, matchId), eq(bets.status, "pending")));
  for (const bet of pendingBets) {
    if (bet.teamId === winnerTeamId) {
      await db.update(bets).set({ status: "won", resolvedAt: new Date() }).where(eq(bets.id, bet.id));
      await addRlcTransaction({
        userId: bet.userId,
        type: "bet_won",
        amount: bet.potentialWin,
        description: `Apuesta ganada en partido #${matchId}`,
        referenceId: bet.id,
      });
    } else {
      await db.update(bets).set({ status: "lost", resolvedAt: new Date() }).where(eq(bets.id, bet.id));
    }
  }
}

export async function updateMatchResult(
  matchId: number,
  data: {
    winnerId: number;
    team1Score?: number;
    team2Score?: number;
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(tournamentMatches)
    .set({ ...data, status: "completed", completedAt: new Date() })
    .where(eq(tournamentMatches.id, matchId));
}

/**
 * Genera el bracket con sorteo aleatorio (Fisher-Yates).
 * Soporta bye: equipo impar avanza automáticamente (status=completed, winnerId=team1Id).
 * Crea placeholders para rondas siguientes.
 */
export async function generateBracket(tournamentId: number, approvedTeamIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(tournamentMatches).where(eq(tournamentMatches.tournamentId, tournamentId));
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  // Fisher-Yates shuffle
  const shuffled = [...approvedTeamIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const matchesToInsert: typeof tournamentMatches.$inferInsert[] = [];
  if (tournament.bracketType === "single_elimination" || tournament.bracketType === "double_elimination") {
    const totalRounds = Math.ceil(Math.log2(shuffled.length));
    let matchNum = 1;
    // Round 1: pair teams, handle bye
    for (let i = 0; i < shuffled.length; i += 2) {
      const team1Id = shuffled[i];
      const team2Id = shuffled[i + 1] ?? null;
      const isBye = team2Id === null;
      matchesToInsert.push({
        tournamentId,
        round: 1,
        matchNumber: matchNum++,
        team1Id,
        team2Id,
        winnerId: isBye ? team1Id : null,
        status: isBye ? "completed" : "pending",
        completedAt: isBye ? new Date() : null,
        notes: isBye ? "BYE" : null,
        bracketPosition: { round: 1, position: Math.ceil(matchNum / 2) },
      });
    }
    // Placeholder matches for subsequent rounds
    for (let r = 2; r <= totalRounds; r++) {
      const prevCount = matchesToInsert.filter((m) => m.round === r - 1).length;
      const thisCount = Math.ceil(prevCount / 2);
      for (let p = 0; p < thisCount; p++) {
        matchesToInsert.push({
          tournamentId,
          round: r,
          matchNumber: matchNum++,
          team1Id: null,
          team2Id: null,
          status: "pending",
          bracketPosition: { round: r, position: p + 1 },
        });
      }
    }
  } else if (tournament.bracketType === "groups") {
    let matchNum = 1;
    for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        matchesToInsert.push({
          tournamentId,
          round: 1,
          matchNumber: matchNum++,
          team1Id: shuffled[i],
          team2Id: shuffled[j],
          status: "pending",
          bracketPosition: { round: 1, position: matchNum },
        });
      }
    }
  }
  if (matchesToInsert.length > 0) {
    await db.insert(tournamentMatches).values(matchesToInsert);
  }
  // Auto-advance byes in round 1
  await advanceRoundIfComplete(tournamentId, 1);
  return matchesToInsert.length;
}

/**
 * Verifica si todos los partidos de una ronda están completados.
 * Si es así, rellena los equipos ganadores en la siguiente ronda.
 * Llamar después de cada updateMatchResult.
 */
export async function advanceRoundIfComplete(tournamentId: number, round: number, _depth = 0) {
  // FIX ALTO #9: Prevent infinite recursion if bracket data is corrupted.
  // Max depth = 10 rounds is more than enough for any realistic bracket size.
  if (_depth > 10) {
    console.error(`[advanceRoundIfComplete] Max recursion depth reached for tournament #${tournamentId}, round ${round}. Possible bracket data corruption.`);
    return;
  }
  const db = await getDb();
  if (!db) return;
  const roundMatches = await db
    .select()
    .from(tournamentMatches)
    .where(and(eq(tournamentMatches.tournamentId, tournamentId), eq(tournamentMatches.round, round)))
    .orderBy(tournamentMatches.matchNumber);
  if (roundMatches.length === 0) return;
  const allDone = roundMatches.every((m) => m.status === "completed" && m.winnerId !== null);
  if (!allDone) return;
  const nextRoundMatches = await db
    .select()
    .from(tournamentMatches)
    .where(and(eq(tournamentMatches.tournamentId, tournamentId), eq(tournamentMatches.round, round + 1)))
    .orderBy(tournamentMatches.matchNumber);
  if (nextRoundMatches.length === 0) return;
  const winners = roundMatches.map((m) => m.winnerId!).filter(Boolean);
  for (let i = 0; i < nextRoundMatches.length; i++) {
    const nextMatch = nextRoundMatches[i];
    const team1Id = winners[i * 2] ?? null;
    const team2Id = winners[i * 2 + 1] ?? null;
    const isBye = team1Id !== null && team2Id === null;
    await db.update(tournamentMatches).set({
      team1Id,
      team2Id,
      winnerId: isBye ? team1Id : null,
      status: isBye ? "completed" : "pending",
      completedAt: isBye ? new Date() : null,
      notes: isBye ? "BYE" : null,
    }).where(eq(tournamentMatches.id, nextMatch.id));
  }
  // Recursively advance if next round is also complete
  await advanceRoundIfComplete(tournamentId, round + 1, _depth + 1);
}

/**
 * Actualiza estadísticas de equipo por resultado de partido individual.
 * +30 pts al ganador, +5 pts al perdedor.
 */
export async function updateTeamMatchStats(winnerId: number, loserId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(teams).set({
    wins: sql`wins + 1`,
    points: sql`points + 30`,
  }).where(eq(teams.id, winnerId));
  await db.update(teams).set({
    losses: sql`losses + 1`,
    points: sql`points + 5`,
  }).where(eq(teams.id, loserId));
}

/**
 * Obtiene equipos inscritos (aprobados) de un torneo con datos completos:
 * logo, nombre, capitán, ranking global (por puntos), record en el torneo.
 */
export async function getTournamentRegisteredTeams(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  const captain = alias(users, "captain");
  const regs = await db
    .select({
      teamId: tournamentRegistrations.teamId,
      teamName: teams.name,
      teamLogo: teams.logo,
      teamTag: teams.tag,
      teamPoints: teams.points,
      teamWins: teams.wins,
      teamLosses: teams.losses,
      teamIsVerified: teams.isVerified,
      captainId: teams.captainId,
      captainName: captain.name,
      captainNickname: captain.nickname,
      registeredAt: tournamentRegistrations.registeredAt,
    })
    .from(tournamentRegistrations)
    .leftJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
    .leftJoin(captain, eq(teams.captainId, captain.id))
    .where(and(
      eq(tournamentRegistrations.tournamentId, tournamentId),
      eq(tournamentRegistrations.status, "Aprobado")
    ))
    .orderBy(desc(teams.points));
  if (regs.length === 0) return [];
  const allMatches = await db
    .select({
      team1Id: tournamentMatches.team1Id,
      team2Id: tournamentMatches.team2Id,
      winnerId: tournamentMatches.winnerId,
    })
    .from(tournamentMatches)
    .where(and(
      eq(tournamentMatches.tournamentId, tournamentId),
      eq(tournamentMatches.status, "completed")
    ));
  return regs.map((reg, idx) => {
    const tid = reg.teamId!;
    const played = allMatches.filter((m) => (m.team1Id === tid || m.team2Id === tid) && m.winnerId !== null);
    const wins = played.filter((m) => m.winnerId === tid).length;
    const losses = played.filter((m) => m.winnerId !== null && m.winnerId !== tid).length;
    return {
      teamId: tid,
      teamName: reg.teamName ?? "Equipo",
      teamLogo: reg.teamLogo ?? null,
      teamTag: reg.teamTag ?? null,
      teamPoints: reg.teamPoints ?? 0,
      teamWins: reg.teamWins ?? 0,
      teamLosses: reg.teamLosses ?? 0,
      teamIsVerified: reg.teamIsVerified ?? false,
      captainName: reg.captainNickname ?? reg.captainName ?? null,
      rankPosition: idx + 1,
      tournamentWins: wins,
      tournamentLosses: losses,
    };
  });
}

// ─── Games ────────────────────────────────────────────────────────────────────
export async function getGames() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(games).where(eq(games.isActive, true)).orderBy(games.sortOrder, games.name);
}

export async function getGameBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(games).where(eq(games.slug, slug)).limit(1);
  return result[0];
}

/**
 * Resuelve el slug canónico de un juego a partir de su nombre (campo legacy).
 * Busca coincidencia exacta, luego case-insensitive.
 * Retorna undefined si el juego no existe en la tabla games.
 * Usado en dual-write al crear/editar torneos y equipos.
 */
export async function resolveGameSlug(gameName: string | undefined | null): Promise<string | undefined> {
  if (!gameName) return undefined;
  const db = await getDb();
  if (!db) return undefined;
  // Coincidencia exacta por nombre
  const exact = await db.select({ slug: games.slug }).from(games).where(eq(games.name, gameName)).limit(1);
  if (exact[0]) return exact[0].slug;
  // Coincidencia case-insensitive como fallback
  const allGames = await db.select({ name: games.name, slug: games.slug }).from(games);
  const lower = gameName.toLowerCase();
  const match = allGames.find((g) => g.name.toLowerCase() === lower);
  return match?.slug;
}

/**
 * Cuenta torneos y equipos que referencian un slug de juego.
 * Usado para proteger el slug de cambios cuando ya hay registros asociados.
 */
export async function countAssociatedByGameSlug(slug: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [tCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tournaments)
    .where(eq(tournaments.gameSlug, slug));
  const [eCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(teams)
    .where(eq(teams.gameSlug, slug));
  return (tCount?.count ?? 0) + (eCount?.count ?? 0);
}

/**
 * Actualiza el sortOrder de múltiples juegos en una sola transacción.
 * Recibe un array de { slug, sortOrder } y aplica cada actualización.
 */
export async function updateGamesSortOrder(items: { slug: string; sortOrder: number }[]) {
  const db = await getDb();
  if (!db || items.length === 0) return;
  await Promise.all(
    items.map((item) =>
      db.update(games).set({ sortOrder: item.sortOrder }).where(eq(games.slug, item.slug))
    )
  );
}
export async function upsertGame(data: InsertGame) {
  const db = await getDb();
  if (!db) return;
  await db.insert(games).values(data).onDuplicateKeyUpdate({ set: { ...data } });
}

export async function deleteGame(slug: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(games).where(eq(games.slug, slug));
}


// ─── Audit ───────────────────────────────────────────────────────────────────
export async function auditGameSlugConsistency() {
  const db = await getDb();
  if (!db) return { tournaments: [], teams: [], summary: { totalTournaments: 0, inconsistentTournaments: 0, totalTeams: 0, inconsistentTeams: 0 } };

  const allGames = await db.select({ name: games.name, slug: games.slug }).from(games);
  const nameToSlug = new Map(allGames.map((g) => [g.name.toLowerCase(), g.slug]));

  const allTournaments = await db
    .select({ id: tournaments.id, name: tournaments.name, game: tournaments.game, gameSlug: tournaments.gameSlug })
    .from(tournaments);

  const inconsistentTournaments = allTournaments
    .map((t) => {
      const expectedSlug = t.game ? nameToSlug.get(t.game.toLowerCase()) : undefined;
      const hasGameSlug = !!t.gameSlug;
      const isConsistent = !t.game || (!!expectedSlug && t.gameSlug === expectedSlug);
      const isOrphan = !!t.game && !expectedSlug;
      return { ...t, expectedSlug: expectedSlug ?? null, hasGameSlug, isConsistent, isOrphan };
    })
    .filter((t) => !t.isConsistent || t.isOrphan || !t.hasGameSlug);

  const allTeams = await db
    .select({ id: teams.id, name: teams.name, game: teams.game, gameSlug: teams.gameSlug })
    .from(teams);

  const inconsistentTeams = allTeams
    .map((t) => {
      const expectedSlug = t.game ? nameToSlug.get(t.game.toLowerCase()) : undefined;
      const hasGameSlug = !!t.gameSlug;
      const isConsistent = !t.game || (!!expectedSlug && t.gameSlug === expectedSlug);
      const isOrphan = !!t.game && !expectedSlug;
      return { ...t, expectedSlug: expectedSlug ?? null, hasGameSlug, isConsistent, isOrphan };
    })
    .filter((t) => !t.isConsistent || t.isOrphan || !t.hasGameSlug);

  return {
    tournaments: inconsistentTournaments,
    teams: inconsistentTeams,
    summary: {
      totalTournaments: allTournaments.length,
      inconsistentTournaments: inconsistentTournaments.length,
      totalTeams: allTeams.length,
      inconsistentTeams: inconsistentTeams.length,
    },
  };
}

// ─── News ─────────────────────────────────────────────────────────────────────
export async function getNews(opts?: { category?: string; limit?: number; publishedOnly?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.publishedOnly !== false) conditions.push(eq(news.isPublished, true));
  if (opts?.category) conditions.push(eq(news.category, opts.category as any));
  const q = db.select().from(news);
  const filtered = conditions.length > 0 ? q.where(and(...conditions)) : q;
  return filtered.orderBy(desc(news.publishedAt)).limit(opts?.limit ?? 50);
}

export async function getNewsById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return result[0];
}

export async function getNewsBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
  return result[0];
}

export async function createNews(data: InsertNews) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(news).values(data).$returningId();
  return result.id;
}

export async function updateNews(id: number, data: Partial<InsertNews>) {
  const db = await getDb();
  if (!db) return;
  await db.update(news).set(data).where(eq(news.id, id));
}

export async function incrementNewsViews(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(news).set({ viewCount: sql`viewCount + 1` }).where(eq(news.id, id));
}

// ─── Promotions ───────────────────────────────────────────────────────────────
export async function getActivePromotions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promotions).where(eq(promotions.isActive, true)).orderBy(desc(promotions.createdAt));
}

export async function createPromotion(data: { title: string; description?: string; bannerImage?: string; linkUrl?: string; linkLabel?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(promotions).values({ ...data, isActive: true }).$returningId();
  return result.id;
}

// ─── Streams ──────────────────────────────────────────────────────────────────
export async function getStreams(opts?: { liveOnly?: boolean; tournamentId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.liveOnly) conditions.push(eq(streams.isLive, true));
  if (opts?.tournamentId) conditions.push(eq(streams.tournamentId, opts.tournamentId));
  const q = db.select().from(streams);
  const filtered = conditions.length > 0 ? q.where(and(...conditions)) : q;
  return filtered.orderBy(desc(streams.updatedAt));
}

/**
 * Returns live streams grouped by game, max 5 per game.
 * Uses a raw SQL window function (ROW_NUMBER OVER PARTITION BY game)
 * so only one round-trip is needed regardless of how many games exist.
 * Includes both tournament and creator streams.
 */
export async function getStreamsByGame(): Promise<
  Array<{
    game: string;
    streams: Array<typeof streams.$inferSelect>;
  }>
> {
  const db = await getDb();
  if (!db) return [];
  // Raw SQL: rank each live stream within its game partition by viewerCount DESC.
  // MySQL does not allow filtering on window function aliases in WHERE/HAVING of the same
  // SELECT level, so we wrap in a subquery.
  // NOTE: drizzle-orm's db.execute() for MySQL2 returns [rows, fields] like mysql2 directly,
  // so we destructure the first element to get the actual row array.
  const [rawRows] = await db.execute(
    `SELECT * FROM (
       SELECT s.*,
              ROW_NUMBER() OVER (
                PARTITION BY COALESCE(s.game, 'Sin categoría')
                ORDER BY s.viewerCount DESC, s.updatedAt DESC
              ) AS rn
       FROM streams s
       WHERE s.isLive = 1
     ) ranked
     WHERE ranked.rn <= 5
     ORDER BY ranked.game ASC, ranked.rn ASC`
  ) as unknown as [Array<typeof streams.$inferSelect & { rn: number }>, unknown];
  // Group into { game -> streams[] } map
  const map = new Map<string, Array<typeof streams.$inferSelect>>();
  for (const row of rawRows) {
    const gameKey = (row as any).game ?? 'Sin categoría';
    if (!map.has(gameKey)) map.set(gameKey, []);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rn: _rn, ...rest } = row as any;
    map.get(gameKey)!.push(rest);
  }
  return Array.from(map.entries()).map(([game, streams]) => ({ game, streams }));
}

/**
 * Returns the active (isLive=true) stream owned by a given user, or null.
 */
export async function getActiveStreamByUser(userId: number): Promise<typeof streams.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(streams)
    .where(and(eq(streams.userId, userId), eq(streams.isLive, true)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Creates a creator stream. Enforces: only 1 active stream per user.
 * Returns the new stream id.
 */
export async function createCreatorStream(
  userId: number,
  data: {
    title: string;
    platform: "twitch" | "youtube" | "discord" | "other";
    url: string;
    game: string;
    gameSlug?: string;
    thumbnailUrl?: string;
    streamerName?: string;
  }
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Enforce 1 active stream per user
  const existing = await getActiveStreamByUser(userId);
  if (existing) throw new Error("Ya tienes una transmisión activa. Deténla antes de iniciar una nueva.");
  const [result] = await db
    .insert(streams)
    .values({
      userId,
      type: "creator",
      title: data.title,
      platform: data.platform,
      url: data.url,
      game: data.game,
      gameSlug: data.gameSlug,
      thumbnailUrl: data.thumbnailUrl,
      streamerName: data.streamerName,
      isLive: true,
    })
    .$returningId();
  return result.id;
}

/**
 * Stops a creator stream. Only the owner or admin can stop it.
 * Sets isLive = false.
 */
export async function stopCreatorStream(streamId: number, userId: number, isAdmin = false): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const rows = await db.select().from(streams).where(eq(streams.id, streamId)).limit(1);
  const stream = rows[0];
  if (!stream) throw new Error("Stream no encontrado");
  if (!isAdmin && stream.userId !== userId) throw new Error("No tienes permiso para detener esta transmisión");
  await db.update(streams).set({ isLive: false }).where(eq(streams.id, streamId));
}

/**
 * Returns the last N streams (live or offline) for a given user, ordered by updatedAt desc.
 * Used for the public stream history section in the user profile.
 */
export async function getStreamHistoryByUser(
  userId: number,
  limit = 10
): Promise<(typeof streams.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(streams)
    .where(eq(streams.userId, userId))
    .orderBy(desc(streams.updatedAt))
    .limit(limit);
}

export async function createStream(data: InsertStream) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(streams).values(data).$returningId();
  return result.id;
}

export async function updateStream(id: number, data: Partial<InsertStream>) {
  const db = await getDb();
  if (!db) return;
  await db.update(streams).set(data).where(eq(streams.id, id));
}

// ─── Ranking ──────────────────────────────────────────────────────────────────
export async function getTeamRanking(opts?: { gameSlug?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  // Filtro por juego: gameSlug es la única fuente de verdad (Fase 5a)
  if (opts?.gameSlug) {
    conditions.push(eq(teams.gameSlug, opts.gameSlug));
  }
  const q = db.select().from(teams);
  const filtered = conditions.length > 0 ? q.where(and(...conditions)) : q;
  return filtered.orderBy(desc(teams.points)).limit(opts?.limit ?? 50);
}

// ─── Team Achievements ────────────────────────────────────────────────────────
export async function getTeamAchievements(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamAchievements).where(eq(teamAchievements.teamId, teamId)).orderBy(desc(teamAchievements.awardedAt));
}

export async function addTeamAchievement(data: { teamId: number; title: string; description?: string; tournamentId?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(teamAchievements).values(data);
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export async function updateUserProfile(userId: number, data: {
  nickname?: string;
  bio?: string;
  mainGame?: string;
  gameRole?: string;
  elo?: string;
  competitiveRegion?: string;
  gameId?: string | null;
  competitiveScore?: number | null;
  country?: string;
  profileType?: "player" | "team_captain" | "event_creator";
  socialDiscord?: string;
  socialTwitch?: string;
  socialTwitter?: string;
  avatar?: string;
  bannerUrl?: string;
  rosterPhoto?: string | null;
  rosterImageUrl?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers(opts?: { limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(opts?.limit ?? 100);
}

// ─── RLC Coins / Bets ─────────────────────────────────────────────────────────
export async function getUserBalance(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ balance: users.rlcBalance }).from(users).where(eq(users.id, userId)).limit(1);
  return result[0]?.balance ?? 0;
}

export async function addRlcTransaction(data: {
  userId: number;
  type: "deposit" | "withdrawal" | "bet_placed" | "bet_won" | "bet_lost" | "reward" | "refund";
  amount: number;
  description?: string;
  referenceId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // SECURITY FIX: Wrap in a MySQL transaction with SELECT FOR UPDATE to prevent
  // race conditions when multiple concurrent requests modify the same user balance.
  // Without this, two simultaneous bets could both read the same balance and
  // allow spending more RLC than available (double-spend vulnerability).
  return await db.transaction(async (tx) => {
    // Lock the user row for the duration of this transaction
    const [userRow] = await tx
      .select({ balance: users.rlcBalance })
      .from(users)
      .where(eq(users.id, data.userId))
      .for("update");

    const current = userRow?.balance ?? 0;
    const newBalance = current + data.amount;
    if (newBalance < 0) throw new Error("Saldo insuficiente");

    // Update user balance atomically
    await tx.update(users).set({ rlcBalance: newBalance }).where(eq(users.id, data.userId));

    // Record transaction
    await tx.insert(rlcTransactions).values({
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      balanceAfter: newBalance,
      description: data.description,
      referenceId: data.referenceId,
    });

    return newBalance;
  });
}

export async function getRlcTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rlcTransactions).where(eq(rlcTransactions.userId, userId)).orderBy(desc(rlcTransactions.createdAt)).limit(50);
}

export async function createBet(data: InsertBet) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(bets).values(data).$returningId();
  return result.id;
}

export async function getBetsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const team1 = alias(teams, "betTeam1");
  const team2 = alias(teams, "betTeam2");
  return db
    .select({
      id: bets.id,
      userId: bets.userId,
      tournamentId: bets.tournamentId,
      matchId: bets.matchId,
      teamId: bets.teamId,
      amount: bets.amount,
      multiplier: bets.multiplier,
      potentialWin: bets.potentialWin,
      status: bets.status,
      createdAt: bets.createdAt,
      resolvedAt: bets.resolvedAt,
      // Tournament info
      tournamentName: tournaments.name,
      // Match info
      scheduledAt: tournamentMatches.scheduledAt,
      round: tournamentMatches.round,
      matchNumber: tournamentMatches.matchNumber,
      // Team names
      team1Name: team1.name,
      team2Name: team2.name,
      // Chosen team name
      chosenTeamName: teams.name,
    })
    .from(bets)
    .leftJoin(tournaments, eq(bets.tournamentId, tournaments.id))
    .leftJoin(tournamentMatches, eq(bets.matchId, tournamentMatches.id))
    .leftJoin(team1, eq(tournamentMatches.team1Id, team1.id))
    .leftJoin(team2, eq(tournamentMatches.team2Id, team2.id))
    .leftJoin(teams, eq(bets.teamId, teams.id))
    .where(eq(bets.userId, userId))
    .orderBy(desc(bets.createdAt));
}

export async function adminListBets() {
  const db = await getDb();
  if (!db) return [];
  const team1 = alias(teams, "adminBetTeam1");
  const team2 = alias(teams, "adminBetTeam2");
  return db
    .select({
      id: bets.id,
      userId: bets.userId,
      userName: users.name,
      userNickname: users.nickname,
      tournamentId: bets.tournamentId,
      matchId: bets.matchId,
      teamId: bets.teamId,
      amount: bets.amount,
      multiplier: bets.multiplier,
      potentialWin: bets.potentialWin,
      status: bets.status,
      createdAt: bets.createdAt,
      resolvedAt: bets.resolvedAt,
      tournamentName: tournaments.name,
      scheduledAt: tournamentMatches.scheduledAt,
      round: tournamentMatches.round,
      matchNumber: tournamentMatches.matchNumber,
      team1Name: team1.name,
      team2Name: team2.name,
      chosenTeamName: teams.name,
    })
    .from(bets)
    .leftJoin(users, eq(bets.userId, users.id))
    .leftJoin(tournaments, eq(bets.tournamentId, tournaments.id))
    .leftJoin(tournamentMatches, eq(bets.matchId, tournamentMatches.id))
    .leftJoin(team1, eq(tournamentMatches.team1Id, team1.id))
    .leftJoin(team2, eq(tournamentMatches.team2Id, team2.id))
    .leftJoin(teams, eq(bets.teamId, teams.id))
    .orderBy(desc(bets.createdAt));
}

export async function cancelBetById(betId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [bet] = await db.select().from(bets).where(eq(bets.id, betId)).limit(1);
  if (!bet) throw new Error("Apuesta no encontrada");
  if (bet.status !== "pending") throw new Error("Solo se pueden anular apuestas pendientes");
  await db.update(bets).set({ status: "cancelled", resolvedAt: new Date() }).where(eq(bets.id, betId));
  // Refund the user
  await addRlcTransaction({
    userId: bet.userId,
    type: "deposit",
    amount: bet.amount,
    description: `Reembolso por anulación de apuesta #${betId}`,
    referenceId: betId,
  });
}

export async function getBetStatsByUser(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, won: 0, lost: 0, pending: 0, cancelled: 0, winRate: 0, totalWagered: 0, totalWon: 0, netProfit: 0 };
  const userBets = await db.select().from(bets).where(eq(bets.userId, userId));
  const total = userBets.length;
  const won = userBets.filter(b => b.status === "won").length;
  const lost = userBets.filter(b => b.status === "lost").length;
  const pending = userBets.filter(b => b.status === "pending").length;
  const cancelled = userBets.filter(b => b.status === "cancelled").length;
  const resolved = won + lost;
  const winRate = resolved > 0 ? Math.round((won / resolved) * 100) : 0;
  const totalWagered = userBets.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.amount, 0);
  const totalWon = userBets.filter(b => b.status === "won").reduce((s, b) => s + (b.potentialWin ?? 0), 0);
  const netProfit = totalWon - totalWagered;
  return { total, won, lost, pending, cancelled, winRate, totalWagered, totalWon, netProfit };
}

export async function getBetsByTournament(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bets).where(eq(bets.tournamentId, tournamentId)).orderBy(desc(bets.createdAt));
}

export async function resolveBets(tournamentId: number, winnerTeamId: number) {
  const db = await getDb();
  if (!db) return;
  const pendingBets = await db.select().from(bets)
    .where(and(eq(bets.tournamentId, tournamentId), eq(bets.status, "pending")));

  for (const bet of pendingBets) {
    if (bet.teamId === winnerTeamId) {
      // Won
      await db.update(bets).set({ status: "won", resolvedAt: new Date() }).where(eq(bets.id, bet.id));
      await addRlcTransaction({
        userId: bet.userId,
        type: "bet_won",
        amount: bet.potentialWin,
        description: `Apuesta ganada en torneo #${tournamentId}`,
        referenceId: bet.id,
      });
    } else {
      // Lost
      await db.update(bets).set({ status: "lost", resolvedAt: new Date() }).where(eq(bets.id, bet.id));
    }
  }
}

// ─── Tournament admin approval ────────────────────────────────────────────────
export async function approveTournament(tournamentId: number, adminNote?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(tournaments).set({
    status: "registration_open",
    adminNote: adminNote ?? null,
  }).where(eq(tournaments.id, tournamentId));
}

export async function rejectTournament(tournamentId: number, adminNote: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(tournaments).set({
    status: "cancelled",
    adminNote,
  }).where(eq(tournaments.id, tournamentId));
}

export async function getPendingTournaments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tournaments).where(eq(tournaments.status, "pending_approval")).orderBy(desc(tournaments.createdAt));
}

// ─── Team stats update ────────────────────────────────────────────────────────
export async function updateTeamStats(teamId: number, won: boolean) {
  const db = await getDb();
  if (!db) return;
  if (won) {
    await db.update(teams).set({
      wins: sql`wins + 1`,
      tournamentsWon: sql`tournamentsWon + 1`,
      tournamentsPlayed: sql`tournamentsPlayed + 1`,
      points: sql`points + 100`,
    }).where(eq(teams.id, teamId));
  } else {
    await db.update(teams).set({
      losses: sql`losses + 1`,
      tournamentsPlayed: sql`tournamentsPlayed + 1`,
      points: sql`points + 10`,
    }).where(eq(teams.id, teamId));
  }
}

export async function updateTeam(teamId: number, data: Partial<{
  name: string;
  tag: string;
  logo: string;
  banner: string;
  description: string;
  game: string;
  gameSlug: string;
  country: string;
  socialDiscord: string;
  socialTwitch: string;
  socialTwitter: string;
}>) {
  const db = await getDb();
  if (!db) return;
  // Fase 3 dual-write: si se actualiza el campo game, recalcular gameSlug
  const payload: Record<string, unknown> = { ...data };
  if (data.game !== undefined) {
    const resolvedSlug = await resolveGameSlug(data.game);
    payload.gameSlug = resolvedSlug ?? null;
  }
  await db.update(teams).set(payload as any).where(eq(teams.id, teamId));
}

// ─── Shop Items ────────────────────────────────────────────────────────────────
export async function getShopItems(category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(shopItems.isActive, true)];
  if (category && category !== "all") {
    conditions.push(eq(shopItems.category, category as "physical" | "digital" | "bundle" | "limited"));
  }
  return db.select().from(shopItems).where(and(...conditions)).orderBy(shopItems.sortOrder, desc(shopItems.createdAt));
}

export async function getShopItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(shopItems).where(eq(shopItems.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createShopItem(data: InsertShopItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(shopItems).values(data);
  return result;
}

export async function buyShopItem(userId: number, itemId: number, quantity: number, userNote?: string, shippingAddress?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const item = await getShopItemById(itemId);
  if (!item) throw new Error("Producto no encontrado");
  if (!item.isActive) throw new Error("Producto no disponible");
  if (item.stock !== -1 && item.stock < quantity) throw new Error("Stock insuficiente");

  // Validate maxPerUser limit
  if (item.maxPerUser !== null && item.maxPerUser !== undefined) {
    const previousOrders = await db
      .select({ count: shopOrders.id })
      .from(shopOrders)
      .where(and(
        eq(shopOrders.userId, userId),
        eq(shopOrders.itemId, itemId),
        // Count non-cancelled orders
        sql`${shopOrders.status} != 'cancelled'`
      ));
    const totalBought = previousOrders.length;
    if (totalBought + quantity > item.maxPerUser) {
      throw new Error(`Límite de compra alcanzado: máximo ${item.maxPerUser} por usuario`);
    }
  }

  const totalPrice = item.price * quantity;

  // SECURITY FIX: Wrap in a transaction with SELECT FOR UPDATE to prevent
  // race conditions on balance deduction and stock decrement.
  return await db.transaction(async (tx) => {
    // Lock user row to prevent double-spend
    const [userRow] = await tx
      .select({ rlcBalance: users.rlcBalance })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");
    if (!userRow || userRow.rlcBalance < totalPrice) throw new Error("Saldo RLC insuficiente");

    // Lock item row to prevent overselling
    const [itemRow] = await tx
      .select({ stock: shopItems.stock })
      .from(shopItems)
      .where(eq(shopItems.id, itemId))
      .for("update");
    if (itemRow && itemRow.stock !== -1 && itemRow.stock < quantity) throw new Error("Stock insuficiente");

    const newBalance = userRow.rlcBalance - totalPrice;
    await tx.update(users).set({ rlcBalance: newBalance }).where(eq(users.id, userId));

    await tx.insert(rlcTransactions).values({
      userId,
      type: "withdrawal",
      amount: -totalPrice,
      balanceAfter: newBalance,
      description: `Compra: ${item.name} x${quantity}`,
      referenceId: itemId,
    });

    if (item.stock !== -1) {
      await tx.update(shopItems).set({ stock: sql`stock - ${quantity}` }).where(eq(shopItems.id, itemId));
    }

    const [order] = await tx.insert(shopOrders).values({
      userId,
      itemId,
      quantity,
      totalPrice,
      status: "pending",
      userNote: userNote ?? null,
      shippingAddress: shippingAddress ?? null,
    });

    return { orderId: (order as { insertId: number }).insertId, totalPrice, newBalance };
  });
}

export async function getShopOrders(userId?: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (userId) conditions.push(eq(shopOrders.userId, userId));
  if (status) conditions.push(eq(shopOrders.status, status as "pending" | "processing" | "delivered" | "cancelled"));

  const rows = await db
    .select({
      id: shopOrders.id,
      userId: shopOrders.userId,
      quantity: shopOrders.quantity,
      totalPrice: shopOrders.totalPrice,
      status: shopOrders.status,
      deliveryNote: shopOrders.deliveryNote,
      userNote: shopOrders.userNote,
      createdAt: shopOrders.createdAt,
      itemName: shopItems.name,
      itemImage: shopItems.image,
      itemCategory: shopItems.category,
      shippingAddress: shopOrders.shippingAddress,
      userName: users.name,
      userNickname: users.nickname,
      userEmail: users.email,
    })
    .from(shopOrders)
    .leftJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
    .leftJoin(users, eq(shopOrders.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(shopOrders.createdAt));

  return rows;
}

export async function updateOrderStatus(orderId: number, status: string, deliveryNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(shopOrders).set({
    status: status as "pending" | "processing" | "delivered" | "cancelled",
    deliveryNote: deliveryNote ?? null,
  }).where(eq(shopOrders.id, orderId));
}

// ─── Cosmetics ─────────────────────────────────────────────────────────────────
export async function getCosmetics(type?: string, collection?: string) {
  const db = await getDb();
  if (!db) return [];
  const { catalogItems } = await import('../drizzle/schema');
  const { or, isNull, lte, gte } = await import('drizzle-orm');
  const now = new Date();
  // LEFT JOIN: si no tiene catalog_item, se muestra (compatibilidad hacia atrás)
  // Si tiene catalog_item, se aplican los filtros de visibilidad
  const rows = await db
    .select({ cosmetic: cosmetics, catId: catalogItems.id })
    .from(cosmetics)
    .leftJoin(catalogItems, and(
      eq(catalogItems.type, 'cosmetic'),
      eq(catalogItems.referenceId, cosmetics.id),
    ))
    .where(and(
      eq(cosmetics.isActive, true),
      ...(type && type !== 'all' ? [eq(cosmetics.type, type as any)] : []),
      ...(collection ? [eq(cosmetics.collection, collection)] : []),
      // Si tiene catalog_item, respetar isVisible y fechas; si no tiene, mostrar siempre
      or(
        isNull(catalogItems.id),
        and(
          eq(catalogItems.isVisible, true),
          or(isNull(catalogItems.publishDate), lte(catalogItems.publishDate, now)),
          or(isNull(catalogItems.visibleFrom), lte(catalogItems.visibleFrom, now)),
          or(isNull(catalogItems.visibleUntil), gte(catalogItems.visibleUntil, now)),
        ),
      ),
    ))
    .orderBy(cosmetics.sortOrder, desc(cosmetics.createdAt));
  return rows.map(r => r.cosmetic);
}

export async function getCosmeticById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(cosmetics).where(eq(cosmetics.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getUserCosmetics(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: userCosmetics.id,
      cosmeticId: userCosmetics.cosmeticId,
      isEquipped: userCosmetics.isEquipped,
      purchasedAt: userCosmetics.purchasedAt,
      name: cosmetics.name,
      type: cosmetics.type,
      rarity: cosmetics.rarity,
      previewImage: cosmetics.previewImage,
      frameImage: cosmetics.frameImage,
      colors: cosmetics.colors,
      collection: cosmetics.collection,
    })
    .from(userCosmetics)
    .leftJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
    .where(eq(userCosmetics.userId, userId))
    .orderBy(desc(userCosmetics.purchasedAt));
}

export async function buyCosmetic(userId: number, cosmeticId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const cosmetic = await getCosmeticById(cosmeticId);
  if (!cosmetic) throw new Error("Cosmético no encontrado");
  if (!cosmetic.isActive) throw new Error("Cosmético no disponible");

  // Check if already owned
  const existing = await db.select().from(userCosmetics)
    .where(and(eq(userCosmetics.userId, userId), eq(userCosmetics.cosmeticId, cosmeticId))).limit(1);
  if (existing.length > 0) throw new Error("Ya tienes este cosmético");

  // SECURITY FIX: Wrap in a transaction with SELECT FOR UPDATE to prevent
  // race conditions on balance deduction and duplicate cosmetic purchase.
  return await db.transaction(async (tx) => {
    // Lock user row to prevent double-spend
    const [userRow] = await tx
      .select({ rlcBalance: users.rlcBalance })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");
    if (!userRow || userRow.rlcBalance < cosmetic.price) throw new Error("Saldo RLC insuficiente");

    // Double-check ownership inside transaction to prevent race on duplicate purchase
    const [alreadyOwned] = await tx.select({ id: userCosmetics.id })
      .from(userCosmetics)
      .where(and(eq(userCosmetics.userId, userId), eq(userCosmetics.cosmeticId, cosmeticId)))
      .limit(1);
    if (alreadyOwned) throw new Error("Ya tienes este cosmético");

    const newBalance = userRow.rlcBalance - cosmetic.price;
    await tx.update(users).set({ rlcBalance: newBalance }).where(eq(users.id, userId));

    await tx.insert(rlcTransactions).values({
      userId,
      type: "withdrawal",
      amount: -cosmetic.price,
      balanceAfter: newBalance,
      description: `Cosmético: ${cosmetic.name}`,
      referenceId: cosmeticId,
    });

    await tx.insert(userCosmetics).values({ userId, cosmeticId, isEquipped: false });

    return { newBalance };
  });
}

export async function equipCosmetic(userId: number, cosmeticId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Get cosmetic type
  const cosmeticRows = await db.select({ type: cosmetics.type }).from(cosmetics).where(eq(cosmetics.id, cosmeticId)).limit(1);
  const cosmeticType = cosmeticRows[0]?.type;

  if (cosmeticType) {
    // Unequip all of same type
    const ownedOfType = await db
      .select({ id: userCosmetics.id })
      .from(userCosmetics)
      .leftJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
      .where(and(eq(userCosmetics.userId, userId), eq(cosmetics.type, cosmeticType)));

    for (const uc of ownedOfType) {
      await db.update(userCosmetics).set({ isEquipped: false }).where(eq(userCosmetics.id, uc.id));
    }
  }

  // Equip selected
  await db.update(userCosmetics).set({ isEquipped: true })
    .where(and(eq(userCosmetics.userId, userId), eq(userCosmetics.cosmeticId, cosmeticId)));
}

export async function getEquippedCosmetic(userId: number, type: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      cosmeticId: userCosmetics.cosmeticId,
      name: cosmetics.name,
      type: cosmetics.type,
      frameImage: cosmetics.frameImage,
      previewImage: cosmetics.previewImage,
      colors: cosmetics.colors,
    })
    .from(userCosmetics)
    .leftJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
    .where(and(
      eq(userCosmetics.userId, userId),
      eq(userCosmetics.isEquipped, true),
      eq(cosmetics.type, type as "frame" | "aura" | "badge" | "background")
    ))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Reward Tasks ──────────────────────────────────────────────────────────────
export async function getRewardTasks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rewardTasks).where(eq(rewardTasks.isActive, true)).orderBy(rewardTasks.sortOrder);
}

export async function getUserClaimsToday(userId: number, taskId: number) {
  const db = await getDb();
  if (!db) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = await db.select().from(userRewardClaims)
    .where(and(
      eq(userRewardClaims.userId, userId),
      eq(userRewardClaims.taskId, taskId),
      sql`${userRewardClaims.claimedAt} >= ${today}`
    ));
  return rows.length;
}

export async function getTotalUserClaims(userId: number, taskId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select().from(userRewardClaims)
    .where(and(eq(userRewardClaims.userId, userId), eq(userRewardClaims.taskId, taskId)));
  return rows.length;
}

export async function claimReward(userId: number, taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const taskRows = await db.select().from(rewardTasks).where(eq(rewardTasks.id, taskId)).limit(1);
  const task = taskRows[0];
  if (!task || !task.isActive) throw new Error("Tarea no disponible");

  // FIX MEDIO #12: Use a transaction with SELECT FOR UPDATE to prevent
  // double-claim race conditions when called in parallel.
  return await db.transaction(async (tx) => {
    // Re-check limits inside transaction with row locking
    const maxPerDay = task.maxClaimsPerDay ?? 1;
    if (maxPerDay > 0) {
      const todayClaims = await getUserClaimsToday(userId, taskId);
      if (todayClaims >= maxPerDay) throw new Error("Ya alcanzaste el límite diario de esta tarea");
    }
    const maxPerUser = task.maxClaimsPerUser ?? 1;
    if (maxPerUser > 0) {
      const totalClaims = await getTotalUserClaims(userId, taskId);
      if (totalClaims >= maxPerUser) throw new Error("Ya completaste esta tarea el máximo de veces");
    }

    // Lock user row to prevent concurrent balance modifications
    const [userRow] = await tx
      .select({ rlcBalance: users.rlcBalance })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");
    if (!userRow) throw new Error("Usuario no encontrado");

    const newBalance = userRow.rlcBalance + task.reward;
    await tx.update(users).set({ rlcBalance: newBalance }).where(eq(users.id, userId));

    await tx.insert(rlcTransactions).values({
      userId,
      type: "reward",
      amount: task.reward,
      balanceAfter: newBalance,
      description: `Recompensa: ${task.title}`,
      referenceId: taskId,
    });

    // Insert claim record atomically to prevent duplicate claims
    await tx.insert(userRewardClaims).values({ userId, taskId });

    return { reward: task.reward, newBalance };
  });
}

// ─── Brand Ads ─────────────────────────────────────────────────────────────────
export async function getBrandAds(onlyActive = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = onlyActive ? [eq(brandAds.isActive, true)] : [];
  return db.select().from(brandAds)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(brandAds.sortOrder, desc(brandAds.isFeatured), desc(brandAds.isPremium), desc(brandAds.createdAt));
}

export async function trackAdClick(adId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(brandAds).set({ clickCount: sql`${brandAds.clickCount} + 1` }).where(eq(brandAds.id, adId));
}

export async function trackAdImpression(adId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(brandAds).set({ impressionCount: sql`${brandAds.impressionCount} + 1` }).where(eq(brandAds.id, adId));
}

export async function createBrandAd(data: InsertBrandAd) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(brandAds).values(data);
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}


export async function getUserPublicProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      bannerUrl: users.bannerUrl,
      rosterPhoto: users.rosterPhoto,
      rosterImageUrl: users.rosterImageUrl,
      bio: users.bio,
      role: users.role,
      profileType: users.profileType,
      mainGame: users.mainGame,
      gameRole: users.gameRole,
      elo: users.elo,
      competitiveRegion: users.competitiveRegion,
      gameId: users.gameId,
      competitiveScore: users.competitiveScore,
      country: users.country,
      socialDiscord: users.socialDiscord,
      socialTwitch: users.socialTwitch,
      socialTwitter: users.socialTwitter,
      rlcBalance: users.rlcBalance,
      createdAt: users.createdAt,
      isVerified: users.isVerified,
      canUploadBanner: users.canUploadBanner,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0] ?? null;
}
export async function getUserEquippedCosmetics(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: userCosmetics.id,
      cosmeticId: userCosmetics.cosmeticId,
      isEquipped: userCosmetics.isEquipped,
      name: cosmetics.name,
      type: cosmetics.type,
      rarity: cosmetics.rarity,
      previewImage: cosmetics.previewImage,
      frameImage: cosmetics.frameImage,
    })
    .from(userCosmetics)
    .innerJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
    .where(and(eq(userCosmetics.userId, userId), eq(userCosmetics.isEquipped, true)));
}

// ─── Admin: Users Management ──────────────────────────────────────────────────
export async function adminListUsers(search?: string) {
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      email: users.email,
      role: users.role,
      profileType: users.profileType,
      avatar: users.avatar,
      rlcBalance: users.rlcBalance,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      isVerified: users.isVerified,
      canUploadBanner: users.canUploadBanner,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
  if (search) {
    return (await query).filter(
      (u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.nickname?.toLowerCase().includes(search.toLowerCase())
    );
  }
  return query;
}

export async function adminUpdateUserRole(userId: number, role: "user" | "premium" | "organizer" | "admin" | "super_admin") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function adminUpdateBannerPermission(userId: number, canUploadBanner: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ canUploadBanner }).where(eq(users.id, userId));
}

export async function adminUpdateVerified(userId: number, isVerified: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ isVerified }).where(eq(users.id, userId));
}

export async function adminAdjustRLC(userId: number, amount: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Update balance
  await db.update(users).set({ rlcBalance: sql`${users.rlcBalance} + ${amount}` }).where(eq(users.id, userId));
  // Get updated balance for record
  const updatedUser = await db.select({ rlcBalance: users.rlcBalance }).from(users).where(eq(users.id, userId)).limit(1);
  const newBalance = updatedUser[0]?.rlcBalance ?? 0;
  // Record transaction
  await db.insert(rlcTransactions).values({
    userId,
    amount,
    type: amount > 0 ? "reward" : "withdrawal",
    description: reason,
    balanceAfter: newBalance,
  });
}

// ─── Admin: Shop Items ────────────────────────────────────────────────────────
export async function adminCreateShopItem(data: InsertShopItem): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(shopItems).values(data).$returningId();
  return result.id;
}

export async function adminUpdateShopItem(id: number, data: Partial<InsertShopItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(shopItems).set(data).where(eq(shopItems.id, id));
}

export async function adminDeleteShopItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(shopItems).set({ isActive: false }).where(eq(shopItems.id, id));
}

export async function adminListOrders() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: shopOrders.id,
      userId: shopOrders.userId,
      itemId: shopOrders.itemId,
      quantity: shopOrders.quantity,
      totalPrice: shopOrders.totalPrice,
      status: shopOrders.status,
      deliveryNote: shopOrders.deliveryNote,
      userNote: shopOrders.userNote,
      shippingAddress: shopOrders.shippingAddress,
      createdAt: shopOrders.createdAt,
      updatedAt: shopOrders.updatedAt,
      userName: users.name,
      userEmail: users.email,
      userNickname: users.nickname,
      itemName: shopItems.name,
      itemCategory: shopItems.category,
      itemImage: shopItems.image,
    })
    .from(shopOrders)
    .innerJoin(users, eq(shopOrders.userId, users.id))
    .innerJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
    .orderBy(desc(shopOrders.createdAt));
}

export async function adminUpdateOrderStatus(
  orderId: number,
  status: "pending" | "processing" | "delivered" | "cancelled",
  options?: {
    note?: string;
    trackingNumber?: string;
    shippingCarrier?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const updateData: Record<string, unknown> = { status };
  if (options?.note !== undefined) updateData.deliveryNote = options.note;
  if (options?.trackingNumber !== undefined) updateData.trackingNumber = options.trackingNumber || null;
  if (options?.shippingCarrier !== undefined) updateData.shippingCarrier = options.shippingCarrier || null;
  await db.update(shopOrders).set(updateData as any).where(eq(shopOrders.id, orderId));
  // Notificar al usuario sobre el cambio de estado
  const [order] = await db
    .select({ userId: shopOrders.userId, itemName: shopItems.name, itemCategory: shopItems.category })
    .from(shopOrders)
    .innerJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
    .where(eq(shopOrders.id, orderId))
    .limit(1);
  if (order) {
    const { createNotification } = await import("./notifications");
    const notifMap: Record<string, { type: any; title: string; message: string }> = {
      processing: {
        type: "order_processing",
        title: "Pedido en proceso",
        message: `Tu pedido de "${order.itemName}" está siendo preparado para envío.`,
      },
      delivered: {
        type: order.itemCategory === "physical" ? "order_delivered" : "order_delivered",
        title: order.itemCategory === "physical" ? "¡Pedido enviado!" : "¡Pedido entregado!",
        message: order.itemCategory === "physical"
          ? `Tu pedido de "${order.itemName}" ha sido enviado.${
              options?.trackingNumber ? ` Número de guía: ${options.trackingNumber}${options?.shippingCarrier ? ` (${options.shippingCarrier})` : ""}.` : ""
            } Revisa los detalles en Mis Pedidos.`
          : `Tu pedido de "${order.itemName}" ha sido entregado. Revisa el código en Mis Pedidos.`,
      },
      cancelled: {
        type: "order_cancelled",
        title: "Pedido cancelado",
        message: `Tu pedido de "${order.itemName}" ha sido cancelado.${options?.note ? ` Motivo: ${options.note}` : ""} Contacta al soporte si tienes dudas.`,
      },
    };
    const notif = notifMap[status];
    if (notif) {
      await createNotification({
        userId: order.userId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        link: "/shop?tab=orders",
        referenceId: orderId,
        referenceType: "order",
      });
    }
  }
}

// ─── Admin: Cosmetics ─────────────────────────────────────────────────────────
export async function adminCreateCosmetic(data: InsertCosmetic): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(cosmetics).values(data).$returningId();
  return result.id;
}

export async function adminUpdateCosmetic(id: number, data: Partial<InsertCosmetic>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(cosmetics).set(data).where(eq(cosmetics.id, id));
}

export async function adminDeleteCosmetic(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(cosmetics).where(eq(cosmetics.id, id));
}

// ─── Admin: Brand Ads ─────────────────────────────────────────────────────────
export async function adminListBrandAds() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(brandAds).orderBy(desc(brandAds.createdAt));
}

export async function adminUpdateBrandAd(id: number, data: Partial<InsertBrandAd>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(brandAds).set(data).where(eq(brandAds.id, id));
}

export async function adminDeleteBrandAd(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(brandAds).set({ isActive: false }).where(eq(brandAds.id, id));
}

// ─── Admin: Reward Tasks ──────────────────────────────────────────────────────
export async function adminListRewardTasks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rewardTasks).orderBy(desc(rewardTasks.createdAt));
}

export async function adminCreateRewardTask(data: InsertRewardTask) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(rewardTasks).values(data);
}

export async function adminUpdateRewardTask(id: number, data: Partial<InsertRewardTask>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(rewardTasks).set(data).where(eq(rewardTasks.id, id));
}

export async function adminDeleteRewardTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(rewardTasks).set({ isActive: false }).where(eq(rewardTasks.id, id));
}

// ─── Admin: News ──────────────────────────────────────────────────────────────
export async function adminCreateNews(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  category: "torneos" | "equipos" | "juegos" | "plataforma" | "general";
  authorId: number;
  published?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { published, ...rest } = data;
  await db.insert(news).values({
    ...rest,
    publishedAt: published ? new Date() : null,
  });
}

export async function adminUpdateNews(id: number, data: Partial<{
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  category: "torneos" | "equipos" | "juegos" | "plataforma" | "general";
  published: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { published, ...rest } = data;
  const updateData: any = { ...rest };
  if (published !== undefined) {
    updateData.publishedAt = published ? new Date() : null;
    updateData.isPublished = published;
  }
  await db.update(news).set(updateData).where(eq(news.id, id));
}

export async function adminDeleteNews(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(news).where(eq(news.id, id));
}

export async function adminListNews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(news).orderBy(desc(news.createdAt));
}

// ─── Admin: Tournaments Pending Approval ──────────────────────────────────────
export async function adminListPendingTournaments() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      game: tournaments.game,
      status: tournaments.status,
      createdAt: tournaments.createdAt,
      organizerName: users.name,
      organizerEmail: users.email,
    })
    .from(tournaments)
    .innerJoin(users, eq(tournaments.creatorId, users.id))
    .where(eq(tournaments.status, "pending_approval"))
    .orderBy(desc(tournaments.createdAt));
}
export async function adminApproveTournament(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tournaments).set({ status: "registration_open" }).where(eq(tournaments.id, id));
}

export async function adminRejectTournament(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tournaments).set({ status: "cancelled" }).where(eq(tournaments.id, id));
}

// ─── Community & Follows ──────────────────────────────────────────────────────
export async function listPublicUsers(opts: { search?: string; limit?: number; offset?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const { search, limit = 40, offset = 0 } = opts;
  const equippedCosmetic = alias(userCosmetics, "equippedCosmetic");
  const conditions = [];
  if (search) {
    const safeSearch = escapeLike(search);
    conditions.push(
      or(
        like(users.name, `%${safeSearch}%`),
        like(users.nickname, `%${safeSearch}%`)
      )
    );
  }
  const query = db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      bannerUrl: users.bannerUrl,
      bio: users.bio,
      profileType: users.profileType,
      mainGame: users.mainGame,
      country: users.country,
      role: users.role,
      createdAt: users.createdAt,
      activeFrameImage: sql<string | null>`MAX(${cosmetics.frameImage})`,
      isVerified: users.isVerified,
    })
    .from(users)
    .leftJoin(equippedCosmetic, and(eq(equippedCosmetic.userId, users.id), eq(equippedCosmetic.isEquipped, true)))
    .leftJoin(cosmetics, eq(cosmetics.id, equippedCosmetic.cosmeticId))
    .groupBy(
      users.id, users.name, users.nickname, users.avatar, users.bannerUrl,
      users.bio, users.profileType, users.mainGame, users.country, users.role,
      users.createdAt, users.isVerified
    )
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function followUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Check if already following
  const existing = await db
    .select()
    .from(userFollows)
    .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)))
    .limit(1);
  if (existing.length > 0) return { isNew: false }; // already following
  await db.insert(userFollows).values({ followerId, followingId });
  return { isNew: true };
}

export async function unfollowUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(userFollows)
    .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
}

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(userFollows)
    .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)))
    .limit(1);
  return result.length > 0;
}

export async function getFollowerCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userFollows)
    .where(eq(userFollows.followingId, userId));
  return Number(result[0]?.count ?? 0);
}

export async function getFollowingCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userFollows)
    .where(eq(userFollows.followerId, userId));
  return Number(result[0]?.count ?? 0);
}

export async function getFollowers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const equippedCosmetic = alias(userCosmetics, "equippedCosmeticFollower");
  return db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      profileType: users.profileType,
      activeFrameImage: cosmetics.frameImage,
    })
    .from(userFollows)
    .innerJoin(users, eq(userFollows.followerId, users.id))
    .leftJoin(equippedCosmetic, and(eq(equippedCosmetic.userId, users.id), eq(equippedCosmetic.isEquipped, true)))
    .leftJoin(cosmetics, eq(cosmetics.id, equippedCosmetic.cosmeticId))
    .where(eq(userFollows.followingId, userId))
    .orderBy(desc(userFollows.createdAt));
}

export async function getFollowing(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const equippedCosmetic = alias(userCosmetics, "equippedCosmeticFollowing");
  return db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      profileType: users.profileType,
      activeFrameImage: cosmetics.frameImage,
    })
    .from(userFollows)
    .innerJoin(users, eq(userFollows.followingId, users.id))
    .leftJoin(equippedCosmetic, and(eq(equippedCosmetic.userId, users.id), eq(equippedCosmetic.isEquipped, true)))
    .leftJoin(cosmetics, eq(cosmetics.id, equippedCosmetic.cosmeticId))
    .where(eq(userFollows.followerId, userId))
    .orderBy(desc(userFollows.createdAt));
}

// ─── Team Public Profile ───────────────────────────────────────────────────────
export async function getTeamPublicProfile(teamId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get team base info
  const teamRows = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!teamRows.length) return null;
  const team = teamRows[0];

  // Get members with user info and avatar
  const equippedCosmeticPublic = alias(userCosmetics, "equippedCosmeticPublic");
  const members = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      gameId: teamMembers.gameId,
      joinedAt: teamMembers.joinedAt,
      userName: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      country: users.country,
      mainGame: users.mainGame,
      gameRole: users.gameRole,
      elo: users.elo,
      competitiveRegion: users.competitiveRegion,
      rosterPhoto: users.rosterPhoto,
      rosterImageUrl: users.rosterImageUrl,
      userGameId: users.gameId,
      competitiveScore: users.competitiveScore,
      activeFrameImage: cosmetics.frameImage,
    })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .leftJoin(equippedCosmeticPublic, and(eq(equippedCosmeticPublic.userId, users.id), eq(equippedCosmeticPublic.isEquipped, true)))
    .leftJoin(cosmetics, eq(cosmetics.id, equippedCosmeticPublic.cosmeticId))
    .where(eq(teamMembers.teamId, teamId));

  // Get all approved registrations with tournament info
  const registrations = await db
    .select({
      id: tournamentRegistrations.id,
      tournamentId: tournamentRegistrations.tournamentId,
      status: tournamentRegistrations.status,
      registeredAt: tournamentRegistrations.registeredAt,
      tournamentName: tournaments.name,
      tournamentGame: tournaments.game,
      tournamentStatus: tournaments.status,
      tournamentWinnerId: tournaments.winnerId,
      tournamentStartDate: tournaments.startDate,
      tournamentBanner: tournaments.banner,
    })
    .from(tournamentRegistrations)
    .leftJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
    .where(and(
      eq(tournamentRegistrations.teamId, teamId),
      eq(tournamentRegistrations.status, "Aprobado")
    ))
    .orderBy(desc(tournamentRegistrations.registeredAt));

  // Compute stats from registrations
  const tournamentsPlayed = registrations.filter(r => r.tournamentStatus === "completed").length;
  const tournamentsWon = registrations.filter(r => r.tournamentStatus === "completed" && r.tournamentWinnerId === teamId).length;
  const tournamentsLost = tournamentsPlayed - tournamentsWon;

  // Get achievements
  const achievements = await db
    .select({
      id: teamAchievements.id,
      title: teamAchievements.title,
      description: teamAchievements.description,
      tournamentId: teamAchievements.tournamentId,
      awardedAt: teamAchievements.awardedAt,
    })
    .from(teamAchievements)
    .where(eq(teamAchievements.teamId, teamId))
    .orderBy(desc(teamAchievements.awardedAt));

  // Per-player stats: count matches where they were part of the team
  const memberStats = await Promise.all(
    members.map(async (member) => {
      // Count tournaments played by this player (as part of this team)
      const playerTournaments = registrations.filter(r => r.tournamentStatus === "completed").length;
      const playerWins = registrations.filter(r => r.tournamentStatus === "completed" && r.tournamentWinnerId === teamId).length;
      return {
        ...member,
        stats: {
          tournamentsPlayed: playerTournaments,
          tournamentsWon: playerWins,
          tournamentsLost: playerTournaments - playerWins,
        },
      };
    })
  );

  return {
    ...team,
    members: memberStats,
    achievements,
    registrations,
    stats: {
      tournamentsPlayed,
      tournamentsWon,
      tournamentsLost,
    },
  };
}

export async function updateTeamImages(teamId: number, data: { logo?: string; banner?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(teams).set(data).where(eq(teams.id, teamId));
}

// ─── Admin Stats ───────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [totalTeams] = await db.select({ count: sql<number>`count(*)` }).from(teams);
  const [totalTournaments] = await db.select({ count: sql<number>`count(*)` }).from(tournaments);
  const [activeTournaments] = await db.select({ count: sql<number>`count(*)` }).from(tournaments)
    .where(eq(tournaments.status, "in_progress"));
  const [pendingTournaments] = await db.select({ count: sql<number>`count(*)` }).from(tournaments)
    .where(eq(tournaments.status, "pending_approval"));
  const [totalBets] = await db.select({ count: sql<number>`count(*)` }).from(bets);
  const [totalOrders] = await db.select({ count: sql<number>`count(*)` }).from(shopOrders);
  const [pendingOrders] = await db.select({ count: sql<number>`count(*)` }).from(shopOrders)
    .where(eq(shopOrders.status, "pending"));
  const [pendingCreators] = await db.select({ count: sql<number>`count(*)` }).from(contentCreators)
    .where(eq(contentCreators.status, "pending"));
  const [pendingVerifications] = await db.select({ count: sql<number>`count(*)` }).from(verificationRequests)
    .where(eq(verificationRequests.status, "pending"));

  // Recent users (last 10)
  const recentUsers = await db
    .select({ id: users.id, name: users.name, nickname: users.nickname, avatar: users.avatar, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(10);

  return {
    totalUsers: Number(totalUsers.count),
    totalTeams: Number(totalTeams.count),
    totalTournaments: Number(totalTournaments.count),
    activeTournaments: Number(activeTournaments.count),
    pendingTournaments: Number(pendingTournaments.count),
    totalBets: Number(totalBets.count),
    totalOrders: Number(totalOrders.count),
    pendingOrders: Number(pendingOrders.count),
    pendingCreators: Number(pendingCreators.count),
    pendingVerifications: Number(pendingVerifications.count),
    recentUsers,
  };
}

export async function adminListTeams(search?: string) {
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select({
      id: teams.id,
      name: teams.name,
      tag: teams.tag,
      logo: teams.logo,
      game: teams.game,
      country: teams.country,
      points: teams.points,
      wins: teams.wins,
      losses: teams.losses,
      tournamentsPlayed: teams.tournamentsPlayed,
      tournamentsWon: teams.tournamentsWon,
      isVerified: teams.isVerified,
      captainId: teams.captainId,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .orderBy(desc(teams.createdAt))
    .limit(100);
  return query;
}

export async function adminVerifyTeam(teamId: number, verified: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(teams).set({ isVerified: verified }).where(eq(teams.id, teamId));
}

export async function adminListTournaments(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = status ? [eq(tournaments.status, status as any)] : [];
  return db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      game: tournaments.game,
      status: tournaments.status,
      maxTeams: tournaments.maxTeams,
      prizeAmount: tournaments.prizeAmount,
      startDate: tournaments.startDate,
      creatorId: tournaments.creatorId,
      isFeatured: tournaments.isFeatured,
      isPublic: tournaments.isPublic,
      createdAt: tournaments.createdAt,
    })
    .from(tournaments)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(tournaments.createdAt))
    .limit(100);
}

// ─── Content Creators ─────────────────────────────────────────────────────────
export async function applyAsCreator(userId: number, data: {
  bio?: string; category?: string;
  youtube?: string; twitch?: string; twitter?: string; instagram?: string; tiktok?: string;
  facebook?: string; kick?: string;
  subscribers?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  // Check if already applied
  const existing = await db.select().from(contentCreators).where(eq(contentCreators.userId, userId)).limit(1);
  if (existing.length > 0) {
    // Update existing application
    await db.update(contentCreators).set({ ...data, updatedAt: new Date() }).where(eq(contentCreators.userId, userId));
    return existing[0];
  }
  const [result] = await db.insert(contentCreators).values({ userId, ...data, status: "pending" });
  return result;
}

export async function getCreatorByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(contentCreators).where(eq(contentCreators.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function listApprovedCreators() {
  const db = await getDb();
  if (!db) return [];
  const equippedCosmetic = alias(userCosmetics, "equippedCosmetic");
  return db
    .select({
      id: contentCreators.id,
      userId: contentCreators.userId,
      category: contentCreators.category,
      bio: contentCreators.bio,
      youtube: contentCreators.youtube,
      twitch: contentCreators.twitch,
      twitter: contentCreators.twitter,
      instagram: contentCreators.instagram,
      tiktok: contentCreators.tiktok,
      subscribers: contentCreators.subscribers,
      appliedAt: contentCreators.appliedAt,
      // User info
      userName: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      banner: users.bannerUrl,
      activeFrameImage: cosmetics.frameImage,
      isVerified: users.isVerified,
    })
    .from(contentCreators)
    .innerJoin(users, eq(contentCreators.userId, users.id))
    .leftJoin(equippedCosmetic, and(eq(equippedCosmetic.userId, users.id), eq(equippedCosmetic.isEquipped, true)))
    .leftJoin(cosmetics, eq(cosmetics.id, equippedCosmetic.cosmeticId))
    .where(eq(contentCreators.status, "approved"))
    .orderBy(desc(contentCreators.subscribers));
}

export async function listPendingCreators() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: contentCreators.id,
      userId: contentCreators.userId,
      status: contentCreators.status,
      category: contentCreators.category,
      bio: contentCreators.bio,
      youtube: contentCreators.youtube,
      twitch: contentCreators.twitch,
      twitter: contentCreators.twitter,
      instagram: contentCreators.instagram,
      tiktok: contentCreators.tiktok,
      subscribers: contentCreators.subscribers,
      appliedAt: contentCreators.appliedAt,
      adminNote: contentCreators.adminNote,
      userName: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
    })
    .from(contentCreators)
    .innerJoin(users, eq(contentCreators.userId, users.id))
    .orderBy(desc(contentCreators.appliedAt));
}

export async function reviewCreator(id: number, status: "approved" | "rejected", adminNote?: string) {
  const db = await getDb();
  if (!db) return null;
  await db.update(contentCreators).set({
    status,
    adminNote: adminNote ?? null,
    reviewedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(contentCreators.id, id));
  return { success: true };
}

export async function getRecentUsers(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const equippedCosmetic = alias(userCosmetics, "equippedCosmetic");
  return db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      role: users.role,
      createdAt: users.createdAt,
      activeFrameImage: cosmetics.frameImage,
    })
    .from(users)
    .leftJoin(equippedCosmetic, and(eq(equippedCosmetic.userId, users.id), eq(equippedCosmetic.isEquipped, true)))
    .leftJoin(cosmetics, eq(cosmetics.id, equippedCosmetic.cosmeticId))
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

export async function getSuggestedUsers(currentUserId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const equippedCosmetic = alias(userCosmetics, "equippedCosmetic");
  // Return recent users excluding the current user
  return db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      role: users.role,
      createdAt: users.createdAt,
      activeFrameImage: cosmetics.frameImage,
    })
    .from(users)
    .leftJoin(equippedCosmetic, and(eq(equippedCosmetic.userId, users.id), eq(equippedCosmetic.isEquipped, true)))
    .leftJoin(cosmetics, eq(cosmetics.id, equippedCosmetic.cosmeticId))
    .where(sql`${users.id} != ${currentUserId}`)
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

export async function getFeaturedTournaments(limit = 6) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      game: tournaments.game,
      banner: tournaments.banner,
      prizeAmount: tournaments.prizeAmount,
      maxTeams: tournaments.maxTeams,
      startDate: tournaments.startDate,
      status: tournaments.status,
      isFeatured: tournaments.isFeatured,
      bracketType: tournaments.bracketType,
      registrationType: tournaments.registrationType,
      minPlayersPerTeam: tournaments.minPlayersPerTeam,
      maxPlayersPerTeam: tournaments.maxPlayersPerTeam,
      creatorName: users.name,
      creatorId: tournaments.creatorId,
    })
    .from(tournaments)
    .leftJoin(users, eq(tournaments.creatorId, users.id))
    .where(and(
      eq(tournaments.isPublic, true),
      sql`${tournaments.status} IN ('registration_open', 'in_progress', 'upcoming')`
    ))
    .orderBy(desc(tournaments.isFeatured), desc(tournaments.createdAt))
    .limit(limit);
  // Attach registered team count for each tournament
  const withCounts = await Promise.all(rows.map(async (t) => {
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tournamentRegistrations)
      .where(and(
        eq(tournamentRegistrations.tournamentId, t.id),
        eq(tournamentRegistrations.status, 'Aprobado')
      ));
    return { ...t, registeredCount: Number(countRow?.count ?? 0) };
  }));
  return withCounts;
}

// ─── LIKE sanitization helper ─────────────────────────────────────────────────
// FIX BAJO #14: Escape special LIKE characters (%, _, \) to prevent
// users from crafting wildcard patterns that could cause performance issues
// (e.g., searching "%%%%" would match everything and be expensive).
function escapeLike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

// ─── Search users by nickname ─────────────────────────────────────────────────────
export async function searchUsersByNickname(query: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const safeQuery = escapeLike(query);
  const equippedCosmetic = alias(userCosmetics, "equippedCosmetic");
  return db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      mainGame: users.mainGame,
      country: users.country,
      profileType: users.profileType,
      activeFrameImage: cosmetics.frameImage,
    })
    .from(users)
    .leftJoin(equippedCosmetic, and(eq(equippedCosmetic.userId, users.id), eq(equippedCosmetic.isEquipped, true)))
    .leftJoin(cosmetics, eq(cosmetics.id, equippedCosmetic.cosmeticId))
    .where(
      or(
        like(users.nickname, `%${safeQuery}%`),
        like(users.name, `%${safeQuery}%`)
      )
    )
    .limit(limit);
}

// ─── Remove team member ───────────────────────────────────────────────────────
export async function removeTeamMember(teamId: number, memberId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.id, memberId)));
}

// ─── Get team(s) a user belongs to ───────────────────────────────────────────
export async function getTeamsByMembership(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      teamId: teamMembers.teamId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      teamName: teams.name,
      teamTag: teams.tag,
      teamLogo: teams.logo,
      teamGame: teams.game,
      teamCaptainId: teams.captainId,
    })
    .from(teamMembers)
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId));
}

/**
 * Verifica si un usuario pertenece a al menos un equipo activo.
 * Cualquier miembro de equipo (capitán, jugador, suplente o coach) puede subir su roster card.
 */
export async function hasApprovedTeamMembership(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Cualquier miembro activo de un equipo puede subir su roster card
  // (capitán, jugador, suplente o coach)
  const memberships = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId))
    .limit(1);
  return memberships.length > 0;
}

// ─── Verification Requests ────────────────────────────────────────────────────
export async function requestVerification(
  userId: number,
  data: {
    reason: string;
    verificationType?: "streamer" | "pro_player" | "team" | "organization" | "content_creator" | "other";
    socialLinks?: string; // JSON string
    followersCount?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Upsert: if user already has a request, update it (re-request)
  const existing = await db
    .select({ id: verificationRequests.id, status: verificationRequests.status })
    .from(verificationRequests)
    .where(eq(verificationRequests.userId, userId))
    .limit(1);
  if (existing.length > 0) {
    if (existing[0].status === "pending") {
      throw new Error("Ya tienes una solicitud de verificación pendiente.");
    }
    // Allow re-request if previously rejected
    await db
      .update(verificationRequests)
      .set({
        status: "pending",
        reason: data.reason,
        verificationType: data.verificationType ?? "other",
        socialLinks: data.socialLinks ?? null,
        followersCount: data.followersCount ?? null,
        adminNote: null,
        requestedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
      } as any)
      .where(eq(verificationRequests.userId, userId));
  } else {
    await db.insert(verificationRequests).values({
      userId,
      reason: data.reason,
      verificationType: data.verificationType ?? "other",
      socialLinks: data.socialLinks ?? null,
      followersCount: data.followersCount ?? null,
    } as any);
  }
  // Notificar a todos los admins que hay una solicitud pendiente
  try {
    const { createNotification } = await import("./notifications");
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`${users.role} IN ('admin', 'super_admin')`);
    const requestingUser = await db
      .select({ name: users.name, nickname: users.nickname })
      .from(users).where(eq(users.id, userId)).limit(1);
    const userName = requestingUser[0]?.nickname ?? requestingUser[0]?.name ?? `Usuario #${userId}`;
    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type: "verification_pending_admin",
        title: "Nueva solicitud de verificación",
        message: `${userName} ha solicitado verificación de cuenta (${data.verificationType ?? "other"}).`,
        link: "/admin?tab=verifications",
        referenceId: userId,
        referenceType: "verification",
      });
    }
  } catch {}
  return { success: true };
}

export async function getMyVerificationRequest(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(verificationRequests)
    .where(eq(verificationRequests.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listVerificationRequests(status?: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: verificationRequests.id,
      userId: verificationRequests.userId,
      status: verificationRequests.status,
      verificationType: (verificationRequests as any).verificationType,
      reason: verificationRequests.reason,
      socialLinks: (verificationRequests as any).socialLinks,
      followersCount: (verificationRequests as any).followersCount,
      adminNote: verificationRequests.adminNote,
      requestedAt: verificationRequests.requestedAt,
      reviewedAt: verificationRequests.reviewedAt,
      reviewedBy: verificationRequests.reviewedBy,
      userName: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      userIsVerified: users.isVerified,
    })
    .from(verificationRequests)
    .leftJoin(users, eq(users.id, verificationRequests.userId))
    .where(status ? eq(verificationRequests.status, status) : undefined)
    .orderBy(desc(verificationRequests.requestedAt));
}

export async function reviewVerificationRequest(
  requestId: number,
  adminId: number,
  status: "approved" | "rejected",
  adminNote?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const rows = await db
    .select({ userId: verificationRequests.userId })
    .from(verificationRequests)
    .where(eq(verificationRequests.id, requestId))
    .limit(1);
  if (!rows.length) throw new Error("Solicitud no encontrada");
  const { userId } = rows[0];
  await db
    .update(verificationRequests)
    .set({ status, adminNote: adminNote ?? null, reviewedAt: new Date(), reviewedBy: adminId })
    .where(eq(verificationRequests.id, requestId));
  // If approved, mark user as verified; if rejected, remove verification
  await db
    .update(users)
    .set({ isVerified: status === "approved" })
    .where(eq(users.id, userId));
  // Notificar al usuario sobre el resultado
  try {
    const { createNotification } = await import("./notifications");
    if (status === "approved") {
      await createNotification({
        userId,
        type: "verification_approved",
        title: "✅ Verificación aprobada",
        message: "Tu solicitud de verificación ha sido aprobada. Tu cuenta ahora tiene la insignia verificada.",
        link: "/profile",
        referenceType: "verification",
      });
    } else {
      await createNotification({
        userId,
        type: "verification_rejected",
        title: "Solicitud de verificación rechazada",
        message: adminNote
          ? `Tu solicitud de verificación fue rechazada. Motivo: ${adminNote}`
          : "Tu solicitud de verificación fue rechazada. Puedes volver a solicitarla con más información.",
        link: "/profile",
        referenceType: "verification",
      });
    }
  } catch {}
  return { success: true };
}

// ─── Team Tournament History (para Ranking detallado) ─────────────────────────
export async function getTeamTournamentHistory(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  // Obtener todas las inscripciones aprobadas con info del torneo
  const registrations = await db
    .select({
      tournamentId: tournamentRegistrations.tournamentId,
      registeredAt: tournamentRegistrations.registeredAt,
      tournamentName: tournaments.name,
      tournamentStatus: tournaments.status,
      tournamentWinnerId: tournaments.winnerId,
      tournamentStartDate: tournaments.startDate,
      tournamentBanner: tournaments.banner,
      tournamentGame: tournaments.game,
      tournamentGameSlug: tournaments.gameSlug,
      tournamentMaxTeams: tournaments.maxTeams,
      tournamentPrize: tournaments.prizeAmount,
    })
    .from(tournamentRegistrations)
    .leftJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
    .where(and(
      eq(tournamentRegistrations.teamId, teamId),
      eq(tournamentRegistrations.status, "Aprobado")
    ))
    .orderBy(desc(tournamentRegistrations.registeredAt));

  // Para cada torneo, calcular W/L del equipo en ese torneo
  const history = await Promise.all(registrations.map(async (reg) => {
    const matches = await db
      .select({
        winnerId: tournamentMatches.winnerId,
        team1Id: tournamentMatches.team1Id,
        team2Id: tournamentMatches.team2Id,
        status: tournamentMatches.status,
      })
      .from(tournamentMatches)
      .where(and(
        eq(tournamentMatches.tournamentId, reg.tournamentId),
        eq(tournamentMatches.status, "completed"),
      ));

    type MatchRow = typeof matches[0];
    const teamMatches = matches.filter((m: MatchRow) => m.team1Id === teamId || m.team2Id === teamId);
    const wins = teamMatches.filter((m: MatchRow) => m.winnerId === teamId).length;
    const losses = teamMatches.filter((m: MatchRow) => m.winnerId !== null && m.winnerId !== teamId).length;
    const isWinner = reg.tournamentWinnerId === teamId;

    return {
      tournamentId: reg.tournamentId,
      tournamentName: reg.tournamentName ?? "Torneo",
      tournamentStatus: reg.tournamentStatus ?? "unknown",
      tournamentGame: reg.tournamentGame ?? null,
      tournamentGameSlug: reg.tournamentGameSlug ?? null,
      tournamentBanner: reg.tournamentBanner ?? null,
      tournamentStartDate: reg.tournamentStartDate ?? null,
      tournamentPrize: reg.tournamentPrize ?? null,
      wins,
      losses,
      isWinner,
      registeredAt: reg.registeredAt,
    };
  }));

  return history;
}

// ─── GPR: Highlights del ranking ──────────────────────────────────────────────
export async function getRankingHighlights(gameSlug?: string) {
  const db = await getDb();
  if (!db) return { champion: null, biggestRise: null, bestWinRate: null, hasRealResults: false, rankingStatus: "no_results" as const };

  // Verificar si existen combates finalizados (fuente de verdad para resultados reales)
  const completedMatchesQuery = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tournamentMatches)
    .where(eq(tournamentMatches.status, "completed"));
  const [matchCount] = await completedMatchesQuery;
  const hasRealResults = Number(matchCount?.count ?? 0) > 0;

  // Verificar si existe algún torneo finalizado
  const completedTournamentsQuery = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tournaments)
    .where(eq(tournaments.status, "completed"));
  const [tourneyCount] = await completedTournamentsQuery;
  const hasCompletedTournament = Number(tourneyCount?.count ?? 0) > 0;

  // Obtener todos los equipos ordenados por puntos
  const allTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      tag: teams.tag,
      logo: teams.logo,
      points: teams.points,
      wins: teams.wins,
      losses: teams.losses,
      tournamentsPlayed: teams.tournamentsPlayed,
      tournamentsWon: teams.tournamentsWon,
      gameSlug: teams.gameSlug,
      isVerified: teams.isVerified,
    })
    .from(teams)
    .where(gameSlug ? eq(teams.gameSlug, gameSlug) : undefined)
    .orderBy(sql`${teams.points} DESC`);

  if (allTeams.length === 0) {
    return { champion: null, biggestRise: null, bestWinRate: null, hasRealResults: false, rankingStatus: "no_results" as const };
  }

  // Determinar el estado del ranking
  // "no_results": sin combates finalizados → no mostrar posiciones ni campeón
  // "provisional": hay combates finalizados pero ningún torneo completado → clasificación provisional
  // "official": al menos un torneo completado → ranking oficial con campeón
  const rankingStatus: "no_results" | "provisional" | "official" =
    !hasRealResults ? "no_results" :
    !hasCompletedTournament ? "provisional" :
    "official";

  // Campeón: SOLO si el ranking es oficial (torneo completado) Y el equipo tiene torneos ganados
  const champion = rankingStatus === "official"
    ? (allTeams.find(t => (t.tournamentsWon ?? 0) > 0) ?? null)
    : null;

  // Mejor win rate: solo si hay resultados reales (mínimo 3 combates jugados)
  const withEnoughGames = hasRealResults
    ? allTeams.filter(t => (t.wins + t.losses) >= 3)
    : [];
  const bestWinRate = withEnoughGames.length > 0
    ? withEnoughGames.reduce((best, t) => {
        const wr = t.wins / (t.wins + t.losses);
        const bestWr = best.wins / (best.wins + best.losses);
        return wr > bestWr ? t : best;
      })
    : null;

  // Mayor ascenso: solo si hay resultados reales
  const biggestRise = hasRealResults
    ? (allTeams
        .filter(t => (t.tournamentsPlayed ?? 0) >= 1 && (t.wins ?? 0) > 0)
        .sort((a, b) => {
          const aRatio = (a.wins ?? 0) / Math.max(1, a.tournamentsPlayed ?? 1);
          const bRatio = (b.wins ?? 0) / Math.max(1, b.tournamentsPlayed ?? 1);
          return bRatio - aRatio;
        })[0] ?? null)
    : null;

  return { champion, biggestRise, bestWinRate, hasRealResults, rankingStatus };
}

// ─── GPR: Fuerza por juego ────────────────────────────────────────────────────
export async function getGameStrength() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      gameSlug: teams.gameSlug,
      avgPoints: sql<number>`AVG(${teams.points})`,
      teamCount: sql<number>`COUNT(*)`,
    })
    .from(teams)
    .where(sql`${teams.gameSlug} IS NOT NULL AND ${teams.points} > 0`)
    .groupBy(teams.gameSlug)
    .orderBy(sql`AVG(${teams.points}) DESC`);

  return result.map(r => ({
    gameSlug: r.gameSlug ?? "unknown",
    avgPoints: Math.round(Number(r.avgPoints) || 0),
    teamCount: Number(r.teamCount) || 0,
  }));
}

// ─── GPR: Posición de un equipo en cada torneo ────────────────────────────────
export async function getTeamTournamentPositions(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  // Obtener registraciones del equipo con info del torneo
  const regs = await db
    .select({
      tournamentId: tournamentRegistrations.tournamentId,
      tournamentName: tournaments.name,
      tournamentStatus: tournaments.status,
      tournamentBanner: tournaments.banner,
      tournamentGameSlug: tournaments.gameSlug,
      tournamentStartDate: tournaments.startDate,
      winnerId: tournaments.winnerId,
    })
    .from(tournamentRegistrations)
    .innerJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
    .where(and(
      eq(tournamentRegistrations.teamId, teamId),
    ))
    .orderBy(sql`${tournaments.startDate} DESC`)
    .limit(10);

  return Promise.all(regs.map(async (reg) => {
    const db2 = await getDb();
    if (!db2) return null;
    // Calcular W/L del equipo en este torneo
    const matches = await db2
      .select({
        team1Id: tournamentMatches.team1Id,
        team2Id: tournamentMatches.team2Id,
        winnerId: tournamentMatches.winnerId,
      })
      .from(tournamentMatches)
      .where(and(
        eq(tournamentMatches.tournamentId, reg.tournamentId),
        eq(tournamentMatches.status, "completed"),
      ));
    type MatchRow = typeof matches[0];
    const teamMatches = matches.filter((m: MatchRow) => m.team1Id === teamId || m.team2Id === teamId);
    const wins = teamMatches.filter((m: MatchRow) => m.winnerId === teamId).length;
    const losses = teamMatches.filter((m: MatchRow) => m.winnerId !== null && m.winnerId !== teamId).length;
    const isChampion = reg.winnerId === teamId;

    return {
      tournamentId: reg.tournamentId,
      tournamentName: reg.tournamentName ?? "Torneo",
      tournamentStatus: reg.tournamentStatus ?? "unknown",
      tournamentBanner: reg.tournamentBanner ?? null,
      tournamentGameSlug: reg.tournamentGameSlug ?? null,
      tournamentStartDate: reg.tournamentStartDate ?? null,
      wins,
      losses,
      isChampion,
    };
  }));
}

// ─── Upcoming Matches (para Ranking GPR) ─────────────────────────────────────
/**
 * Devuelve los próximos combates de un torneo (status pending o in_progress),
 * incluyendo logos y nombres de ambos equipos, ordenados por scheduledAt asc.
 */
export async function getUpcomingMatchesByTournament(tournamentId: number, limit = 4) {
  const db = await getDb();
  if (!db) return [];
  const team1 = alias(teams, "team1");
  const team2 = alias(teams, "team2");
  const rows = await db
    .select({
      id: tournamentMatches.id,
      round: tournamentMatches.round,
      matchNumber: tournamentMatches.matchNumber,
      status: tournamentMatches.status,
      scheduledAt: tournamentMatches.scheduledAt,
      team1Id: tournamentMatches.team1Id,
      team2Id: tournamentMatches.team2Id,
      winnerId: tournamentMatches.winnerId,
      team1Score: tournamentMatches.team1Score,
      team2Score: tournamentMatches.team2Score,
      team1Name: team1.name,
      team2Name: team2.name,
      team1Logo: team1.logo,
      team2Logo: team2.logo,
      team1Tag: team1.tag,
      team2Tag: team2.tag,
    })
    .from(tournamentMatches)
    .leftJoin(team1, eq(tournamentMatches.team1Id, team1.id))
    .leftJoin(team2, eq(tournamentMatches.team2Id, team2.id))
    .where(
      and(
        eq(tournamentMatches.tournamentId, tournamentId),
        inArray(tournamentMatches.status, ["pending", "in_progress"])
      )
    )
    .orderBy(tournamentMatches.round, tournamentMatches.matchNumber)
    .limit(limit);
  return rows;
}

/**
 * Devuelve los torneos activos (in_progress) filtrados opcionalmente por gameSlug.
 * Usado para el selector de torneo en el Ranking.
 */
export async function getActiveTournamentsByGame(gameSlug?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(tournaments.status, "in_progress")];
  if (gameSlug) conditions.push(eq(tournaments.gameSlug, gameSlug));
  return db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      gameSlug: tournaments.gameSlug,
      status: tournaments.status,
      banner: tournaments.banner,
      startDate: tournaments.startDate,
      endDate: tournaments.endDate,
      bracketType: tournaments.bracketType,
      maxTeams: tournaments.maxTeams,
    })
    .from(tournaments)
    .where(and(...conditions))
    .orderBy(desc(tournaments.startDate));
}

/**
 * Devuelve el ranking de equipos de un torneo específico,
 * calculado desde los resultados de matches del torneo.
 */
export async function getTeamRankingByTournament(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all approved registrations for this tournament
  const regs = await db
    .select({
      teamId: tournamentRegistrations.teamId,
      teamName: teams.name,
      teamLogo: teams.logo,
      teamTag: teams.tag,
      teamGameSlug: teams.gameSlug,
      teamIsVerified: teams.isVerified,
    })
    .from(tournamentRegistrations)
    .leftJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
    .where(
      and(
        eq(tournamentRegistrations.tournamentId, tournamentId),
        eq(tournamentRegistrations.status, "Aprobado")
      )
    );

  if (regs.length === 0) return [];

  // Get all completed matches for this tournament
  const matches = await db
    .select({
      team1Id: tournamentMatches.team1Id,
      team2Id: tournamentMatches.team2Id,
      winnerId: tournamentMatches.winnerId,
      round: tournamentMatches.round,
    })
    .from(tournamentMatches)
    .where(
      and(
        eq(tournamentMatches.tournamentId, tournamentId),
        eq(tournamentMatches.status, "completed")
      )
    );

  // Calculate W/L per team
  return regs.map((reg) => {
    const teamId = reg.teamId!;
    const teamMatches = matches.filter((m) => m.team1Id === teamId || m.team2Id === teamId);
    const wins = teamMatches.filter((m) => m.winnerId === teamId).length;
    const losses = teamMatches.filter((m) => m.winnerId !== null && m.winnerId !== teamId).length;
    const maxRound = teamMatches.length > 0 ? Math.max(...teamMatches.map((m) => m.round)) : 0;
    // Points: 3 per win + 1 per round reached (simple formula)
    const points = wins * 3 + maxRound;
    return {
      id: teamId,
      name: reg.teamName ?? "Equipo",
      logo: reg.teamLogo ?? null,
      tag: reg.teamTag ?? null,
      gameSlug: reg.teamGameSlug ?? null,
      isVerified: reg.teamIsVerified ?? false,
      wins,
      losses,
      points,
      tournamentsPlayed: teamMatches.length > 0 ? 1 : 0,
      tournamentsWon: 0,
    };
  }).sort((a, b) => b.points - a.points || b.wins - a.wins);
}

// ─── Team Rank Position ────────────────────────────────────────────────────────
export async function getTeamRankPosition(teamId: number) {
  const db = await getDb();
  if (!db) return null;
  // Obtener todos los equipos ordenados por puntos para calcular la posición
  const allTeams = await db
    .select({ id: teams.id, points: teams.points, gameSlug: teams.gameSlug })
    .from(teams)
    .orderBy(desc(teams.points));
  const globalPos = allTeams.findIndex((t) => t.id === teamId);
  const team = allTeams.find((t) => t.id === teamId);
  if (!team) return null;
  // Posición en su juego
  const gameTeams = allTeams.filter((t) => t.gameSlug === team.gameSlug);
  const gamePos = gameTeams.findIndex((t) => t.id === teamId);
  return {
    globalPosition: globalPos + 1,
    globalTotal: allTeams.length,
    gamePosition: gamePos + 1,
    gameTotal: gameTeams.length,
  };
}

// ─── Tournament Results (completed matches history) ────────────────────────────
/**
 * Devuelve todas las partidas completadas de un torneo con marcador y equipos.
 * Ordenadas por ronda ASC, completedAt ASC.
 */
export async function getTournamentResults(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  const team1 = alias(teams, "team1");
  const team2 = alias(teams, "team2");
  return db
    .select({
      id: tournamentMatches.id,
      round: tournamentMatches.round,
      matchNumber: tournamentMatches.matchNumber,
      team1Id: tournamentMatches.team1Id,
      team2Id: tournamentMatches.team2Id,
      team1Name: team1.name,
      team2Name: team2.name,
      team1Logo: team1.logo,
      team2Logo: team2.logo,
      team1Score: tournamentMatches.team1Score,
      team2Score: tournamentMatches.team2Score,
      winnerId: tournamentMatches.winnerId,
      notes: tournamentMatches.notes,
      completedAt: tournamentMatches.completedAt,
    })
    .from(tournamentMatches)
    .leftJoin(team1, eq(tournamentMatches.team1Id, team1.id))
    .leftJoin(team2, eq(tournamentMatches.team2Id, team2.id))
    .where(and(
      eq(tournamentMatches.tournamentId, tournamentId),
      eq(tournamentMatches.status, "completed"),
    ))
    .orderBy(tournamentMatches.round, tournamentMatches.completedAt);
}

// ─── Team Management: Transfer Captaincy, Dissolve, Member Count ─────────────
export async function getTeamMemberCount(teamId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));
  return Number(result[0]?.count ?? 0);
}

export async function transferCaptaincy(teamId: number, newCaptainUserId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Update the team's captainId
  await db.update(teams).set({ captainId: newCaptainUserId }).where(eq(teams.id, teamId));
  // Demote old captain to player
  await db.update(teamMembers)
    .set({ role: "player" })
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, "captain")));
  // Promote new captain
  await db.update(teamMembers)
    .set({ role: "captain" })
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, newCaptainUserId)));
}

export async function dissolveTeam(teamId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete in order to avoid FK constraint issues
  await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
  await db.delete(teamAchievements).where(eq(teamAchievements.teamId, teamId));
  await db.delete(tournamentRegistrations).where(eq(tournamentRegistrations.teamId, teamId));
  await db.delete(teams).where(eq(teams.id, teamId));
}

// ─── Delete Tournament (cascade) ──────────────────────────────────────────────
/**
 * Permanently deletes a tournament and all its related data:
 * bets, matches, registrations, streams, and the tournament record itself.
 */
export async function deleteTournament(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete in dependency order to avoid FK constraint issues
  await db.delete(bets).where(eq(bets.tournamentId, id));
  await db.delete(tournamentMatches).where(eq(tournamentMatches.tournamentId, id));
  await db.delete(tournamentRegistrations).where(eq(tournamentRegistrations.tournamentId, id));
  await db.delete(streams).where(eq(streams.tournamentId, id));
  await db.delete(tournaments).where(eq(tournaments.id, id));
}
