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
  createTeam,
  createTournament,
  generateBracket,
  getActivePromotions,
  getAllUsers,
  getBetsByTournament,
  getBetsByUser,
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
  adminUpdateUserRole,
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
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

// ─── Guards ───────────────────────────────────────────────────────────────────
const premiumProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "premium" && ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Esta funcionalidad requiere una cuenta Premium.",
    });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
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
      await updateUserRole(ctx.user.id, "premium");
      return { success: true };
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        nickname: z.string().max(64).optional(),
        bio: z.string().max(500).optional(),
        mainGame: z.string().max(64).optional(),
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
        game: z.string().optional(),
        search: z.string().optional(),
        featured: z.boolean().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getTournaments({ ...input, isPublic: true });
      }),

    myTournaments: premiumProcedure.query(async ({ ctx }) => {
      return getTournaments({ creatorId: ctx.user.id });
    }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const t = await getTournamentById(input.id);
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
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.id);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
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
        if (t.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateTournamentStatus(input.id, input.status);
        return { success: true };
      }),

    startTournament: premiumProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.id);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const registrations = await getRegistrationsByTournament(input.id, "Aprobado");
        if (registrations.length < 2) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Se necesitan al menos 2 equipos aprobados." });
        }
        const teamIds = registrations.map((r) => r.teamId);
        await generateBracket(input.id, teamIds);
        await updateTournamentStatus(input.id, "in_progress");
        return { success: true, matchCount: teamIds.length };
      }),

    declareWinner: premiumProcedure
      .input(z.object({ tournamentId: z.number(), winnerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
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
  }),

  // ─── Teams ─────────────────────────────────────────────────────────────────
  teams: router({
    list: publicProcedure
      .input(z.object({ game: z.string().optional(), search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getTeamRanking({ game: input?.game });
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
        if (team.captainId !== ctx.user.id && ctx.user.role !== "admin") {
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
        if (team.captainId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await addTeamMember(input);
        return { success: true };
      }),

    ranking: publicProcedure
      .input(z.object({ game: z.string().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getTeamRanking({ game: input?.game, limit: input?.limit ?? 50 });
      }),
  }),

  // ─── Registrations ─────────────────────────────────────────────────────────
  registrations: router({
    byTournament: premiumProcedure
      .input(z.object({ tournamentId: z.number(), status: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getRegistrationsByTournament(input.tournamentId, input.status);
      }),

    myRegistrations: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND" });
        if (team.captainId !== ctx.user.id && ctx.user.role !== "admin") {
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
        if (team.captainId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Solo el capitán puede inscribir el equipo." });
        }
        const members = await getTeamMembers(input.teamId);
        if (members.length < t.minPlayersPerTeam) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `El equipo necesita al menos ${t.minPlayersPerTeam} jugador(es).` });
        }
        const id = await createRegistration(input);
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
        if (t.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateRegistrationStatus(input.id, input.status, ctx.user.id, input.creatorMessage);
        return { success: true };
      }),

    auditLog: premiumProcedure
      .input(z.object({ registrationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const reg = await getRegistrationById(input.registrationId);
        if (!reg) throw new TRPCError({ code: "NOT_FOUND" });
        const t = await getTournamentById(reg.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
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
        return getMatchesByTournament(input.tournamentId);
      }),

    updateResult: premiumProcedure
      .input(z.object({
        matchId: z.number(),
        tournamentId: z.number(),
        winnerId: z.number(),
        team1Score: z.number().int().min(0).optional(),
        team2Score: z.number().int().min(0).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { matchId, tournamentId, ...data } = input;
        await updateMatchResult(matchId, data);
        return { success: true };
      }),
  }),

  // ─── News ──────────────────────────────────────────────────────────────────
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
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createNews({
          ...input,
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
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.isPublished) {
          await updateNews(id, { ...data, publishedAt: new Date() });
        } else {
          await updateNews(id, data);
        }
        return { success: true };
      }),

    adminList: adminProcedure.query(async () => {
      return getNews({ publishedOnly: false });
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
        await upsertGame(input);
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

    create: premiumProcedure
      .input(z.object({
        tournamentId: z.number().optional(),
        title: z.string().min(1).max(256),
        platform: z.enum(["twitch", "youtube", "discord", "other"]),
        url: z.string().url(),
        embedUrl: z.string().optional(),
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
  }),

  // ─── Ranking ───────────────────────────────────────────────────────────────
  ranking: router({
    teams: publicProcedure
      .input(z.object({ game: z.string().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getTeamRanking({ game: input?.game, limit: input?.limit ?? 50 });
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
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    setRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "premium", "admin"]) }))
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
      .input(z.object({ userId: z.number(), role: z.enum(["user", "premium", "admin"]) }))
      .mutation(async ({ input }) => {
        await adminUpdateUserRole(input.userId, input.role);
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
    createShopItem: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        price: z.number().int().min(1),
        stock: z.number().int().default(-1),
        category: z.enum(["physical", "digital", "bundle", "limited"]),
      }))
      .mutation(async ({ input }) => {
        await adminCreateShopItem({ name: input.name, description: input.description, image: input.imageUrl, price: input.price, stock: input.stock, category: input.category });
        return { success: true };
      }),
    listAds: adminProcedure
      .query(async () => adminListBrandAds()),
    createAd: adminProcedure
      .input(z.object({
        brand: z.string(),
        title: z.string(),
        description: z.string().optional(),
        imageUrl: z.string(),
        linkUrl: z.string().optional(),
        isPremium: z.boolean().default(false),
        isFeatured: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        await createBrandAd({ brandName: input.brand, title: input.title, description: input.description, bannerImage: input.imageUrl, destinationUrl: input.linkUrl, isPremium: input.isPremium, isFeatured: input.isFeatured });
        return { success: true };
      }),
    updateAd: adminProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        await adminUpdateBrandAd(input.id, { isActive: input.isActive });
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
        durationSeconds: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        await adminCreateRewardTask({ title: input.title, description: input.description, type: input.type, reward: input.rewardAmount, contentUrl: input.contentUrl, durationSeconds: input.durationSeconds });
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
        await adminApproveTournament(input.id);
        return { success: true };
      }),
    rejectTournament: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminRejectTournament(input.id);
        return { success: true };
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
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await buyShopItem(ctx.user.id, input.itemId, input.quantity, input.userNote);
        // Notify admin
        const item = await getShopItemById(input.itemId);
        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: `🛒 Nueva compra en la tienda`,
            content: `${ctx.user.name ?? ctx.user.openId} compró ${input.quantity}x "${item?.name}" por ${result.totalPrice} RLC Coins. Pedido #${result.orderId} — Estado: Pendiente de entrega.`,
          });
        } catch {}
        return result;
      }),

    myOrders: protectedProcedure
      .query(async ({ ctx }) => getShopOrders(ctx.user.id)),
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
        mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
        type: z.enum(["avatar", "banner"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const ext = input.mimeType.split("/")[1];
        const key = `profiles/${ctx.user.id}/${input.type}-${Date.now()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
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
});
export type AppRouter = typeof appRouter;
