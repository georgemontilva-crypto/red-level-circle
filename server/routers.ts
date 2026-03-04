import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addRlcTransaction,
  addTeamAchievement,
  addTeamMember,
  approveTournament,
  countPendingRegistrations,
  createBet,
  createNews,
  createRegistration,
  createStream,
  getStreamsByGame,
  createTeam,
  createTournament,
  generateBracket,
  getActivePromotions,
  getAllUsers,
  getBetsByTournament,
  getBetsByUser,
  adminListBets,
  cancelBetById,
  getBetStatsByUser,
  getGames,
  getMatchesByTournament,
  getNews,
  getNewsById,
  getNewsBySlug,
  getPendingTournaments,
  getRegistrationAuditLog,
  getRegistrationById,
  getRegistrationsByTeam,
  getRegistrationsByTournament,
  getRlcTransactions,
  getStreams,
  getTeamAchievements,
  getTeamById,
  getTeamMembers,
  getTeamRanking,
  getTeamTournamentHistory,
  getRankingHighlights,
  getGameStrength,
  getTeamTournamentPositions,
  getUpcomingMatchesByTournament,
  getActiveTournamentsByGame,
  getTeamRankingByTournament,
  getTeamsByUser,
  getTournamentById,
  getTournaments,
  getUserBalance,
  getUserById,
  incrementNewsViews,
  rejectTournament,
  resolveBets,
  updateMatchResult,
  updateNews,
  updateRegistrationStatus,
  updateStream,
  updateTeam,
  updateTeamStats,
  updateTournament,
  updateTournamentStatus,
  updateUserProfile,
  updateUserRole,
  upsertGame,
  deleteGame,
  auditGameSlugConsistency,
  updateGamesSortOrder,
  getGameBySlug,
  countAssociatedByGameSlug,
  createPromotion,
  getShopItems,
  getShopItemById,
  createShopItem,
  buyShopItem,
  getShopOrders,
  updateOrderStatus,
  getCosmetics,
  getUserCosmetics,
  buyCosmetic,
  equipCosmetic,
  getRewardTasks,
  claimReward,
  getBrandAds,
  trackAdClick,
  trackAdImpression,
  createBrandAd,
  getUserPublicProfile,
  getUserEquippedCosmetics,
  adminListUsers,
  getTeamPublicProfile,
  getTeamRankPosition,
  updateTeamImages,
  getAdminStats,
  adminListTeams,
  adminVerifyTeam,
  adminListTournaments,
  adminUpdateUserRole,
  adminUpdateBannerPermission,
  adminUpdateVerified,
  adminAdjustRLC,
  adminCreateShopItem,
  adminUpdateShopItem,
  adminDeleteShopItem,
  adminListOrders,
  adminUpdateOrderStatus,
  adminCreateCosmetic,
  adminUpdateCosmetic,
  adminDeleteCosmetic,
  adminListBrandAds,
  adminUpdateBrandAd,
  adminDeleteBrandAd,
  adminListRewardTasks,
  adminCreateRewardTask,
  adminUpdateRewardTask,
  adminDeleteRewardTask,
  adminCreateNews,
  adminUpdateNews,
  adminDeleteNews,
  adminListNews,
  adminListPendingTournaments,
  adminApproveTournament,
  adminRejectTournament,
  listPublicUsers,
  followUser,
  unfollowUser,
  isFollowing,
  getFollowerCount,
  getFollowingCount,
  getFollowers,
  getFollowing,
  applyAsCreator,
  getCreatorByUserId,
  listApprovedCreators,
  listPendingCreators,
  reviewCreator,
  getRecentUsers,
  getSuggestedUsers,
  getFeaturedTournaments,
  searchUsersByNickname,
  removeTeamMember,
  getTeamsByMembership,
  hasApprovedTeamMembership,
  getActiveStreamByUser,
  createCreatorStream,
  stopCreatorStream,
  getStreamHistoryByUser,
  advanceRoundIfComplete,
  updateTeamMatchStats,
  getTournamentRegisteredTeams,
  getTournamentResults,
  transferCaptaincy,
  dissolveTeam,
  deleteTournament,
  getTeamMemberCount,
  scheduleMatch,
  getOpenBetMatches,
  getBetsByMatch,
  resolveMatchBets,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  requestVerification,
  getMyVerificationRequest,
  listVerificationRequests,
  reviewVerificationRequest,
} from "./db";
import { storagePut } from "./storage";
import { generateRosterCard } from "./rosterCard";
import { getDb } from "./db";
import { eq, inArray, sql, and, isNotNull } from "drizzle-orm";
import { sectionBanners, tournaments, teams, users, streams, tournamentMatches } from "../drizzle/schema";
import { getUserNotifications, getUnreadCount, markAllRead, markOneRead, createNotification } from "./notifications";
import { eventBus } from "./eventBus";
import {
  createMatchSeries,
  getSeriesWithMaps,
  getSeriesById,
  reportMapResult,
  isSeriesBettingOpen,
  addToSeriesEscrow,
  resolveSeriesBets,
  refundSeriesBets,
} from "./db.series";
import {
  submitMapResult as orchestratorSubmitMapResult,
  scheduleMatchBettingWindow,
  syncTournamentRankings,
} from "./orchestrator";
import { withCache, cache, CacheKey, TTL } from "./cache";


// ─── Guards ───────────────────────────────────────────────────────────────────
// Helper: checks if a role has admin-level privileges (admin or super_admin)
const isAdmin = (role: string) => role === "admin" || role === "super_admin";

const premiumProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "premium" && !isAdmin(ctx.user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Esta funcionalidad requiere una cuenta Premium.",
    });
  }
  return next({ ctx });
});

