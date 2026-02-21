import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
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
  const { status, streamPlatform, ...rest } = data;
  const [result] = await db.insert(tournaments).values({
    ...rest,
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
  game?: string;
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

// ─── Games ────────────────────────────────────────────────────────────────────
export async function getGames() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(games).where(eq(games.isActive, true)).orderBy(games.name);
}

export async function getGameBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(games).where(eq(games.slug, slug)).limit(1);
  return result[0];
}

export async function upsertGame(data: InsertGame) {
  const db = await getDb();
  if (!db) return;
  await db.insert(games).values(data).onDuplicateKeyUpdate({ set: { ...data } });
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
export async function getTeamRanking(opts?: { game?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.game) conditions.push(eq(teams.game, opts.game));
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
  country?: string;
  profileType?: "player" | "team_captain" | "event_creator";
  socialDiscord?: string;
  socialTwitch?: string;
  socialTwitter?: string;
  avatar?: string;
  bannerUrl?: string;
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

  // Get current balance
  const current = await getUserBalance(data.userId);
  const newBalance = current + data.amount;
  if (newBalance < 0) throw new Error("Saldo insuficiente");

  // Update user balance
  await db.update(users).set({ rlcBalance: newBalance }).where(eq(users.id, data.userId));

  // Record transaction
  await db.insert(rlcTransactions).values({
    userId: data.userId,
    type: data.type,
    amount: data.amount,
    balanceAfter: newBalance,
    description: data.description,
    referenceId: data.referenceId,
  });

  return newBalance;
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
  return db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt));
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
  country: string;
  socialDiscord: string;
  socialTwitch: string;
  socialTwitter: string;
}>) {
  const db = await getDb();
  if (!db) return;
  await db.update(teams).set(data).where(eq(teams.id, teamId));
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

export async function buyShopItem(userId: number, itemId: number, quantity: number, userNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const item = await getShopItemById(itemId);
  if (!item) throw new Error("Producto no encontrado");
  if (!item.isActive) throw new Error("Producto no disponible");
  if (item.stock !== -1 && item.stock < quantity) throw new Error("Stock insuficiente");

  const totalPrice = item.price * quantity;

  // Check user balance
  const userRows = await db.select({ rlcBalance: users.rlcBalance }).from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user || user.rlcBalance < totalPrice) throw new Error("Saldo RLC insuficiente");

  // Deduct balance
  const newBalance = user.rlcBalance - totalPrice;
  await db.update(users).set({ rlcBalance: newBalance }).where(eq(users.id, userId));

  // Record transaction
  await db.insert(rlcTransactions).values({
    userId,
    type: "withdrawal",
    amount: -totalPrice,
    balanceAfter: newBalance,
    description: `Compra: ${item.name} x${quantity}`,
    referenceId: itemId,
  });

  // Reduce stock if limited
  if (item.stock !== -1) {
    await db.update(shopItems).set({ stock: item.stock - quantity }).where(eq(shopItems.id, itemId));
  }

  // Create order
  const [order] = await db.insert(shopOrders).values({
    userId,
    itemId,
    quantity,
    totalPrice,
    status: "pending",
    userNote: userNote ?? null,
  });

  return { orderId: (order as { insertId: number }).insertId, totalPrice, newBalance };
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
      userName: users.name,
      userNickname: users.nickname,
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
  const conditions = [eq(cosmetics.isActive, true)];
  if (type && type !== "all") {
    conditions.push(eq(cosmetics.type, type as "frame" | "aura" | "badge" | "background"));
  }
  if (collection) {
    conditions.push(eq(cosmetics.collection, collection));
  }
  return db.select().from(cosmetics).where(and(...conditions)).orderBy(cosmetics.sortOrder, desc(cosmetics.createdAt));
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

  // Check balance
  const userRows = await db.select({ rlcBalance: users.rlcBalance }).from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user || user.rlcBalance < cosmetic.price) throw new Error("Saldo RLC insuficiente");

  const newBalance = user.rlcBalance - cosmetic.price;
  await db.update(users).set({ rlcBalance: newBalance }).where(eq(users.id, userId));

  await db.insert(rlcTransactions).values({
    userId,
    type: "withdrawal",
    amount: -cosmetic.price,
    balanceAfter: newBalance,
    description: `Cosmético: ${cosmetic.name}`,
    referenceId: cosmeticId,
  });

  await db.insert(userCosmetics).values({ userId, cosmeticId, isEquipped: false });

  return { newBalance };
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

  // Anti-spam: check daily limit
  const maxPerDay = task.maxClaimsPerDay ?? 1;
  if (maxPerDay > 0) {
    const todayClaims = await getUserClaimsToday(userId, taskId);
    if (todayClaims >= maxPerDay) throw new Error("Ya alcanzaste el límite diario de esta tarea");
  }
  // Check total limit
  const maxPerUser = task.maxClaimsPerUser ?? 1;
  if (maxPerUser > 0) {
    const totalClaims = await getTotalUserClaims(userId, taskId);
     if (totalClaims >= maxPerUser) throw new Error("Ya completaste esta tarea el máximo de veces");
  }
  // Credit coins
  const userRows = await db.select({ rlcBalance: users.rlcBalance }).from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user) throw new Error("Usuario no encontrado");

  const newBalance = user.rlcBalance + task.reward;
  await db.update(users).set({ rlcBalance: newBalance }).where(eq(users.id, userId));

  await db.insert(rlcTransactions).values({
    userId,
    type: "reward",
    amount: task.reward,
    balanceAfter: newBalance,
    description: `Recompensa: ${task.title}`,
    referenceId: taskId,
  });

  await db.insert(userRewardClaims).values({ userId, taskId });

  return { reward: task.reward, newBalance };
}

