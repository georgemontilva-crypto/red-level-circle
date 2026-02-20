import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  registrationAuditLog,
  teamMembers,
  teams,
  tournamentMatches,
  tournamentRegistrations,
  tournaments,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

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

export async function updateUserRole(userId: number, role: "user" | "premium" | "admin") {
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
  const [result] = await db.insert(teams).values(data);
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
  return db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      gameId: teamMembers.gameId,
      joinedAt: teamMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));
}

export async function addTeamMember(data: {
  teamId: number;
  userId: number;
  role?: "captain" | "player" | "substitute";
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
  isPublic?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(tournaments).values({
    ...data,
    status: "draft",
    maxTeams: data.maxTeams ?? 16,
    minPlayersPerTeam: data.minPlayersPerTeam ?? 1,
    maxPlayersPerTeam: data.maxPlayersPerTeam ?? 5,
    isPublic: data.isPublic ?? true,
  });
  return (result as { insertId: number }).insertId;
}

export async function getTournaments(filters?: {
  status?: string;
  game?: string;
  search?: string;
  creatorId?: number;
  isPublic?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(tournaments.status, filters.status as any));
  if (filters?.game) conditions.push(eq(tournaments.game, filters.game));
  if (filters?.creatorId) conditions.push(eq(tournaments.creatorId, filters.creatorId));
  if (filters?.isPublic !== undefined) conditions.push(eq(tournaments.isPublic, filters.isPublic));
  if (filters?.search) {
    conditions.push(
      or(
        like(tournaments.name, `%${filters.search}%`),
        like(tournaments.game, `%${filters.search}%`)
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
      maxTeams: tournaments.maxTeams,
      status: tournaments.status,
      startDate: tournaments.startDate,
      registrationEnd: tournaments.registrationEnd,
      prizeDescription: tournaments.prizeDescription,
      prizeAmount: tournaments.prizeAmount,
      creatorId: tournaments.creatorId,
      banner: tournaments.banner,
      isPublic: tournaments.isPublic,
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
  await db.update(tournaments).set(data).where(eq(tournaments.id, id));
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
      completedAt: tournamentMatches.completedAt,
      notes: tournamentMatches.notes,
      bracketPosition: tournamentMatches.bracketPosition,
      team1Name: team1.name,
      team2Name: team2.name,
    })
    .from(tournamentMatches)
    .leftJoin(team1, eq(tournamentMatches.team1Id, team1.id))
    .leftJoin(team2, eq(tournamentMatches.team2Id, team2.id))
    .where(eq(tournamentMatches.tournamentId, tournamentId))
    .orderBy(tournamentMatches.round, tournamentMatches.matchNumber);
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

export async function generateBracket(tournamentId: number, approvedTeamIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Clear existing matches
  await db.delete(tournamentMatches).where(eq(tournamentMatches.tournamentId, tournamentId));

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const shuffled = [...approvedTeamIds].sort(() => Math.random() - 0.5);
  const matchesToInsert: typeof tournamentMatches.$inferInsert[] = [];

  if (tournament.bracketType === "single_elimination") {
    const rounds = Math.ceil(Math.log2(shuffled.length));
    let matchNum = 1;
    for (let i = 0; i < shuffled.length; i += 2) {
      matchesToInsert.push({
        tournamentId,
        round: 1,
        matchNumber: matchNum++,
        team1Id: shuffled[i],
        team2Id: shuffled[i + 1] ?? null,
        status: "pending",
        bracketPosition: { round: 1, position: Math.ceil(matchNum / 2) },
      });
    }
    // Create placeholder matches for subsequent rounds
    for (let r = 2; r <= rounds; r++) {
      const prevRoundMatches = matchesToInsert.filter((m) => m.round === r - 1).length;
      for (let p = 0; p < Math.ceil(prevRoundMatches / 2); p++) {
        matchesToInsert.push({
          tournamentId,
          round: r,
          matchNumber: matchNum++,
          status: "pending",
          bracketPosition: { round: r, position: p + 1 },
        });
      }
    }
  } else if (tournament.bracketType === "groups") {
    // Simple groups: all vs all in round 1
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
  } else {
    // double_elimination - simplified: same as single for now
    let matchNum = 1;
    for (let i = 0; i < shuffled.length; i += 2) {
      matchesToInsert.push({
        tournamentId,
        round: 1,
        matchNumber: matchNum++,
        team1Id: shuffled[i],
        team2Id: shuffled[i + 1] ?? null,
        status: "pending",
        bracketPosition: { round: 1, position: Math.ceil(matchNum / 2) },
      });
    }
  }

  if (matchesToInsert.length > 0) {
    await db.insert(tournamentMatches).values(matchesToInsert);
  }

  return matchesToInsert.length;
}