// creatorProcedure: requires an approved content_creator record for the user
const creatorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const creator = await getCreatorByUserId(ctx.user.id);
  if (!creator || creator.status !== "approved") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Solo creadores de contenido aprobados pueden iniciar transmisiones.",
    });
  }
  return next({ ctx });
});
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isAdmin(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores." });
  }
  return next({ ctx });
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    upgradeToPremiun: protectedProcedure.mutation(async ({ ctx }) => {
      const UPGRADE_COST = 500;
      // Verificar saldo suficiente
      const balance = await getUserBalance(ctx.user.id);
      if ((balance ?? 0) < UPGRADE_COST) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Saldo insuficiente. Necesitas ${UPGRADE_COST} RLC Coins para mejorar tu plan. Tienes ${balance ?? 0} RLC.`,
        });
      }
      // Verificar que no sea ya premium
      const user = await getUserById(ctx.user.id);
      if (user?.role === "premium" || user?.role === "admin" || user?.role === "super_admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ya tienes una cuenta Premium." });
      }
      // Descontar 500 RLC y registrar transacción
      await addRlcTransaction({
        userId: ctx.user.id,
        amount: -UPGRADE_COST,
        type: "withdrawal",
        description: "Mejora de plan a Premium",
      });
      // Actualizar rol
      await updateUserRole(ctx.user.id, "premium");
      return { success: true };
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        nickname: z.string().max(64).optional(),
        bio: z.string().max(500).optional(),
        mainGame: z.string().max(64).optional(),
        gameRole: z.string().max(64).optional(),
        elo: z.string().max(64).optional(),
        competitiveRegion: z.string().max(32).optional(),
        country: z.string().max(64).optional(),
        profileType: z.enum(["player", "team_captain", "event_creator"]).optional(),
        socialDiscord: z.string().max(128).optional(),
        socialTwitch: z.string().max(128).optional(),
        socialTwitter: z.string().max(128).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    profile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await getUserById(input.userId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        // Return public profile (no sensitive fields)
        const { openId, loginMethod, ...publicProfile } = user;
        return publicProfile;
      }),
    wallet: protectedProcedure.query(async ({ ctx }) => {
      const balance = await getUserBalance(ctx.user.id);
      const transactions = await getRlcTransactions(ctx.user.id);
      return { balance, transactions };
    }),
  }),

  // ─── Tournaments ───────────────────────────────────────────────────────────
  tournaments: router({
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        gameSlug: z.string().optional(),   // slug canónico (Fase 5a: única fuente de verdad)
        search: z.string().optional(),
        featured: z.boolean().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        // Solo torneos aprobados son visibles públicamente
        const publicStatuses = ["registration_open", "registration_closed", "in_progress", "completed"];
        const status = input?.status && publicStatuses.includes(input.status) ? input.status : undefined;
        // Caché de 30s — la lista de torneos cambia poco y es muy consultada
        const cacheKey = CacheKey.tournamentsList() + `:${status ?? "all"}:${input?.gameSlug ?? ""}:${input?.search ?? ""}`;
        return withCache(cacheKey, TTL.TOURNAMENTS_LIST, () =>
          getTournaments({ status, gameSlug: input?.gameSlug, search: input?.search, isPublic: true, publicOnly: true })
        );
      }),

    myTournaments: premiumProcedure.query(async ({ ctx }) => {
      return getTournaments({ creatorId: ctx.user.id });
    }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // Caché de 10s — el detalle del torneo es muy consultado durante el evento
        const t = await withCache(
          CacheKey.tournament(input.id),
          TTL.TOURNAMENT,
          () => getTournamentById(input.id)
        );
        if (!t) throw new TRPCError({ code: "NOT_FOUND", message: "Torneo no encontrado." });
        return t;
      }),

    create: premiumProcedure
      .input(z.object({
        name: z.string().min(3).max(256),
        game: z.string().min(1).max(64),
        description: z.string().optional(),
        rules: z.string().optional(),
        bracketType: z.enum(["single_elimination", "double_elimination", "groups"]),
        registrationType: z.enum(["team", "player", "both"]).default("team"),
        maxTeams: z.number().int().min(2).max(256).default(16),
        minPlayersPerTeam: z.number().int().min(1).max(20).default(1),
        maxPlayersPerTeam: z.number().int().min(1).max(20).default(5),
        prizeDescription: z.string().optional(),
        prizeFirst: z.string().optional(),
        prizeSecond: z.string().optional(),
        prizeThird: z.string().optional(),
        prizeAmount: z.number().int().min(0).default(0),
        registrationStart: z.number().optional(),
        registrationEnd: z.number().optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        isPublic: z.boolean().default(true),
        banner: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        streamUrl: z.string().optional(),
        streamPlatform: z.enum(["twitch", "youtube", "discord", "other"]).optional(),
        defaultSeriesFormat: z.enum(["BO1", "BO2", "BO3", "BO5", "BO7"]).default("BO1"),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createTournament({
          ...input,
          creatorId: ctx.user.id,
          status: "pending_approval",
          registrationStart: input.registrationStart ? new Date(input.registrationStart) : undefined,
          registrationEnd: input.registrationEnd ? new Date(input.registrationEnd) : undefined,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        });
        // Generate news article for new tournament (non-blocking)
        const { handleTournamentCreated } = await import("./newsGenerator");
        handleTournamentCreated(id).catch((err: Error) =>
          console.error("[NewsGenerator] Error generating tournament news:", err)
        );
        return { id };
      }),

    update: premiumProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(3).max(256).optional(),
        game: z.string().optional(),
        description: z.string().optional(),
        rules: z.string().optional(),
        bracketType: z.enum(["single_elimination", "double_elimination", "groups"]).optional(),
        maxTeams: z.number().int().min(2).max(256).optional(),
        minPlayersPerTeam: z.number().int().min(1).max(20).optional(),
        maxPlayersPerTeam: z.number().int().min(1).max(20).optional(),
        prizeDescription: z.string().optional(),
        prizeFirst: z.string().optional(),
        prizeSecond: z.string().optional(),
        prizeThird: z.string().optional(),
        prizeAmount: z.number().int().min(0).optional(),
        registrationStart: z.number().optional(),
        registrationEnd: z.number().optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        isPublic: z.boolean().optional(),
        banner: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        streamUrl: z.string().optional(),
        streamPlatform: z.enum(["twitch", "youtube", "discord", "other"]).optional(),
        isLive: z.boolean().optional(),
        defaultSeriesFormat: z.enum(["BO1", "BO2", "BO3", "BO5", "BO7"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.id);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { id, registrationStart, registrationEnd, startDate, endDate, ...rest } = input;
        await updateTournament(id, {
          ...rest,
          registrationStart: registrationStart ? new Date(registrationStart) : undefined,
          registrationEnd: registrationEnd ? new Date(registrationEnd) : undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        });
        return { success: true };
      }),

    updateStatus: premiumProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "pending_approval", "registration_open", "registration_closed", "in_progress", "completed", "cancelled"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.id);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateTournamentStatus(input.id, input.status);
        // Notify registered teams about status change
        try {
          eventBus.emit("tournament.status_changed", {
            tournamentId: input.id,
            newStatus: input.status,
            tournamentName: t.name,
          });
        } catch (e) { console.error("[StatusChange] Notification error:", e); }
        return { success: true };
      }),

    delete: premiumProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.id);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        // Only the creator or an admin can delete
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        // Block deletion of active/completed tournaments
        const blockedStatuses = ["in_progress", "completed"];
        if (blockedStatuses.includes(t.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No se puede eliminar un torneo que está en curso o finalizado.",
          });
        }
        await deleteTournament(input.id);
        return { success: true };
      }),

    startTournament: premiumProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.id);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const registrations = await getRegistrationsByTournament(input.id, "Aprobado");
        if (registrations.length < 2) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Se necesitan al menos 2 equipos aprobados." });
        }
        const teamIds = registrations.map((r) => r.teamId);
        await generateBracket(input.id, teamIds);
        await updateTournamentStatus(input.id, "in_progress");
        // Notify all registered teams that tournament has started
        try {
          eventBus.emit("tournament.status_changed", { tournamentId: input.id, newStatus: "in_progress", tournamentName: t.name });
          eventBus.emit("tournament.brackets_generated", { tournamentId: input.id });
        } catch (e) { console.error("[StartTournament] Notification error:", e); }
        return { success: true, matchCount: teamIds.length };
      }),

    declareWinner: premiumProcedure
      .input(z.object({ tournamentId: z.number(), winnerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateTournament(input.tournamentId, { winnerId: input.winnerId, status: "completed" });
        // Update team stats
        const registrations = await getRegistrationsByTournament(input.tournamentId, "Aprobado");
        for (const reg of registrations) {
          await updateTeamStats(reg.teamId, reg.teamId === input.winnerId);
        }
        // Add achievement to winner
        await addTeamAchievement({ teamId: input.winnerId, title: `Campeón: ${t.name}`, tournamentId: input.tournamentId });
        // Resolve bets
        await resolveBets(input.tournamentId, input.winnerId);
        return { success: true };
      }),

    registeredTeams: publicProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return getTournamentRegisteredTeams(input.tournamentId);
      }),
  }),
  // ─── Teams ──────────────────────────────────────────────────────────────────
  teams: router({
    list: publicProcedure
      .input(z.object({
        gameSlug: z.string().optional(),  // slug canónico (Fase 5a)
        search: z.string().optional()
      }).optional())
      .query(async ({ input }) => {
        return getTeamRanking({ gameSlug: input?.gameSlug });
      }),

    myTeams: protectedProcedure.query(async ({ ctx }) => {
      return getTeamsByUser(ctx.user.id);
    }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const team = await getTeamById(input.id);
        if (!team) throw new TRPCError({ code: "NOT_FOUND" });
        const members = await getTeamMembers(input.id);
        const achievements = await getTeamAchievements(input.id);
        const registrations = await getRegistrationsByTeam(input.id);
        return { ...team, members, achievements, registrations };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(128),
        tag: z.string().max(8).optional(),
        description: z.string().optional(),
        game: z.string().optional(),
        country: z.string().optional(),
        logo: z.string().optional(),
        banner: z.string().optional(),
        socialDiscord: z.string().optional(),
        socialTwitch: z.string().optional(),
        socialTwitter: z.string().optional(),
      }))
       .mutation(async ({ ctx, input }) => {
        // Verificar que el usuario no sea ya capitán de otro equipo
        const db = await getDb();
        if (db) {
          const existingTeam = await db
            .select({ id: teams.id, name: teams.name })
            .from(teams)
            .where(eq(teams.captainId, ctx.user.id))
            .limit(1);
          if (existingTeam.length > 0) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Ya eres capitán del equipo "${existingTeam[0].name}". Solo puedes ser capitán de un equipo a la vez.`,
            });
          }
        }
        const id = await createTeam({ ...input, captainId: ctx.user.id });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(2).max(128).optional(),
        tag: z.string().max(8).optional(),
        description: z.string().optional(),
        game: z.string().optional(),
        country: z.string().optional(),
        logo: z.string().optional(),
        banner: z.string().optional(),
        socialDiscord: z.string().optional(),
        socialTwitch: z.string().optional(),
        socialTwitter: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const team = await getTeamById(input.id);
        if (!team) throw new TRPCError({ code: "NOT_FOUND" });
        if (team.captainId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { id, ...data } = input;
        await updateTeam(id, data);
        return { success: true };
      }),

    addMember: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        userId: z.number(),
        role: z.enum(["captain", "player", "substitute", "coach"]).default("player"),
        gameId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND" });
        if (team.captainId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        // Enforce 10-member limit
        const currentCount = await getTeamMemberCount(input.teamId);
        if (currentCount >= 10) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "El equipo ha alcanzado el límite máximo de 10 miembros." });
        }
        await addTeamMember(input);
        return { success: true };
      }),

    ranking: publicProcedure
      .input(z.object({
        gameSlug: z.string().optional(),  // slug canónico (Fase 5a)
        limit: z.number().optional()
      }).optional())
      .query(async ({ input }) => {
        return getTeamRanking({ gameSlug: input?.gameSlug, limit: input?.limit ?? 50 });
      }),

    searchUsers: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return searchUsersByNickname(input.query, 10);
      }),

    removeMember: protectedProcedure
      .input(z.object({ teamId: z.number(), memberId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND" });
        if (team.captainId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Solo el capitán puede eliminar miembros." });
        }
        await removeTeamMember(input.teamId, input.memberId);
        return { success: true };
      }),

    transferCaptaincy: protectedProcedure
      .input(z.object({ teamId: z.number(), newCaptainUserId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND" });
        if (team.captainId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Solo el capitán puede transferir la capitanía." });
        }
        if (input.newCaptainUserId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ya eres el capitán del equipo." });
        }
        // Verify the new captain is a member of the team
        const members = await getTeamMembers(input.teamId);
        const isMember = members.some((m) => m.userId === input.newCaptainUserId);
        if (!isMember) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "El usuario debe ser miembro del equipo." });
        }
        await transferCaptaincy(input.teamId, input.newCaptainUserId);
        return { success: true };
      }),

    dissolve: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND" });
        if (team.captainId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Solo el capitán puede disolver el equipo." });
        }
        await dissolveTeam(input.teamId);
        return { success: true };
      }),

    memberCount: publicProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        const count = await getTeamMemberCount(input.teamId);
        return { count };
      }),

    myMemberships: protectedProcedure.query(async ({ ctx }) => {
      return getTeamsByMembership(ctx.user.id);
    }),

    membershipOf: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return getTeamsByMembership(input.userId);
      }),

    publicProfile: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const profile = await getTeamPublicProfile(input.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Equipo no encontrado" });
        return profile;
      }),
    rankPosition: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getTeamRankPosition(input.id);
      }),

    uploadImage: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        base64: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml", "image/bmp", "image/tiff"]),
        type: z.enum(["logo", "banner"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND" });
        if (team.captainId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const ext = input.mimeType.split("/")[1];
        const key = `teams/${input.teamId}/${input.type}-${Date.now()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        await updateTeamImages(input.teamId, input.type === "logo" ? { logo: url } : { banner: url });
        return { url };
      }),
  }),

  // ─── Registrations ─────────────────────────────────────────────────────────
  registrations: router({
    byTournament: premiumProcedure
      .input(z.object({ tournamentId: z.number(), status: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getRegistrationsByTournament(input.tournamentId, input.status);
      }),

    myRegistrations: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND" });
        if (team.captainId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getRegistrationsByTeam(input.teamId);
      }),

    register: protectedProcedure
      .input(z.object({
        tournamentId: z.number(),
        teamId: z.number(),
        teamMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.status !== "registration_open") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Las inscripciones no están abiertas." });
        }
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Equipo no encontrado." });
        if (team.captainId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Solo el capitán puede inscribir el equipo." });
        }
        const members = await getTeamMembers(input.teamId);
        if (members.length < t.minPlayersPerTeam) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `El equipo necesita al menos ${t.minPlayersPerTeam} jugador(es).` });
        }
         const id = await createRegistration(input);
        // Notify tournament organizer (in-app) and platform owner
        try {
          const { createNotification } = await import("./notifications");
          const { notifyOwner } = await import("./_core/notification");
          const inscribedName = ctx.user.nickname ?? ctx.user.name ?? `Usuario #${ctx.user.id}`;
          const tournamentUrl = `/tournaments/${input.tournamentId}`;
          // In-app notification to the tournament creator
          await createNotification({
            userId: t.creatorId,
            type: "general",
            title: "Nueva solicitud de inscripción",
            message: `${inscribedName} ha solicitado inscribir el equipo "${team.name}" en tu torneo "${t.name}".`,
            link: tournamentUrl,
            referenceId: input.tournamentId,
            referenceType: "tournament",
          });
          // Platform owner alert via Manus notification service
          await notifyOwner({
            title: `Nueva inscripción: ${t.name}`,
            content: `${inscribedName} (equipo: ${team.name}) se ha inscrito en el torneo "${t.name}". Ver: ${tournamentUrl}`,
          });
        } catch (e) {
          // Non-critical: log but don't fail the registration
          console.error("[Registration] Failed to send notifications:", e);
        }
        // Auto-generate brackets if tournament is now fulll
        try {
          const approvedRegs = await getRegistrationsByTournament(input.tournamentId, "Aprobado");
          if (t.maxTeams && approvedRegs.length >= t.maxTeams) {
            // Generate brackets automatically
            const teamIds = approvedRegs.map((r) => r.teamId);
            await generateBracket(input.tournamentId, teamIds);
            await updateTournamentStatus(input.tournamentId, "in_progress");
            // Emit events
            eventBus.emit("tournament.full", { tournamentId: input.tournamentId });
            eventBus.emit("tournament.brackets_generated", { tournamentId: input.tournamentId });
          }
        } catch (e) {
          // Non-critical: log but don't fail the registration
          console.error("[AutoBracket] Failed to auto-generate brackets:", e);
        }

        return { id };
      }),
    updateStatus: premiumProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["Aprobado", "Rechazado", "Cancelado"]),
        creatorMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const reg = await getRegistrationById(input.id);
        if (!reg) throw new TRPCError({ code: "NOT_FOUND" });
        const t = await getTournamentById(reg.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateRegistrationStatus(input.id, input.status, ctx.user.id, input.creatorMessage);
        // Notify team captain about registration decision
        try {
          const team = await getTeamById(reg.teamId);
          if (team?.captainId) {
            if (input.status === "Aprobado") {
              eventBus.emit("registration.approved", {
                registrationId: input.id,
                teamId: reg.teamId,
                tournamentId: reg.tournamentId,
                tournamentName: t.name,
                teamCaptainId: team.captainId,
                teamName: team.name,
              });
            } else if (input.status === "Rechazado") {
              eventBus.emit("registration.rejected", {
                registrationId: input.id,
                teamId: reg.teamId,
                tournamentId: reg.tournamentId,
                tournamentName: t.name,
                teamCaptainId: team.captainId,
                teamName: team.name,
                reason: input.creatorMessage,
              });
            }
          }
        } catch (e) { console.error("[RegistrationStatus] Notification error:", e); }
        return { success: true };
      }),
    auditLog: premiumProcedure
      .input(z.object({ registrationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const reg = await getRegistrationById(input.registrationId);
        if (!reg) throw new TRPCError({ code: "NOT_FOUND" });
        const t = await getTournamentById(reg.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getRegistrationAuditLog(input.registrationId);
      }),

    pendingCount: premiumProcedure.query(async ({ ctx }) => {
      return countPendingRegistrations(ctx.user.id);
    }),
  }),

  // ─── Matches ───────────────────────────────────────────────────────────────
  matches: router({
    byTournament: publicProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        // Caché de 5s — el bracket es la query más consultada durante el torneo.
        // Con 1.000 usuarios haciendo polling cada 10s = 100 req/s → 1 query cada 5s.
        return withCache(
          CacheKey.bracket(input.tournamentId),
          TTL.BRACKET,
          () => getMatchesByTournament(input.tournamentId)
        );
      }),

    updateResult: premiumProcedure
      .input(z.object({
        matchId: z.number(),
        tournamentId: z.number(),
        team1Score: z.number().int().min(0),
        team2Score: z.number().int().min(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        // Fetch match to get team IDs for auto-calculating winner
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [existingMatch] = await db
          .select()
          .from(tournamentMatches)
          .where(eq(tournamentMatches.id, input.matchId))
          .limit(1);
        if (!existingMatch) throw new TRPCError({ code: "NOT_FOUND", message: "Partida no encontrada" });
        if (!existingMatch.team1Id || !existingMatch.team2Id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "La partida no tiene dos equipos asignados" });
        }
        if (input.team1Score === input.team2Score) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "El marcador no puede ser empate. Ingresa scores diferentes." });
        }
        const winnerId = input.team1Score > input.team2Score ? existingMatch.team1Id : existingMatch.team2Id;
        const { matchId, tournamentId, ...scores } = input;
        await updateMatchResult(matchId, { ...scores, winnerId });
        // Update team match stats and advance round
        try {
          const db = await getDb();
          if (db) {
            const [match] = await db
              .select()
              .from(tournamentMatches)
              .where(eq(tournamentMatches.id, matchId))
              .limit(1);
            if (match) {
              const loserId = match.team1Id === winnerId ? match.team2Id : match.team1Id;
              if (loserId) {
                // Update wins/losses for both teams
                await updateTeamMatchStats(winnerId, loserId);
                eventBus.emit("tournament.match_finished", { matchId, tournamentId, winnerId, loserId });
              }
              // Auto-advance to next round if all matches in this round are done
              const roundBefore = match.round ?? 1;
              await advanceRoundIfComplete(tournamentId, roundBefore);
              // Notify organizer if the round is now complete
              try {
                const { createNotification } = await import("./notifications");
                const allRoundMatches = await db
                  .select({ status: tournamentMatches.status, winnerId: tournamentMatches.winnerId })
                  .from(tournamentMatches)
                  .where(and(eq(tournamentMatches.tournamentId, tournamentId), eq(tournamentMatches.round, roundBefore)));
                const roundComplete = allRoundMatches.length > 0 && allRoundMatches.every((m) => m.status === "completed" && m.winnerId !== null);
                if (roundComplete) {
                  const tournament = await getTournamentById(tournamentId);
                  if (tournament?.creatorId) {
                    // Check if notification already sent for this round (avoid duplicates)
                    const { notifications: notifTable } = await import("../drizzle/schema");
                    const existing = await db
                      .select({ id: notifTable.id })
                      .from(notifTable)
                      .where(and(
                        eq(notifTable.userId, tournament.creatorId),
                        eq(notifTable.referenceId, tournamentId),
                        eq(notifTable.referenceType, `round_${roundBefore}_complete`)
                      ))
                      .limit(1);
                    if (existing.length === 0) {
                      await createNotification({
                        userId: tournament.creatorId,
                        type: "bracket_ready",
                        title: `Ronda ${roundBefore} completada`,
                        message: `Todos los partidos de la Ronda ${roundBefore} en "${tournament.name}" han finalizado. La siguiente ronda está lista.`,
                        link: `/tournaments/${tournamentId}`,
                        referenceId: tournamentId,
                        referenceType: `round_${roundBefore}_complete`,
                      });
                    }
                  }
                }
              } catch (notifErr) { console.error("[RoundNotif] Error:", notifErr); }
            }
          }
        } catch (e) { console.error("[MatchResult] Notification error:", e); }
        // Invalidar caché del bracket para que el LiveBracket vea el resultado inmediatamente
        cache.del(CacheKey.bracket(input.tournamentId));
        cache.del(CacheKey.tournament(input.tournamentId));
        return { success: true };
      }),

    generateBracketManual: protectedProcedure
      .input(z.object({ tournamentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const registrations = await getRegistrationsByTournament(input.tournamentId, "Aprobado");
        if (registrations.length < 2) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Se necesitan al menos 2 equipos aprobados para generar el bracket." });
        }
        const teamIds = registrations.map((r) => r.teamId);
        const matchCount = await generateBracket(input.tournamentId, teamIds);
        return { success: true, matchCount };
      }),
    // Asignar fecha/hora y cierre de apuestas a un partido
    schedule: premiumProcedure
      .input(z.object({
        matchId: z.number(),
        tournamentId: z.number(),
        scheduledAt: z.number(), // Unix ms timestamp
        betsCloseMinutesBefore: z.number().int().min(0).max(1440).default(30),
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const scheduledDate = new Date(input.scheduledAt);
        const betsCloseDate = new Date(input.scheduledAt - input.betsCloseMinutesBefore * 60 * 1000);
        await scheduleMatch(input.matchId, scheduledDate, betsCloseDate);
        // Notify owner that a match has been scheduled with betting window
        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: `⏰ Partido programado con apuestas`,
            content: `Partido #${input.matchId} del torneo #${input.tournamentId} programado para ${scheduledDate.toLocaleString('es-ES')}. Apuestas cierran: ${betsCloseDate.toLocaleString('es-ES')}.`,
          });
        } catch (_) { /* non-critical */ }
        return { success: true, scheduledAt: scheduledDate, betsCloseAt: betsCloseDate };
      }),
  }),
  // ─── Newss ──────────────────────────────────────────────────────────────────
  news: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getNews({ ...input, publishedOnly: true });
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const article = await getNewsById(input.id);
        if (!article || !article.isPublished) throw new TRPCError({ code: "NOT_FOUND" });
        await incrementNewsViews(input.id);
        return article;
      }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await getNewsBySlug(input.slug);
        if (!article || !article.isPublished) throw new TRPCError({ code: "NOT_FOUND" });
        await incrementNewsViews(article.id);
        return article;
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(3).max(256),
        slug: z.string().min(3).max(256),
        excerpt: z.string().optional(),
        content: z.string().min(10),
        coverImage: z.string().optional(),
        category: z.enum(["torneos", "equipos", "juegos", "plataforma", "general"]).default("general"),
        isPublished: z.boolean().default(false),
        isFeatured: z.boolean().default(false),
        referenceUrl: z.string().url().optional().or(z.literal("")),
        gallery: z.array(z.string()).max(4).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { gallery, ...rest } = input;
        const id = await createNews({
          ...rest,
          gallery: gallery ? JSON.stringify(gallery) : undefined,
          authorId: ctx.user.id,
          publishedAt: input.isPublished ? new Date() : undefined,
        });
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        coverImage: z.string().optional(),
        category: z.enum(["torneos", "equipos", "juegos", "plataforma", "general"]).optional(),
        isPublished: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        referenceUrl: z.string().optional(),
        gallery: z.array(z.string()).max(4).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.gallery !== undefined) {
          updateData.gallery = JSON.stringify(data.gallery);
        }
        if (data.isPublished) {
          await updateNews(id, { ...updateData, publishedAt: new Date() });
        } else {
          await updateNews(id, updateData);
        }
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminDeleteNews(input.id);
        return { success: true };
      }),

    adminList: adminProcedure.query(async () => {
      const items = await getNews({ publishedOnly: false });
      return items.map(item => ({
        ...item,
        gallery: item.gallery ? (() => { try { return JSON.parse(item.gallery as string); } catch { return []; } })() : [],
      }));
    }),
  }),

  // ─── Games ─────────────────────────────────────────────────────────────────
  games: router({
    list: publicProcedure.query(async () => {
      return getGames();
    }),

    upsert: adminProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        slug: z.string().min(1).max(128),
        logo: z.string().optional(),
        banner: z.string().optional(),
        genre: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        // Proteger slug inmutable: si el juego ya existe con un slug diferente
        // y tiene torneos/equipos asociados, rechazar el cambio de slug.
        const existing = await getGameBySlug(input.slug);
        if (!existing) {
          // Nuevo juego: verificar que no exista otro juego con el mismo nombre
          // pero slug diferente (evitar duplicar nombres con slugs distintos)
          await upsertGame(input);
          return { success: true };
        }
        // Juego existente: verificar si el slug cambiaría
        // (upsert usa slug como clave, así que si el slug es el mismo, es una edición normal)
        // Si el admin intenta cambiar el slug enviando un slug diferente al original,
        // debería usar el endpoint con el slug original. Aquí solo bloqueamos si
        // hay registros asociados y el nombre cambiaría de forma que rompa la relación.
        // En esta fase solo permitimos editar campos que no sean el slug.
        const associated = await countAssociatedByGameSlug(input.slug);
        if (associated > 0 && existing.name !== input.name) {
          // Permitir cambio de nombre solo si el admin lo confirma explícitamente
          // Por ahora lo permitimos (el slug no cambia, solo el nombre display)
          // El riesgo es que tournaments.game (legacy) quede desincronizado,
          // pero gameSlug sigue siendo válido.
        }
        await upsertGame(input);
        return { success: true, associated };
      }),

    delete: adminProcedure
      .input(z.object({ slug: z.string() }))
      .mutation(async ({ input }) => {
        // Bloquear eliminación si hay torneos o equipos asociados
        const associated = await countAssociatedByGameSlug(input.slug);
        if (associated > 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `No se puede eliminar el juego: tiene ${associated} torneo(s)/equipo(s) asociados. Desactiva el juego en su lugar.`,
          });
        }
        await deleteGame(input.slug);
        return { success: true };
      }),

    auditConsistency: adminProcedure.query(async () => {
      return auditGameSlugConsistency();
    }),
    reorder: adminProcedure
      .input(z.object({
        items: z.array(z.object({
          slug: z.string(),
          sortOrder: z.number().int(),
        })).min(1),
      }))
      .mutation(async ({ input }) => {
        await updateGamesSortOrder(input.items);
        return { success: true };
      }),
  }),

  // ─── Promotions ────────────────────────────────────────────────────────────
  promotions: router({
    list: publicProcedure.query(async () => {
      return getActivePromotions();
    }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1).max(256),
        description: z.string().optional(),
        bannerImage: z.string().optional(),
        linkUrl: z.string().optional(),
        linkLabel: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createPromotion(input);
        return { id };
      }),
  }),

  // ─── Streams ───────────────────────────────────────────────────────────────
  streams: router({
    list: publicProcedure
      .input(z.object({
        liveOnly: z.boolean().optional(),
        tournamentId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getStreams(input);
      }),
    byGame: publicProcedure
      .query(async () => {
        return getStreamsByGame();
      }),
    /** Returns the count of currently live streams (public, for sidebar badge) */
    liveCount: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { count: 0 };
      const rows = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(streams)
        .where(eq(streams.isLive, true));
      return { count: Number(rows[0]?.count ?? 0) };
    }),

    create: premiumProcedure
      .input(z.object({
        tournamentId: z.number().optional(),
        title: z.string().min(1).max(256),
        streamerName: z.string().max(128).optional(),
        platform: z.enum(["twitch", "youtube", "discord", "other"]),
        url: z.string().url(),
        embedUrl: z.string().optional(),
        game: z.string().max(64).optional(),
        isLive: z.boolean().default(false),
        thumbnailUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createStream(input);
        return { id };
      }),

    setLive: premiumProcedure
      .input(z.object({ id: z.number(), isLive: z.boolean() }))
      .mutation(async ({ input }) => {
        await updateStream(input.id, { isLive: input.isLive });
        return { success: true };
      }),
    // ── Creator stream procedures ─────────────────────────────────────────
    /** Returns the caller's active (isLive=true) creator stream, or null */
    myActiveStream: protectedProcedure.query(async ({ ctx }) => {
      return getActiveStreamByUser(ctx.user.id);
    }),
    /** Starts a new creator stream. Requires approved creator status. */
    startCreatorStream: creatorProcedure
      .input(z.object({
        title: z.string().min(1).max(256),
        platform: z.enum(["twitch", "youtube", "discord", "other"]),
        url: z.string().url(),
        game: z.string().min(1).max(64),
        gameSlug: z.string().max(128).optional(),
        thumbnailUrl: z.string().url().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const id = await createCreatorStream(user.id, {
          ...input,
          streamerName: user.nickname ?? user.name ?? undefined,
        });
        return { id };
      }),
    /** Stops the caller's active creator stream (or any stream if admin). */
    stopCreatorStream: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await stopCreatorStream(input.id, ctx.user.id, isAdmin(ctx.user.role));
        return { success: true };
      }),
    /** Returns the active (isLive=true) stream for any user by userId (public) */
    activeByUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return getActiveStreamByUser(input.userId);
      }),
    /** Returns the last N streams for a user (public, for profile history) */
     historyByUser: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().min(1).max(20).default(10) }))
      .query(async ({ input }) => {
        return getStreamHistoryByUser(input.userId, input.limit);
      }),
    liveCreators: publicProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) return [] as number[];
        const rows = await db
          .select({ userId: streams.userId })
          .from(streams)
          .where(and(eq(streams.isLive, true), isNotNull(streams.userId)));
        return rows.map((r: { userId: number | null }) => r.userId).filter((id: number | null): id is number => id !== null);
      }),
  }),
  // ─── Ranking ───────────────────────────────────────────────────────────────
  ranking: router({
    teams: publicProcedure
      .input(z.object({
        gameSlug: z.string().optional(),  // slug canónico (Fase 5a)
        limit: z.number().optional()
      }).optional())
      .query(async ({ input }) => {
        return getTeamRanking({ gameSlug: input?.gameSlug, limit: input?.limit ?? 50 });
      }),
    teamHistory: publicProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return getTeamTournamentHistory(input.teamId);
      }),
    highlights: publicProcedure
      .input(z.object({ gameSlug: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getRankingHighlights(input?.gameSlug);
      }),
    gameStrength: publicProcedure
      .query(async () => {
        return getGameStrength();
      }),
    teamPositions: publicProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return getTeamTournamentPositions(input.teamId);
      }),
    activeTournaments: publicProcedure
      .input(z.object({ gameSlug: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getActiveTournamentsByGame(input?.gameSlug);
      }),
    upcomingMatches: publicProcedure
      .input(z.object({ tournamentId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return getUpcomingMatchesByTournament(input.tournamentId, input.limit ?? 4);
      }),
    tournamentRanking: publicProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return getTeamRankingByTournament(input.tournamentId);
      }),
    getResults: publicProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return getTournamentResults(input.tournamentId);
      }),
  }),

  // ─── Bets ──────────────────────────────────────────────────────────────────
  bets: router({
    myBets: protectedProcedure.query(async ({ ctx }) => {
      return getBetsByUser(ctx.user.id);
    }),

    byTournament: publicProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        const betsData = await getBetsByTournament(input.tournamentId);
        // Return aggregated stats (not individual user bets for privacy)
        const teamBets: Record<number, { teamId: number; totalAmount: number; betCount: number }> = {};
        for (const bet of betsData) {
          if (!teamBets[bet.teamId]) {
            teamBets[bet.teamId] = { teamId: bet.teamId, totalAmount: 0, betCount: 0 };
          }
          teamBets[bet.teamId].totalAmount += bet.amount;
          teamBets[bet.teamId].betCount += 1;
        }
        return Object.values(teamBets);
      }),

     place: protectedProcedure
      .input(z.object({
        tournamentId: z.number(),
        teamId: z.number(),
        amount: z.number().int().min(10).max(10000),
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.status !== "registration_open" && t.status !== "in_progress") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Las apuestas solo están disponibles para torneos activos." });
        }
        const balance = await getUserBalance(ctx.user.id);
        if (balance < input.amount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Saldo insuficiente de RLC Coins." });
        }
        // Simple multiplier: 1.5x for now (can be dynamic based on odds)
        const multiplier = 1.5;
        const potentialWin = Math.floor(input.amount * multiplier);
        // Deduct coins
        await addRlcTransaction({
          userId: ctx.user.id,
          type: "bet_placed",
          amount: -input.amount,
          description: `Apuesta en torneo: ${t.name}`,
        });
        const betId = await createBet({
          userId: ctx.user.id,
          tournamentId: input.tournamentId,
          teamId: input.teamId,
          amount: input.amount,
          multiplier: multiplier.toString() as any,
          potentialWin,
          status: "pending",
        });
        return { betId, potentialWin };
      }),
    // Partidos abiertos para apuestas (tienen betsCloseAt en el futuro)
    openMatches: publicProcedure.query(async () => {
      return getOpenBetMatches();
    }),
    // Apostar al ganador de un partido específico
    placeOnMatch: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        tournamentId: z.number(),
        teamId: z.number(),
        amount: z.number().int().min(10).max(10000),
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.status !== "in_progress") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Las apuestas por partido solo están disponibles durante el torneo." });
        }
        // Verify match exists and bets are still open
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [match] = await db
          .select()
          .from(tournamentMatches)
          .where(eq(tournamentMatches.id, input.matchId))
          .limit(1);
        if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Partido no encontrado." });
        if (match.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este partido ya no acepta apuestas." });
        }
        if (!match.betsCloseAt || new Date() > match.betsCloseAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Las apuestas para este partido están cerradas." });
        }
        if (match.team1Id !== input.teamId && match.team2Id !== input.teamId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "El equipo seleccionado no participa en este partido." });
        }
        const balance = await getUserBalance(ctx.user.id);
        if (balance < input.amount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Saldo insuficiente de RLC Coins." });
        }
        // Dynamic multiplier based on existing bets
        const existingBets = await getBetsByMatch(input.matchId);
        const totalOnTeam = existingBets.filter(b => b.teamId === input.teamId).reduce((s, b) => s + b.amount, 0);
        const totalOpponent = existingBets.filter(b => b.teamId !== input.teamId).reduce((s, b) => s + b.amount, 0);
        // Multiplier: more bets on opponent = higher reward; floor at 1.2, cap at 3.0
        const ratio = totalOpponent > 0 ? (totalOnTeam + totalOpponent) / (totalOnTeam + input.amount) : 1.5;
        const multiplier = Math.min(3.0, Math.max(1.2, parseFloat(ratio.toFixed(2))));
        const potentialWin = Math.floor(input.amount * multiplier);
        await addRlcTransaction({
          userId: ctx.user.id,
          type: "bet_placed",
          amount: -input.amount,
          description: `Apuesta en partido #${input.matchId} (${t.name})`,
        });
        const betId = await createBet({
          userId: ctx.user.id,
          tournamentId: input.tournamentId,
          matchId: input.matchId,
          teamId: input.teamId,
          amount: input.amount,
          multiplier: multiplier.toString() as any,
          potentialWin,
          status: "pending",
        });
         return { betId, potentialWin, multiplier };
      }),
    // Estadísticas públicas de apuestas de un usuario
    userStats: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return getBetStatsByUser(input.userId);
      }),
    // Admin: listar todas las apuestas con datos enriquecidos
    adminList: adminProcedure.query(async () => {
      return adminListBets();
    }),
    // Admin: anular una apuesta pendiente y reembolsar al usuario
    cancelBet: adminProcedure
      .input(z.object({ betId: z.number() }))
      .mutation(async ({ input }) => {
        await cancelBetById(input.betId);
        return { success: true };
      }),
  }),
  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    setRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "premium", "admin", "super_admin"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    users: adminProcedure.query(async () => {
      return getAllUsers();
    }),




     addCoins: adminProcedure
      .input(z.object({ userId: z.number(), amount: z.number().int(), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        await addRlcTransaction({
          userId: input.userId,
          type: "deposit",
          amount: input.amount,
          description: input.description ?? "Depósito de administrador",
        });
        return { success: true };
      }),
    getShopOrders: adminProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => {
        return getShopOrders(undefined, input.status);
      }),
    updateOrderStatus: adminProcedure
      .input(z.object({ orderId: z.number(), status: z.string(), deliveryNote: z.string().optional() }))
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.orderId, input.status, input.deliveryNote);
        // Notify buyer about status change
        try {
          const db = await getDb();
          if (db) {
            const { shopOrders: so, users: u, shopItems: si } = await import("../drizzle/schema");
            const rows = await db.select({
              userId: so.userId,
              itemName: si.name,
              itemCategory: si.category,
            }).from(so)
              .innerJoin(si, eq(so.itemId, si.id))
              .where(eq(so.id, input.orderId))
              .limit(1);
            if (rows[0]) {
              const { notifications } = await import("../drizzle/schema");
              const statusMessages: Record<string, string> = {
                processing: `Tu pedido de "${rows[0].itemName}" está siendo procesado. Te contactaremos pronto.`,
                delivered: rows[0].itemCategory === "digital" || rows[0].itemCategory === "limited"
                  ? `Tu pedido de "${rows[0].itemName}" ha sido entregado. Revisa la nota de entrega para tu código/acceso.`
                  : `Tu pedido de "${rows[0].itemName}" ha sido enviado. ${input.deliveryNote ? `Nota: ${input.deliveryNote}` : ""}`,
                cancelled: `Tu pedido de "${rows[0].itemName}" ha sido cancelado. Los RLC Coins serán reembolsados.`,
              };
              const msg = statusMessages[input.status];
              if (msg) {
                await db.insert(notifications).values({
                  userId: rows[0].userId,
                  type: "order_confirmed",
                  title: `🛒 Pedido #${input.orderId} — ${input.status === "processing" ? "En proceso" : input.status === "delivered" ? "Entregado" : "Cancelado"}`,
                  message: msg,
                  isRead: false,
                  link: "/shop?tab=orders",
                  referenceId: input.orderId,
                  referenceType: "order",
                });
              }
            }
          }
        } catch {}
        return { success: true };
      }),
    createBrandAd: adminProcedure
      .input(z.object({
        brandName: z.string(),
        title: z.string(),
        tagline: z.string().optional(),
        description: z.string().optional(),
        bannerImage: z.string(),
        logoImage: z.string().optional(),
        accentColor: z.string().optional(),
        destinationUrl: z.string().optional(),
        ctaLabel: z.string().optional(),
        isFeatured: z.boolean().default(false),
        isPremium: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        await createBrandAd(input);
        return { success: true };
      }),
    // ── Aliases for AdminPanel.tsx ──────────────────────────────────────────
    listUsers: adminProcedure
      .input(z.object({ search: z.string().optional() }))
      .query(async ({ input }) => adminListUsers(input.search)),
    updateUserRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "premium", "admin", "super_admin"]) }))
      .mutation(async ({ input }) => {
        await adminUpdateUserRole(input.userId, input.role);
        return { success: true };
      }),
    updateBannerPermission: adminProcedure
      .input(z.object({ userId: z.number(), canUploadBanner: z.boolean() }))
      .mutation(async ({ input }) => {
        await adminUpdateBannerPermission(input.userId, input.canUploadBanner);
        return { success: true };
      }),
    updateVerified: adminProcedure
      .input(z.object({ userId: z.number(), isVerified: z.boolean() }))
      .mutation(async ({ input }) => {
        await adminUpdateVerified(input.userId, input.isVerified);
        return { success: true };
      }),
    adjustRLC: adminProcedure
      .input(z.object({ userId: z.number(), amount: z.number().int(), reason: z.string() }))
      .mutation(async ({ input }) => {
        await adminAdjustRLC(input.userId, input.amount, input.reason);
        return { success: true };
      }),
    listOrders: adminProcedure
      .query(async () => adminListOrders()),
    listShopItems: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) return [];
        const { shopItems } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        return db.select().from(shopItems).orderBy(shopItems.sortOrder, desc(shopItems.createdAt));
      }),
    createShopItem: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        price: z.number().int().min(1),
        stock: z.number().int().default(-1),
        category: z.enum(["physical", "digital", "bundle", "limited"]),
        maxPerUser: z.number().int().min(1).nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        await adminCreateShopItem({ name: input.name, description: input.description, image: input.imageUrl, price: input.price, stock: input.stock, category: input.category, maxPerUser: input.maxPerUser ?? null });
        return { success: true };
      }),
    updateShopItem: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        price: z.number().int().min(1).optional(),
        stock: z.number().int().optional(),
        category: z.enum(["physical", "digital", "bundle", "limited"]).optional(),
        maxPerUser: z.number().int().min(1).nullable().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, imageUrl, ...rest } = input;
        await adminUpdateShopItem(id, { ...rest, ...(imageUrl !== undefined ? { image: imageUrl } : {}) });
        return { success: true };
      }),
    deleteShopItem: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminDeleteShopItem(input.id);
        return { success: true };
      }),

    // ─── RLC Economy Architect: AI Price Suggestion ─────────────────────────────
    suggestPrice: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        category: z.enum(["physical", "digital", "bundle", "limited"]),
        rarity: z.enum(["common", "rare", "epic", "legendary"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "OPENAI_API_KEY no configurado" });

        const isPhysical = input.category === "physical" || input.category === "bundle";

        // For physical products, try to search for real price via SerpAPI
        let marketPriceContext = "";
        if (isPhysical) {
          try {
            const serpKey = process.env.SERPAPI_KEY ?? "";
            if (serpKey) {
              const searchRes = await fetch(
                `https://serpapi.com/search.json?q=${encodeURIComponent(input.name + " precio USD")}&engine=google_shopping&api_key=${serpKey}&hl=es&gl=us&num=5`,
                { signal: AbortSignal.timeout(8000) }
              );
              if (searchRes.ok) {
                const searchData = await searchRes.json() as any;
                const results = (searchData.shopping_results ?? []).slice(0, 5);
                if (results.length > 0) {
                  const prices = results
                    .map((r: any) => r.extracted_price ?? r.price)
                    .filter(Boolean)
                    .join(", ");
                  marketPriceContext = `Precios encontrados en Google Shopping para "${input.name}": ${prices}. Usa estos como referencia para el precio de mercado en USD.`;
                }
              }
            } else {
              marketPriceContext = `Estima el precio de mercado actual en USD para "${input.name}" basado en tu conocimiento actualizado.`;
            }
          } catch {
            marketPriceContext = `Estima el precio de mercado actual en USD para "${input.name}" basado en tu conocimiento actualizado.`;
          }
        }

        const systemPrompt = `Eres el "RLC Economy Architect", analista financiero especializado en economías de tokens digitales para la plataforma de esports Red Level Circle (RLC).

# CONSTANTES DE LA ECONOMÍA (CALIBRADAS)
- Ganancia Base del Usuario (Gh): 800 RLC por cada 1 hora de actividad activa.
- Ganancia Diaria Estimada: 1,600 RLC/día (asumiendo 2h de actividad diaria).
- Ganancia Mensual Estimada: 48,000 RLC/mes (30 días × 2h/día).
- Tasa de Cambio: 1,000 RLC = $1.00 USD.
- Margen de Seguridad (Objetos Físicos): +20% sobre el precio de mercado.
- Bono de Bienvenida: 500 RLC (referencia de accesibilidad inicial).

# PRINCIPIO DE EQUILIBRIO
Un producto de $40 USD debe costar exactamente 1 mes de actividad (48,000 RLC).
Productos más caros escalan proporcionalmente:
- $5 USD → 6,000 RLC (≈4 días)
- $10 USD → 12,000 RLC (≈7 días)
- $20 USD → 24,000 RLC (≈15 días)
- $40 USD → 48,000 RLC (1 mes exacto)
- $60 USD → 72,000 RLC (1.5 meses)
- $100 USD → 120,000 RLC (2.5 meses)
- $150 USD → 180,000 RLC (3.8 meses)

# JERARQUÍA DE RAREZA (Productos Digitales - calibrada)
- COMÚN: 800-3,200 RLC (1-4 días de actividad)
- RARO: 4,800-9,600 RLC (3-6 días)
- ÉPICO: 16,000-32,000 RLC (10-20 días)
- LEGENDARIO: 48,000+ RLC (1 mes o más)

# FÓRMULA FÍSICOS: P_RLC = ((Precio_USD × 1.20) / 0.001)
# FÓRMULA ESFUERZO: effortHours = P_RLC / 800
Ejemplo: $40 USD → 48,000 RLC → effortHours = 48,000 / 800 = 60h (30 días × 2h)
NUNCA devuelvas effortHours = 0. Calcula siempre: effortHours = suggestedPriceRLC / 800.

IMPORTANTE: Todos los valores numéricos deben ser números enteros SIN separadores de miles ni puntos decimales. Ejemplo correcto: 86000 (NO "86,000" ni "86.000" ni 86).

Responde SIEMPRE con JSON válido con exactamente estas claves:
{
  "productName": string,
  "type": "Físico" | "Digital",
  "rarity": "COMÚN" | "RARO" | "ÉPICO" | "LEGENDARIO" | null,
  "marketPriceUSD": number | null,
  "suggestedPriceRLC": number,
  "effortHours": number,
  "justification": string
}`;

        const userMessage = `Producto: "${input.name}"
Categoría: ${input.category}
Descripción: ${input.description ?? "Sin descripción"}
${input.rarity ? `Rareza indicada: ${input.rarity}` : ""}
${marketPriceContext}

Genera el reporte de precio RLC para este producto.`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            max_tokens: 600,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `OpenAI error: ${err}` });
        }

        const data = await response.json() as any;
        const raw = data.choices?.[0]?.message?.content ?? "{}";
        try {
          const parsed = JSON.parse(raw);

          // Sanitizar suggestedPriceRLC: la IA a veces devuelve "86,000" o "86.000" como string
          // o un número truncado. Normalizamos eliminando separadores de miles y convirtiendo a número.
          if (parsed.suggestedPriceRLC !== undefined) {
            const rawPrice = String(parsed.suggestedPriceRLC).replace(/[,\.]/g, "");
            const numericPrice = parseInt(rawPrice, 10);
            // Si el número resultante es sospechosamente pequeño (< 1000 para un producto físico),
            // puede ser que la IA devolvió el valor en miles (ej: 86 en vez de 86000)
            // Verificamos con marketPriceUSD si está disponible
            if (!isNaN(numericPrice)) {
              if (numericPrice < 1000 && parsed.marketPriceUSD && parsed.marketPriceUSD > 0) {
                // Recalcular con la fórmula correcta: (USD * 1.20) / 0.001
                parsed.suggestedPriceRLC = Math.round((parsed.marketPriceUSD * 1.20) / 0.001);
              } else {
                parsed.suggestedPriceRLC = numericPrice;
              }
            }
          }

          // Sanitizar marketPriceUSD
          if (parsed.marketPriceUSD !== undefined && parsed.marketPriceUSD !== null) {
            parsed.marketPriceUSD = parseFloat(String(parsed.marketPriceUSD).replace(/[,$]/g, "")) || null;
          }

          // Fallback server-side: si la IA devuelve effortHours = 0 o undefined, calcular manualmente
          // Tasa calibrada: 800 RLC/hora, 1,600 RLC/día, 48,000 RLC/mes
          // Principio: producto de $40 USD = 1 mes de actividad (60h = 30 días × 2h/día)
          if (!parsed.effortHours || parsed.effortHours === 0) {
            parsed.effortHours = Math.round((parsed.suggestedPriceRLC / 800) * 10) / 10;
          }
          return parsed as {
            productName: string;
            type: string;
            rarity: string | null;
            marketPriceUSD: number | null;
            suggestedPriceRLC: number;
            effortHours: number;
            justification: string;
          };
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al parsear respuesta de IA" });
        }
      }),

    // ─── Upload image for shop items ─────────────────────────────────────────────────
    uploadShopImage: adminProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]),
        itemId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const ext = input.mimeType.split("/")[1];
        const key = `shop/${input.itemId ?? "new"}/image-${Date.now()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),

    // ─── Upload image for cosmetics (previewImage or frameImage) ─────────────────────
    uploadCosmeticImage: adminProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]),
        cosmeticId: z.number().optional(),
        imageType: z.enum(["preview", "frame"]),
      }))
      .mutation(async ({ input }) => {
        const ext = input.mimeType.split("/")[1];
        const key = `cosmetics/${input.cosmeticId ?? "new"}/${input.imageType}-${Date.now()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),

    listAds: adminProcedure
      .query(async () => adminListBrandAds()),
    createAd: adminProcedure
      .input(z.object({
        brand: z.string(),
        title: z.string(),
        tagline: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string(),
        linkUrl: z.string().optional(),
        ctaLabel: z.string().optional(),
        adType: z.enum(["featured", "card", "wide"]).default("card"),
        sortOrder: z.number().int().default(0),
        isPremium: z.boolean().default(false),
        isFeatured: z.boolean().default(false),
        accentColor: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createBrandAd({
          brandName: input.brand,
          title: input.title,
          tagline: input.tagline,
          description: input.description,
          bannerImage: input.imageUrl,
          destinationUrl: input.linkUrl,
          ctaLabel: input.ctaLabel,
          adType: input.adType,
          sortOrder: input.sortOrder,
          isPremium: input.isPremium,
          isFeatured: input.isFeatured,
          accentColor: input.accentColor,
        });
        return { success: true };
      }),
    updateAd: adminProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean().optional(),
        adType: z.enum(["featured", "card", "wide"]).optional(),
        sortOrder: z.number().int().optional(),
        title: z.string().optional(),
        tagline: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        mobileImageUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        ctaLabel: z.string().optional(),
        isFeatured: z.boolean().optional(),
        isPremium: z.boolean().optional(),
        accentColor: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, imageUrl, linkUrl, mobileImageUrl, ...rest } = input;
        await adminUpdateBrandAd(id, {
          ...rest,
          ...(imageUrl !== undefined ? { bannerImage: imageUrl } : {}),
          ...(linkUrl !== undefined ? { destinationUrl: linkUrl } : {}),
          ...(mobileImageUrl !== undefined ? { logoImage: mobileImageUrl } : {}),
        });
        return { success: true };
      }),
    deleteAd: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminDeleteBrandAd(input.id);
        return { success: true };
      }),
    listRewards: adminProcedure
      .query(async () => adminListRewardTasks()),
    createReward: adminProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(["video", "ad", "daily_login", "share", "follow"]),
        rewardAmount: z.number().int().min(1),
        contentUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        sponsorName: z.string().optional(),
        sponsorLogoUrl: z.string().optional(),
        expiresAt: z.string().optional(), // ISO date string
        durationSeconds: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        await adminCreateRewardTask({
          title: input.title,
          description: input.description,
          type: input.type,
          reward: input.rewardAmount,
          contentUrl: input.contentUrl,
          thumbnailUrl: input.thumbnailUrl,
          sponsorName: input.sponsorName,
          sponsorLogoUrl: input.sponsorLogoUrl,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
          durationSeconds: input.durationSeconds,
        });
        return { success: true };
      }),
    updateReward: adminProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        await adminUpdateRewardTask(input.id, { isActive: input.isActive });
        return { success: true };
      }),
    deleteReward: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminDeleteRewardTask(input.id);
        return { success: true };
      }),

    // ─── Suggest reward with AI (RLC Economy Architect) ──────────────────────────────────────────────
    suggestReward: adminProcedure
      .input(z.object({
        title: z.string(),
        type: z.enum(["video", "ad", "daily_login", "share", "follow"]),
        description: z.string().optional(),
        sponsorName: z.string().optional(),
        durationSeconds: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "OpenAI API key no configurada" });

        const typeLabels: Record<string, string> = {
          video: "Ver video",
          ad: "Ver anuncio",
          daily_login: "Login diario",
          share: "Compartir contenido",
          follow: "Seguir a alguien",
        };

        const systemPrompt = `Eres el "RLC Economy Architect", experto en diseño de sistemas de recompensas para plataformas de esports.

# ECONOMÍA RLC CALIBRADA
- Tasa de ganancia: 800 RLC/hora de actividad activa.
- Ganancia diaria estimada (2h/día): 1,600 RLC/día.
- Ganancia mensual (30 días): 48,000 RLC/mes.
- Tasa de cambio: 1,000 RLC = $1.00 USD.
- Bono de bienvenida: 500 RLC.

# PRINCIPIOS DE RECOMPENSAS
Las recompensas deben ser proporcionales al esfuerzo y tiempo requerido:
- Login diario (30 seg): 50-100 RLC (micro-recompensa, fomenta hábito)
- Ver anuncio corto (15-30 seg): 80-150 RLC
- Ver video completo (1-3 min): 200-400 RLC
- Ver video largo (5-10 min): 500-800 RLC
- Compartir contenido: 300-600 RLC (acción de valor para la plataforma)
- Seguir a alguien: 100-200 RLC

# REGLA DE ORO
Ninguna recompensa debe ser tan alta que permita conseguir un producto de $40 (48,000 RLC) en menos de 30 días solo con recompensas pasivas. Las recompensas complementan la actividad activa, no la reemplazan.

Responde SIEMPRE con JSON válido con exactamente estas claves:
{
  "suggestedReward": number,
  "minReward": number,
  "maxReward": number,
  "rationale": string,
  "engagementTip": string
}`;

        const userMessage = `Tarea de recompensa:
- Título: "${input.title}"
- Tipo: ${typeLabels[input.type] ?? input.type}
- Descripción: ${input.description ?? "Sin descripción"}
${input.sponsorName ? `- Patrocinador: ${input.sponsorName}` : ""}
${input.durationSeconds ? `- Duración requerida: ${input.durationSeconds} segundos` : ""}

¿Cuántos RLC debería otorgar esta tarea? Sugéreme el valor óptimo con justificación.`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            max_tokens: 400,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `OpenAI error: ${err}` });
        }

        const data = await response.json() as any;
        const raw = data.choices?.[0]?.message?.content ?? "{}";
        try {
          const parsed = JSON.parse(raw);
          return parsed as {
            suggestedReward: number;
            minReward: number;
            maxReward: number;
            rationale: string;
            engagementTip: string;
          };
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al parsear respuesta de IA" });
        }
      }),

    listNews: adminProcedure
      .query(async () => adminListNews()),
    createNews: adminProcedure
      .input(z.object({
        title: z.string(),
        slug: z.string(),
        content: z.string(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        category: z.enum(["torneos", "equipos", "juegos", "plataforma", "general"]).default("general"),
        published: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        await adminCreateNews({ ...input, authorId: ctx.user.id });
        return { success: true };
      }),
    updateNews: adminProcedure
      .input(z.object({ id: z.number(), published: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        await adminUpdateNews(input.id, { published: input.published });
        return { success: true };
      }),
    deleteNews: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminDeleteNews(input.id);
        return { success: true };
      }),
    pendingTournaments: adminProcedure
      .query(async () => adminListPendingTournaments()),
    approveTournament: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const t = await getTournamentById(input.id);
        await adminApproveTournament(input.id);
        // Notify the tournament creator
        if (t?.creatorId) {
          try {
            await createNotification({
              userId: t.creatorId,
              type: "general",
              title: "✅ Torneo aprobado",
              message: `Tu torneo "${t.name}" ha sido aprobado. ¡Ya puedes recibir inscripciones!`,
              link: `/dashboard/tournament/${t.id}`,
            });
          } catch (e) { console.error("[ApproveTournament] Notification error:", e); }
        }
        // Emit status change for news generator
        try {
          eventBus.emit("tournament.status_changed", {
            tournamentId: input.id,
            newStatus: "registration_open",
            tournamentName: t?.name ?? "",
          });
        } catch (e) { console.error("[ApproveTournament] EventBus error:", e); }
        return { success: true };
      }),
    rejectTournament: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const t = await getTournamentById(input.id);
        await adminRejectTournament(input.id);
        // Notify the tournament creator
        if (t?.creatorId) {
          try {
            await createNotification({
              userId: t.creatorId,
              type: "general",
              title: "❌ Torneo rechazado",
              message: `Tu torneo "${t.name}" no fue aprobado. Revisa las normas de RLC y vuelve a intentarlo.`,
              link: `/dashboard/my-tournaments`,
            });
          } catch (e) { console.error("[RejectTournament] Notification error:", e); }
        }
        return { success: true };
      }),
    stats: adminProcedure
      .query(async () => getAdminStats()),
    listTeams: adminProcedure
      .query(async () => adminListTeams()),
    verifyTeam: adminProcedure
      .input(z.object({ teamId: z.number(), verified: z.boolean() }))
      .mutation(async ({ input }) => {
        await adminVerifyTeam(input.teamId, input.verified);
        return { success: true };
      }),
    listAllTournaments: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => adminListTournaments(input?.status)),
    banUser: adminProcedure
      .input(z.object({ userId: z.number(), banned: z.boolean() }))
      .mutation(async ({ input }) => {
        // Set role to 'user' when banning (remove any elevated access)
        if (input.banned) await adminUpdateUserRole(input.userId, "user");
        return { success: true };
      }),
    uploadImage: adminProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml", "image/bmp", "image/tiff"]),
        folder: z.string().default("admin"),
      }))
      .mutation(async ({ input }) => {
        const ext = input.mimeType.split("/")[1];
        const key = `${input.folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ─── Shop ──────────────────────────────────────────────────────────────────
  shop: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ input }) => getShopItems(input.category)),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getShopItemById(input.id)),

    buy: protectedProcedure
      .input(z.object({
        itemId: z.number(),
        quantity: z.number().int().min(1).default(1),
        userNote: z.string().optional(),
        shippingAddress: z.string().optional(), // JSON string for physical/bundle products
      }))
      .mutation(async ({ ctx, input }) => {
        const item = await getShopItemById(input.itemId);
        // Validate: physical/bundle products require shippingAddress
        if ((item?.category === "physical" || item?.category === "bundle") && !input.shippingAddress) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Los productos físicos requieren dirección de envío" });
        }
        const result = await buyShopItem(ctx.user.id, input.itemId, input.quantity, input.userNote, input.shippingAddress);
        // Notify admin
        try {
          const { notifyOwner } = await import("./_core/notification");
          const categoryLabel = (item?.category === "physical" || item?.category === "bundle") ? "📦 FÍSICO" : "💻 DIGITAL";
          const shippingInfo = input.shippingAddress ? (() => { try { const a = JSON.parse(input.shippingAddress!); return `\nEnvío: ${a.fullName}, ${a.address}, ${a.city}, ${a.country} ${a.postalCode} | Contacto: ${a.contact}`; } catch { return ""; } })() : "";
          await notifyOwner({
            title: `🛒 [${categoryLabel}] Nueva compra — Pedido #${result.orderId}`,
            content: `${ctx.user.name ?? ctx.user.openId} (${ctx.user.email ?? "sin email"}) compró ${input.quantity}x "${item?.name}" por ${result.totalPrice} RLC Coins.${shippingInfo}`,
          });
        } catch {}
        return result;
      }),

    myOrders: protectedProcedure
      .query(async ({ ctx }) => getShopOrders(ctx.user.id)),

    // ── Cart ──────────────────────────────────────────────────────────────
    getCart: protectedProcedure
      .query(async ({ ctx }) => {
        const { cartItems, shopItems } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) return { items: [] };
        const { eq } = await import("drizzle-orm");
        const items = await db
          .select({ cartItem: cartItems, product: shopItems })
          .from(cartItems)
          .innerJoin(shopItems, eq(cartItems.itemId, shopItems.id))
          .where(eq(cartItems.userId, ctx.user.id));
        return { items };
      }),

    addToCart: protectedProcedure
      .input(z.object({ itemId: z.number(), quantity: z.number().int().min(1).default(1) }))
      .mutation(async ({ ctx, input }) => {
        const { cartItems } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
        const { eq, and } = await import("drizzle-orm");
        // Check if already in cart
        const existing = await db.select().from(cartItems)
          .where(and(eq(cartItems.userId, ctx.user.id), eq(cartItems.itemId, input.itemId)))
          .limit(1);
        if (existing.length > 0) {
          await db.update(cartItems)
            .set({ quantity: existing[0].quantity + input.quantity })
            .where(eq(cartItems.id, existing[0].id));
        } else {
          await db.insert(cartItems).values({ userId: ctx.user.id, itemId: input.itemId, quantity: input.quantity });
        }
        return { success: true };
      }),

    removeFromCart: protectedProcedure
      .input(z.object({ cartItemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { cartItems } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
        const { eq, and } = await import("drizzle-orm");
        await db.delete(cartItems)
          .where(and(eq(cartItems.id, input.cartItemId), eq(cartItems.userId, ctx.user.id)));
        return { success: true };
      }),

    clearCart: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { cartItems } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
        const { eq } = await import("drizzle-orm");
        await db.delete(cartItems).where(eq(cartItems.userId, ctx.user.id));
        return { success: true };
      }),

    // ── Wishlist ───────────────────────────────────────────────────────────
    getWishlist: protectedProcedure
      .query(async ({ ctx }) => {
        const { wishlistItems, shopItems } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) return { items: [] };
        const { eq } = await import("drizzle-orm");
        const items = await db
          .select({ wishlistItem: wishlistItems, product: shopItems })
          .from(wishlistItems)
          .innerJoin(shopItems, eq(wishlistItems.itemId, shopItems.id))
          .where(eq(wishlistItems.userId, ctx.user.id));
        return { items };
      }),

    addToWishlist: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { wishlistItems } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
        const { eq, and } = await import("drizzle-orm");
        const existing = await db.select().from(wishlistItems)
          .where(and(eq(wishlistItems.userId, ctx.user.id), eq(wishlistItems.itemId, input.itemId)))
          .limit(1);
        if (existing.length === 0) {
          await db.insert(wishlistItems).values({ userId: ctx.user.id, itemId: input.itemId });
        }
        return { success: true };
      }),

    removeFromWishlist: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { wishlistItems } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
        const { eq, and } = await import("drizzle-orm");
        await db.delete(wishlistItems)
          .where(and(eq(wishlistItems.userId, ctx.user.id), eq(wishlistItems.itemId, input.itemId)));
        return { success: true };
      }),

    isInWishlist: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { wishlistItems } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) return { inWishlist: false };
        const { eq, and } = await import("drizzle-orm");
        const existing = await db.select().from(wishlistItems)
          .where(and(eq(wishlistItems.userId, ctx.user.id), eq(wishlistItems.itemId, input.itemId)))
          .limit(1);
        return { inWishlist: existing.length > 0 };
      }),
  }),

  // ─── Cosmetics ─────────────────────────────────────────────────────────────
  cosmetics: router({
    list: publicProcedure
      .input(z.object({ type: z.string().optional(), collection: z.string().optional() }))
      .query(async ({ input }) => getCosmetics(input.type, input.collection)),
    myCosmetics: protectedProcedure
      .query(async ({ ctx }) => getUserCosmetics(ctx.user.id)),
    buy: protectedProcedure
      .input(z.object({ cosmeticId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return buyCosmetic(ctx.user.id, input.cosmeticId);
      }),
    equip: protectedProcedure
      .input(z.object({ cosmeticId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await equipCosmetic(ctx.user.id, input.cosmeticId);
        return { success: true };
      }),
    // ─── Admin ───────────────────────────────────────────────────────────────
    adminCreate: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["frame", "aura", "badge", "background"]).default("frame"),
        rarity: z.enum(["common", "rare", "epic", "legendary"]).default("common"),
        previewImage: z.string().optional(),
        frameImage: z.string().optional(),
        price: z.number().int().min(0),
        originalPrice: z.number().int().optional(),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        isLimited: z.boolean().default(false),
        collection: z.string().optional(),
        sortOrder: z.number().int().default(0),
      }))
      .mutation(async ({ input }) => {
        await adminCreateCosmetic(input as any);
        return { success: true };
      }),
    adminUpdate: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(["frame", "aura", "badge", "background"]).optional(),
        rarity: z.enum(["common", "rare", "epic", "legendary"]).optional(),
        previewImage: z.string().optional(),
        frameImage: z.string().optional(),
        price: z.number().int().optional(),
        originalPrice: z.number().int().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        isLimited: z.boolean().optional(),
        collection: z.string().optional(),
        sortOrder: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await adminUpdateCosmetic(id, data as any);
        return { success: true };
      }),
    adminDelete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminDeleteCosmetic(input.id);
        return { success: true };
      }),
  }),

  // ─── Rewards ───────────────────────────────────────────────────────────────
  rewards: router({
    list: publicProcedure
      .query(async () => getRewardTasks()),

    claim: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return claimReward(ctx.user.id, input.taskId);
      }),
  }),

  // ─── Brand Ads ─────────────────────────────────────────────────────────────
  ads: router({
    list: publicProcedure
      .query(async () => getBrandAds(true)),

    trackClick: publicProcedure
      .input(z.object({ adId: z.number() }))
      .mutation(async ({ input }) => {
        await trackAdClick(input.adId);
        return { success: true };
      }),

    trackImpression: publicProcedure
      .input(z.object({ adId: z.number() }))
      .mutation(async ({ input }) => {
        await trackAdImpression(input.adId);
        return { success: true };
      }),
  }),
  // ─── Profile ───────────────────────────────────────────────────────────────
  profile: router({
    uploadImage: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml", "image/bmp", "image/tiff"]),
        type: z.enum(["avatar", "banner"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Banner upload requires explicit permission (granted by admin)
        if (input.type === "banner") {
          const userProfile = await getUserPublicProfile(ctx.user.id);
          const hasPermission = userProfile?.canUploadBanner || isAdmin(ctx.user.role);
          if (!hasPermission) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "No tienes permiso para subir un banner personalizado. Este privilegio es otorgado por el equipo de RLC a creadores de contenido, capitanes oficiales y negocios verificados.",
            });
          }
        }
        const ext = input.mimeType.split("/")[1];
        const key = `profiles/${ctx.user.id}/${input.type}-${Date.now()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
    uploadRosterCard: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "image/bmp", "image/tiff"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // 1. Validar que el usuario pertenece a al menos un equipo activo
        const canUpload = await hasApprovedTeamMembership(ctx.user.id);
        if (!canUpload) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Debes pertenecer a un equipo para generar tu ficha competitiva.",
          });
        }
        // 2. Obtener datos del usuario y su equipo
        const memberships = await getTeamsByMembership(ctx.user.id);
        const primaryTeam = memberships[0]; // Usar el primer equipo
        const userProfile = await getUserPublicProfile(ctx.user.id);
        if (!userProfile) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado" });
        // 3. Guardar la foto original del jugador en S3
        const ext = input.mimeType.split("/")[1] || "jpg";
        const rawKey = `profiles/${ctx.user.id}/roster-raw-${Date.now()}.${ext}`;
        const rawBuffer = Buffer.from(input.base64, "base64");
        const { url: rawUrl } = await storagePut(rawKey, rawBuffer, input.mimeType);
        // 4. Generar la roster card compuesta (600×900)
        // Obtener el label legible del rol del juego
        const { getRolesForGame } = await import("../shared/gameRoles.js");
        const gameSlug = userProfile.mainGame
          ? userProfile.mainGame.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
          : "";
        const rolesForGame = getRolesForGame(gameSlug);
        const roleData = rolesForGame.find((r) => r.value === userProfile.gameRole);
        const cardBuffer = await generateRosterCard({
          playerPhotoBuffer: rawBuffer,
          nickname: userProfile.nickname ?? userProfile.name ?? "Jugador",
          teamRole: primaryTeam?.role ?? "player",
          gameRole: userProfile.gameRole,
          gameRoleLabel: roleData?.label ?? null,
          teamLogoUrl: primaryTeam?.teamLogo ?? null,
          teamTag: primaryTeam?.teamTag ?? null,
          realName: userProfile.name ?? null,
          country: userProfile.country ?? null,
          elo: userProfile.elo ?? null,
          competitiveRegion: userProfile.competitiveRegion ?? null,
          mainGame: userProfile.mainGame ?? null,
          competitiveScore: userProfile.competitiveScore ?? null,
        });
        // 5. Subir la card compuesta a S3
        const cardKey = `profiles/${ctx.user.id}/roster-card-${Date.now()}.jpg`;
        const { url: cardUrl } = await storagePut(cardKey, cardBuffer, "image/jpeg");
        // 6. Guardar ambas URLs en el perfil del usuario
        await updateUserProfile(ctx.user.id, {
          rosterPhoto: rawUrl,       // URL de la foto original en S3
          rosterImageUrl: cardUrl,   // URL de la card compuesta (usada en UI)
        });
        return { url: cardUrl };
      }),
    // Mantener compatibilidad con el endpoint anterior
    uploadRosterPhoto: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml", "image/bmp", "image/tiff"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Redirigir al nuevo endpoint uploadRosterCard
        const canUpload = await hasApprovedTeamMembership(ctx.user.id);
        if (!canUpload) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Debes pertenecer a un equipo para generar tu ficha competitiva.",
          });
        }
        const ext = input.mimeType.split("/")[1];
        const key = `profiles/${ctx.user.id}/roster-${Date.now()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        await updateUserProfile(ctx.user.id, { rosterPhoto: url });
        return { url };
      }),
    hasApprovedTeam: protectedProcedure.query(async ({ ctx }) => {
      const canUpload = await hasApprovedTeamMembership(ctx.user.id);
      return { canUpload };
    }),
    getPublic: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const profile = await getUserPublicProfile(input.userId);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado" });
        return profile;
      }),
    getEquippedCosmetics: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => getUserEquippedCosmetics(input.userId)),
    updateMine: protectedProcedure
      .input(z.object({
        nickname: z.string().max(64).optional(),
        bio: z.string().max(500).optional(),
        avatar: z.string().url().optional(),
        bannerUrl: z.string().url().optional(),
        mainGame: z.string().max(64).optional(),
        gameRole: z.string().max(64).optional(),
        elo: z.string().max(64).optional(),
        competitiveRegion: z.string().max(32).optional(),
        gameId: z.string().max(128).nullish(),
        competitiveScore: z.number().int().min(0).nullish(),
        country: z.string().max(64).optional(),
        profileType: z.enum(["player", "team_captain", "event_creator"]).optional(),
        socialDiscord: z.string().max(128).optional(),
        socialTwitch: z.string().max(128).optional(),
        socialTwitter: z.string().max(128).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    getWithStats: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await getUserPublicProfile(input.userId);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado" });
        const [followerCount, followingCount, equippedCosmetics] = await Promise.all([
          getFollowerCount(input.userId),
          getFollowingCount(input.userId),
          getUserEquippedCosmetics(input.userId),
        ]);
        const following = ctx.user ? await isFollowing(ctx.user.id, input.userId) : false;
        return { ...profile, followerCount, followingCount, equippedCosmetics, isFollowing: following };
      }),
  }),

  // ─── Community ─────────────────────────────────────────────────────────────
  community: router({
    listUsers: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(40),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => listPublicUsers(input)),
  }),

  // ─── Follows ───────────────────────────────────────────────────────────────
  follows: router({
    follow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id === input.userId) throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes seguirte a ti mismo" });
        await followUser(ctx.user.id, input.userId);
        return { success: true };
      }),
    unfollow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await unfollowUser(ctx.user.id, input.userId);
        return { success: true };
      }),
    isFollowing: publicProcedure
      .input(z.object({ followerId: z.number(), followingId: z.number() }))
      .query(async ({ input }) => isFollowing(input.followerId, input.followingId)),
    getFollowers: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => getFollowers(input.userId)),
    getFollowing: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => getFollowing(input.userId)),
    getCounts: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => ({
        followers: await getFollowerCount(input.userId),
        following: await getFollowingCount(input.userId),
      })),
  }),

  // ─── Creators ───────────────────────────────────────────────────────────────
  creators: router({
    listApproved: publicProcedure.query(() => listApprovedCreators()),
    listPending: protectedProcedure.query(async ({ ctx }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      return listPendingCreators();
    }),
    getMyApplication: protectedProcedure.query(async ({ ctx }) => {
      return getCreatorByUserId(ctx.user.id);
    }),
    submitApplication: protectedProcedure
      .input(z.object({
        bio: z.string().optional(),
        category: z.string().optional(),
        youtube: z.string().optional(),
        twitch: z.string().optional(),
        twitter: z.string().optional(),
        instagram: z.string().optional(),
        tiktok: z.string().optional(),
        facebook: z.string().optional(),
        kick: z.string().optional(),
        subscribers: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return applyAsCreator(ctx.user.id, input);
      }),
    /** Update the caller's streaming channel handles (twitch, youtube, etc.) */
    updateChannels: protectedProcedure
      .input(z.object({
        twitch: z.string().max(128).optional(),
        youtube: z.string().max(256).optional(),
        twitter: z.string().max(128).optional(),
        instagram: z.string().max(128).optional(),
        tiktok: z.string().max(128).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getCreatorByUserId(ctx.user.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "No tienes una solicitud de creador activa" });
        await applyAsCreator(ctx.user.id, input);
        return { success: true };
      }),
    review: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["approved", "rejected"]),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
        // Get creator to find userId before reviewing
        const db = await getDb();
        let creatorUserId: number | null = null;
        if (db) {
          const { contentCreators: cc } = await import("../drizzle/schema");
          const rows = await db.select({ userId: cc.userId }).from(cc).where(eq(cc.id, input.id)).limit(1);
          creatorUserId = rows[0]?.userId ?? null;
        }
        const result = await reviewCreator(input.id, input.status, input.adminNote);
        // Emit event for notifications
        if (creatorUserId) {
          if (input.status === "approved") {
            eventBus.emit("creator.verified", { userId: creatorUserId });
          } else {
            eventBus.emit("creator.rejected", { userId: creatorUserId });
          }
        }
        return result;
      }),
  }),
  // ─── Verification ─────────────────────────────────────────────────────────────
  verification: router({
    request: protectedProcedure
      .input(z.object({ reason: z.string().min(10).max(500) }))
      .mutation(async ({ ctx, input }) => {
        return requestVerification(ctx.user.id, input.reason);
      }),
    myRequest: protectedProcedure.query(async ({ ctx }) => {
      return getMyVerificationRequest(ctx.user.id);
    }),
    list: protectedProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected", "all"]).optional() }))
      .query(async ({ ctx, input }) => {
        if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
        return listVerificationRequests(input.status === "all" ? undefined : input.status);
      }),
    review: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        status: z.enum(["approved", "rejected"]),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
        return reviewVerificationRequest(input.requestId, ctx.user.id, input.status, input.adminNote);
      }),
  }),
  // ─── Home Feed ──────────────────────────────────────────────────────────────
  home: router({
    featuredTournaments: publicProcedure.query(() => getFeaturedTournaments(6)),
    recentUsers: publicProcedure.query(() => getRecentUsers(20)),
    suggestedUsers: protectedProcedure.query(async ({ ctx }) => getSuggestedUsers(ctx.user.id, 20)),
    // Platform stats (public)
    stats: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { totalUsers: 0, totalTeams: 0, totalTournaments: 0, activeTournaments: 0 };
      const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [totalTeams] = await db.select({ count: sql<number>`count(*)` }).from(teams);
      const [totalTournaments] = await db.select({ count: sql<number>`count(*)` }).from(tournaments);
      const [activeTournaments] = await db.select({ count: sql<number>`count(*)` }).from(tournaments)
        .where(inArray(tournaments.status, ["registration_open", "in_progress"]));
      return {
        totalUsers: Number(totalUsers.count),
        totalTeams: Number(totalTeams.count),
        totalTournaments: Number(totalTournaments.count),
        activeTournaments: Number(activeTournaments.count),
      };
    }),
    // Top teams for leaderboard
    topTeams: publicProcedure.query(() => getTeamRanking({ limit: 20 })),
    // Recent news
    recentNews: publicProcedure.query(() => getNews({ publishedOnly: true, limit: 3 })),
    // Featured creators
    featuredCreators: publicProcedure.query(async () => {
      const all = await listApprovedCreators();
      return all.slice(0, 4);
    }),
    // Available missions (public preview)
    availableMissions: publicProcedure.query(() => getRewardTasks()),
    // Featured ads for home (featured type only)
    featuredAds: publicProcedure.query(async () => {
      const all = await getBrandAds(true);
      return all.filter((a: any) => a.adType === "featured").slice(0, 3);
    }),
  }),
  // ─── Section Banners ─────────────────────────────────────────────────────────
  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: router({
    // Get all notifications for the current user
    list: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }))
      .query(async ({ ctx, input }) => {
        return getUserNotifications(ctx.user.id, input.limit ?? 30);
      }),
    // Get unread count (for badge)
    unreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const count = await getUnreadCount(ctx.user.id);
        return { count };
      }),
    // Mark all as read
    markAllRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await markAllRead(ctx.user.id);
        return { success: true };
      }),
    // Mark one as read
    markOneRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markOneRead(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  banners: router({
    // Public: get banner for a specific section
    getSection: publicProcedure
      .input(z.object({ sectionKey: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const rows = await db.select().from(sectionBanners).where(eq(sectionBanners.sectionKey, input.sectionKey)).limit(1);
        return rows[0] ?? null;
      }),
    // Public: get all active banners
    listAll: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(sectionBanners);
    }),
    // Admin: upsert banner for a section
    upsert: adminProcedure
      .input(z.object({
        sectionKey: z.string().max(64),
        imageUrl: z.string().url().optional().nullable(),
        mobileImageUrl: z.string().url().optional().nullable(),
        title: z.string().max(256).optional().nullable(),
        subtitle: z.string().max(512).optional().nullable(),
        linkUrl: z.string().url().optional().nullable(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const existing = await db.select().from(sectionBanners).where(eq(sectionBanners.sectionKey, input.sectionKey)).limit(1);
        const { sectionKey, ...rest } = input;
        if (existing.length > 0) {
          await db.update(sectionBanners).set(rest).where(eq(sectionBanners.sectionKey, sectionKey));
        } else {
          await db.insert(sectionBanners).values({ sectionKey, ...rest, isActive: rest.isActive ?? true });
        }
        const rows = await db.select().from(sectionBanners).where(eq(sectionBanners.sectionKey, sectionKey)).limit(1);
        return rows[0];
      }),
    // Admin: upload image for a section banner
    uploadImage: adminProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml", "image/bmp", "image/tiff"]),
        sectionKey: z.string(),
        isMobile: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const ext = input.mimeType.split("/")[1];
        const key = `banners/${input.sectionKey}/${input.isMobile ? "mobile" : "desktop"}-${Date.now()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ─── Allies (Sponsor Store Directory) ─────────────────────────────────────
  allies: router({
    // Public: list approved allies with optional filters
    list: publicProcedure
      .input(z.object({
        country: z.string().optional(),
        city: z.string().optional(),
        search: z.string().optional(),
        featuredOnly: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        const { allies: alliesTable } = await import("../drizzle/schema");
        const { like, or: orOp, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(alliesTable.status, "approved")];
        if (input?.country) conditions.push(eq(alliesTable.country, input.country));
        if (input?.city) conditions.push(eq(alliesTable.city, input.city));
        if (input?.featuredOnly) conditions.push(eq(alliesTable.isFeatured, true));
        if (input?.search) {
          conditions.push(
            orOp(
              like(alliesTable.name, `%${input.search}%`),
              like(alliesTable.description, `%${input.search}%`),
              like(alliesTable.city, `%${input.search}%`)
            )!
          );
        }
        return db.select().from(alliesTable).where(and(...conditions)).orderBy(desc(alliesTable.isFeatured), alliesTable.name);
      }),

    // Public: get distinct countries and cities for filter dropdowns
    locations: publicProcedure.query(async () => {
      const db = await getDb();
      const { allies: alliesTable } = await import("../drizzle/schema");
      const rows = await db
        .selectDistinct({ country: alliesTable.country, city: alliesTable.city })
        .from(alliesTable)
        .where(eq(alliesTable.status, "approved"));
      const countries = [...new Set(rows.map((r: any) => r.country).filter(Boolean))].sort() as string[];
      const cities = [...new Set(rows.map((r: any) => r.city).filter(Boolean))].sort() as string[];
      return { countries, cities };
    }),

    // Public: submit a new ally application
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(2).max(256),
        description: z.string().optional(),
        logo: z.string().url().optional().nullable(),
        coverImage: z.string().url().optional().nullable(),
        website: z.string().url().optional().nullable(),
        country: z.string().max(128).optional(),
        city: z.string().max(128).optional(),
        address: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().max(64).optional(),
        instagram: z.string().max(128).optional(),
        twitter: z.string().max(128).optional(),
        facebook: z.string().max(128).optional(),
        tiktok: z.string().max(128).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const { allies: alliesTable } = await import("../drizzle/schema");
        const userId = (ctx as any).user?.id ?? null;
        await db.insert(alliesTable).values({
          ...input,
          status: "pending",
          submittedBy: userId,
        });
        return { success: true };
      }),

    // Admin: list all allies (any status)
    adminList: adminProcedure.query(async () => {
      const db = await getDb();
      const { allies: alliesTable } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      return db.select().from(alliesTable).orderBy(desc(alliesTable.createdAt));
    }),

    // Admin: approve / reject / feature / edit
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        isFeatured: z.boolean().optional(),
        adminNote: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        logo: z.string().url().optional().nullable(),
        coverImage: z.string().url().optional().nullable(),
        website: z.string().url().optional().nullable(),
        country: z.string().optional(),
        city: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        instagram: z.string().optional(),
        twitter: z.string().optional(),
        facebook: z.string().optional(),
        tiktok: z.string().optional(),
        email: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { allies: alliesTable } = await import("../drizzle/schema");
        const { id, ...rest } = input;
        // Check previous status to detect approval transition
        const [before] = await db.select({ status: alliesTable.status }).from(alliesTable).where(eq(alliesTable.id, id)).limit(1);
        await db.update(alliesTable).set(rest).where(eq(alliesTable.id, id));
        // Trigger auto-news when an ally is approved for the first time
        if (input.status === "approved" && before?.status !== "approved") {
          const { handleAllyApproved } = await import("./newsGenerator");
          handleAllyApproved(id).catch((err: Error) => console.error("[NewsGenerator] ally error:", err));
        }
        return { success: true };
      }),
    // Admin: delete
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { allies: alliesTable } = await import("../drizzle/schema");
        await db.delete(alliesTable).where(eq(alliesTable.id, input.id));
        return { success: true };
      }),

    // Admin: upload image for an ally
    uploadImage: adminProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]),
        allyId: z.number().optional(),
        type: z.enum(["logo", "cover"]),
      }))
      .mutation(async ({ input }) => {
        const ext = input.mimeType.split("/")[1];
        const key = `allies/${input.allyId ?? "new"}/${input.type}-${Date.now()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ─── Series BOx ─────────────────────────────────────────────────────────────
  series: router({
    /** Obtiene la serie y sus mapas para un match */
    byMatch: publicProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return getSeriesWithMaps(input.matchId);
      }),

    /** Crea una serie BOx para un match existente */
    create: premiumProcedure
      .input(z.object({
        matchId: z.number(),
        tournamentId: z.number(),
        format: z.enum(["BO1", "BO2", "BO3", "BO5", "BO7"]),
        scheduledAt: z.string().optional(), // ISO date string
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : undefined;
        return createMatchSeries({
          matchId: input.matchId,
          tournamentId: input.tournamentId,
          format: input.format,
          scheduledAt,
        });
      }),

    /** Reporta el resultado de un mapa individual dentro de la serie */
    reportMap: premiumProcedure
      .input(z.object({
        seriesId: z.number(),
        mapNumber: z.number().int().min(1),
        scoreTeam1: z.number().int().min(0),
        scoreTeam2: z.number().int().min(0),
        team1Id: z.number(),
        team2Id: z.number(),
        tournamentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const result = await reportMapResult({
          seriesId: input.seriesId,
          mapNumber: input.mapNumber,
          scoreTeam1: input.scoreTeam1,
          scoreTeam2: input.scoreTeam2,
          team1Id: input.team1Id,
          team2Id: input.team2Id,
        });

        // Emitir evento en tiempo real
        eventBus.emit("series.map_reported", {
          seriesId: input.seriesId,
          mapNumber: input.mapNumber,
          ...result,
        });

        if (result.seriesComplete) {
          eventBus.emit("series.completed", {
            seriesId: input.seriesId,
            winnerId: result.seriesWinnerId,
            isDraw: result.isDraw,
          });
        }

        return result;
      }),

    /** Verifica si las apuestas de una serie están abiertas */
    bettingOpen: publicProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return isSeriesBettingOpen(input.matchId);
      }),

    /** Admin: resuelve manualmente las apuestas de una serie */
    resolveBets: premiumProcedure
      .input(z.object({
        matchId: z.number(),
        tournamentId: z.number(),
        winnerTeamId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await resolveSeriesBets(input.matchId, input.tournamentId, input.winnerTeamId);
        return { ok: true };
      }),

    /**
     * submitMapResult — Punto de entrada principal del orquestador.
     *
     * Registra el resultado de un mapa individual dentro de una serie BOx.
     * Valida la lógica BOx, detecta si la serie terminó y dispara automáticamente:
     *   - Cancelación de mapas restantes
     *   - Actualización del match en el bracket
     *   - Pago de apuestas (pool betting, comisión 5%)
     *   - Sincronización de rankings del torneo
     *   - Avance del bracket al siguiente round
     */
    submitMapResult: premiumProcedure
      .input(z.object({
        seriesId: z.number(),
        mapNumber: z.number().int().min(1),
        scoreTeam1: z.number().int().min(0),
        scoreTeam2: z.number().int().min(0),
        team1Id: z.number(),
        team2Id: z.number(),
        tournamentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar que el usuario es organizador del torneo o admin
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND", message: "Torneo no encontrado" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Solo el organizador puede registrar resultados" });
        }

        const result = await orchestratorSubmitMapResult({
          seriesId: input.seriesId,
          mapNumber: input.mapNumber,
          scoreTeam1: input.scoreTeam1,
          scoreTeam2: input.scoreTeam2,
          team1Id: input.team1Id,
          team2Id: input.team2Id,
          tournamentId: input.tournamentId,
        });

        // Invalidar caché del bracket para que el LiveBracket vea el resultado inmediatamente
        cache.del(CacheKey.bracket(input.tournamentId));
        if (result.seriesComplete) {
          cache.del(CacheKey.rankings(input.tournamentId));
          cache.del(CacheKey.tournament(input.tournamentId));
        }

        // Emitir eventos en tiempo real para el bracket en vivo
        eventBus.emit("series.map_reported", {
          seriesId: input.seriesId,
          mapNumber: input.mapNumber,
          tournamentId: input.tournamentId,
          ...result,
        });

        if (result.seriesComplete) {
          eventBus.emit("series.completed", {
            seriesId: input.seriesId,
            tournamentId: input.tournamentId,
            winnerId: result.seriesWinnerId,
            isDraw: result.isDraw,
            finalScore: result.seriesScore,
          });
        }

        return result;
      }),

    /**
     * scheduleMatch — Programa un match y calcula automáticamente las ventanas de apuestas.
     *
     * Regla 60/5:
     *   betsOpenAt  = scheduledAt - 60 min
     *   betsCloseAt = scheduledAt - 5 min
     */
    scheduleMatch: premiumProcedure
      .input(z.object({
        matchId: z.number(),
        tournamentId: z.number(),
        scheduledAt: z.string(), // ISO date string
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const scheduledAt = new Date(input.scheduledAt);
        await scheduleMatchBettingWindow(input.matchId, scheduledAt);
        return { ok: true, scheduledAt: scheduledAt.toISOString() };
      }),

    /** Obtiene el ranking del torneo ordenado por puntos + desempate por mapas. */
    rankings: publicProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { tournamentRankings } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        return db
          .select()
          .from(tournamentRankings)
          .where(eq(tournamentRankings.tournamentId, input.tournamentId))
          .orderBy(
            desc(tournamentRankings.points),
            desc(tournamentRankings.seriesWon),
            desc(tournamentRankings.mapDiff),
            desc(tournamentRankings.mapsWon)
          );
      }),
  }),
});
export type AppRouter = typeof appRouter;

