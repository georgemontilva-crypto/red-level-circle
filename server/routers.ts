import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addTeamMember,
  countPendingRegistrations,
  createRegistration,
  createTeam,
  createTournament,
  generateBracket,
  getMatchesByTournament,
  getRegistrationAuditLog,
  getRegistrationById,
  getRegistrationsByTeam,
  getRegistrationsByTournament,
  getTeamById,
  getTeamMembers,
  getTeamsByUser,
  getTournamentById,
  getTournaments,
  updateMatchResult,
  updateRegistrationStatus,
  updateTournament,
  updateTournamentStatus,
  updateUserRole,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// ─── Premium guard ────────────────────────────────────────────────────────────
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

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    upgradeToPremiun: protectedProcedure.mutation(async ({ ctx }) => {
      // Simulated upgrade - in production this would go through payment
      await updateUserRole(ctx.user.id, "premium");
      return { success: true };
    }),
  }),

  // ─── Tournaments ────────────────────────────────────────────────────────────
  tournaments: router({
    list: publicProcedure
      .input(
        z.object({
          status: z.string().optional(),
          game: z.string().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getTournaments({
          ...input,
          isPublic: true,
        });
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
      .input(
        z.object({
          name: z.string().min(3).max(256),
          game: z.string().min(1).max(64),
          description: z.string().optional(),
          rules: z.string().optional(),
          bracketType: z.enum(["single_elimination", "double_elimination", "groups"]),
          maxTeams: z.number().int().min(2).max(256).default(16),
          minPlayersPerTeam: z.number().int().min(1).max(20).default(1),
          maxPlayersPerTeam: z.number().int().min(1).max(20).default(5),
          prizeDescription: z.string().optional(),
          prizeAmount: z.number().int().min(0).default(0),
          registrationStart: z.number().optional(),
          registrationEnd: z.number().optional(),
          startDate: z.number().optional(),
          endDate: z.number().optional(),
          isPublic: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createTournament({
          ...input,
          creatorId: ctx.user.id,
          registrationStart: input.registrationStart ? new Date(input.registrationStart) : undefined,
          registrationEnd: input.registrationEnd ? new Date(input.registrationEnd) : undefined,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        });
        return { id };
      }),

    update: premiumProcedure
      .input(
        z.object({
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
          prizeAmount: z.number().int().min(0).optional(),
          registrationStart: z.number().optional(),
          registrationEnd: z.number().optional(),
          startDate: z.number().optional(),
          endDate: z.number().optional(),
          isPublic: z.boolean().optional(),
        })
      )
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
      .input(
        z.object({
          id: z.number(),
          status: z.enum([
            "draft",
            "registration_open",
            "registration_closed",
            "in_progress",
            "completed",
            "cancelled",
          ]),
        })
      )
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
        // Get approved teams
        const registrations = await getRegistrationsByTournament(input.id, "Aprobado");
        if (registrations.length < 2) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Se necesitan al menos 2 equipos aprobados para iniciar el torneo.",
          });
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
        await updateTournament(input.tournamentId, {
          winnerId: input.winnerId,
          status: "completed",
        });
        return { success: true };
      }),
  }),

  // ─── Teams ──────────────────────────────────────────────────────────────────
  teams: router({
    myTeams: protectedProcedure.query(async ({ ctx }) => {
      return getTeamsByUser(ctx.user.id);
    }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const team = await getTeamById(input.id);
        if (!team) throw new TRPCError({ code: "NOT_FOUND" });
        const members = await getTeamMembers(input.id);
        return { ...team, members };
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(128),
          description: z.string().optional(),
          game: z.string().optional(),
          logo: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createTeam({ ...input, captainId: ctx.user.id });
        return { id };
      }),

    addMember: protectedProcedure
      .input(
        z.object({
          teamId: z.number(),
          userId: z.number(),
          role: z.enum(["player", "substitute"]).default("player"),
          gameId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND" });
        if (team.captainId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await addTeamMember(input);
        return { success: true };
      }),
  }),

  // ─── Registrations ──────────────────────────────────────────────────────────
  registrations: router({
    byTournament: premiumProcedure
      .input(
        z.object({
          tournamentId: z.number(),
          status: z.string().optional(),
        })
      )
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
      .input(
        z.object({
          tournamentId: z.number(),
          teamId: z.number(),
          teamMessage: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const t = await getTournamentById(input.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.status !== "registration_open") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Las inscripciones para este torneo no están abiertas.",
          });
        }
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Equipo no encontrado." });
        if (team.captainId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Solo el capitán puede inscribir el equipo." });
        }
        const members = await getTeamMembers(input.teamId);
        if (members.length < t.minPlayersPerTeam) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `El equipo necesita al menos ${t.minPlayersPerTeam} jugador(es).`,
          });
        }
        const id = await createRegistration(input);
        return { id };
      }),

    updateStatus: premiumProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["Aprobado", "Rechazado", "Cancelado"]),
          creatorMessage: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const reg = await getRegistrationById(input.id);
        if (!reg) throw new TRPCError({ code: "NOT_FOUND" });
        const t = await getTournamentById(reg.tournamentId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        if (t.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateRegistrationStatus(
          input.id,
          input.status,
          ctx.user.id,
          input.creatorMessage
        );
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

  // ─── Matches ────────────────────────────────────────────────────────────────
  matches: router({
    byTournament: publicProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return getMatchesByTournament(input.tournamentId);
      }),

    updateResult: premiumProcedure
      .input(
        z.object({
          matchId: z.number(),
          tournamentId: z.number(),
          winnerId: z.number(),
          team1Score: z.number().int().min(0).optional(),
          team2Score: z.number().int().min(0).optional(),
          notes: z.string().optional(),
        })
      )
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

  // ─── Admin ──────────────────────────────────────────────────────────────────
  admin: router({
    setRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "premium", "admin"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