// ─── Brand Ads ─────────────────────────────────────────────────────────────────
export async function getBrandAds(onlyActive = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = onlyActive ? [eq(brandAds.isActive, true)] : [];
  return db.select().from(brandAds)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(brandAds.isFeatured), desc(brandAds.isPremium), desc(brandAds.createdAt));
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
      bio: users.bio,
      role: users.role,
      profileType: users.profileType,
      mainGame: users.mainGame,
      country: users.country,
      socialDiscord: users.socialDiscord,
      socialTwitch: users.socialTwitch,
      socialTwitter: users.socialTwitter,
      rlcBalance: users.rlcBalance,
      createdAt: users.createdAt,
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

export async function adminUpdateUserRole(userId: number, role: "user" | "premium" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
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
export async function adminCreateShopItem(data: InsertShopItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(shopItems).values(data);
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
      createdAt: shopOrders.createdAt,
      userName: users.name,
      userEmail: users.email,
      userNickname: users.nickname,
      itemName: shopItems.name,
    })
    .from(shopOrders)
    .innerJoin(users, eq(shopOrders.userId, users.id))
    .innerJoin(shopItems, eq(shopOrders.itemId, shopItems.id))
    .orderBy(desc(shopOrders.createdAt));
}

export async function adminUpdateOrderStatus(orderId: number, status: "pending" | "delivered" | "cancelled", note?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(shopOrders).set({ status, deliveryNote: note ?? null }).where(eq(shopOrders.id, orderId));
}

// ─── Admin: Cosmetics ─────────────────────────────────────────────────────────
export async function adminCreateCosmetic(data: InsertCosmetic) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(cosmetics).values(data);
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
  await db.update(news).set(data).where(eq(news.id, id));
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
  const conditions = [];
  if (search) {
    conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.nickname, `%${search}%`)
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
    })
    .from(users)
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
  if (existing.length > 0) return; // already following
  await db.insert(userFollows).values({ followerId, followingId });
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
  return db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      profileType: users.profileType,
    })
    .from(userFollows)
    .innerJoin(users, eq(userFollows.followerId, users.id))
    .where(eq(userFollows.followingId, userId))
    .orderBy(desc(userFollows.createdAt));
}

export async function getFollowing(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      profileType: users.profileType,
    })
    .from(userFollows)
    .innerJoin(users, eq(userFollows.followingId, users.id))
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
    })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
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
    })
    .from(contentCreators)
    .innerJoin(users, eq(contentCreators.userId, users.id))
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
  return db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

export async function getSuggestedUsers(currentUserId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  // Return recent users excluding the current user
  return db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(sql`${users.id} != ${currentUserId}`)
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

export async function getFeaturedTournaments(limit = 6) {
  const db = await getDb();
  if (!db) return [];
  return db
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
    })
    .from(tournaments)
    .where(and(
      eq(tournaments.isPublic, true),
      sql`${tournaments.status} IN ('registration_open', 'in_progress', 'upcoming')`
    ))
    .orderBy(desc(tournaments.isFeatured), desc(tournaments.createdAt))
    .limit(limit);
}

// ─── Search users by nickname ─────────────────────────────────────────────────
export async function searchUsersByNickname(query: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      nickname: users.nickname,
      avatar: users.avatar,
      mainGame: users.mainGame,
      country: users.country,
      profileType: users.profileType,
    })
    .from(users)
    .where(
      sql`(${users.nickname} LIKE ${`%${query}%`} OR ${users.name} LIKE ${`%${query}%`})`
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
