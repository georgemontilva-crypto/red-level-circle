/**
 * Notification helpers for Red Level Circle
 * Creates in-app notifications for users and registers event bus listeners.
 */

import { getDb } from "./db";
import { notifications, tournamentRegistrations, teams } from "../drizzle/schema";
import { eventBus } from "./eventBus";
import { eq, and } from "drizzle-orm";

// ─── Core helper ─────────────────────────────────────────────────────────────

export async function createNotification(params: {
  userId: number;
  type: typeof notifications.$inferInsert["type"];
  title: string;
  message: string;
  link?: string;
  referenceId?: number;
  referenceType?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    referenceId: params.referenceId,
    referenceType: params.referenceType,
    isRead: false,
  });
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export async function getUserNotifications(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(notifications.createdAt)
    .limit(limit);
}

export async function getUnreadCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return rows.length;
}

export async function markAllRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function markOneRead(notificationId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

// ─── Event Bus Listeners ──────────────────────────────────────────────────────

export function registerNotificationListeners(): void {
  // Mission approved → notify creator with coins earned
  eventBus.on("mission.approved", async ({ userId, coins, missionId }) => {
    await createNotification({
      userId,
      type: "mission_approved",
      title: "¡Misión aprobada!",
      message: `Tu misión fue aprobada. Recibiste ${coins} RLC Coins.`,
      link: "/rewards",
      referenceId: missionId,
      referenceType: "mission",
    });
  });

  // Mission rejected → notify creator
  eventBus.on("mission.rejected", async ({ userId, missionId }) => {
    await createNotification({
      userId,
      type: "mission_rejected",
      title: "Misión rechazada",
      message: "Tu envío de misión fue revisado y no fue aprobado. Puedes intentarlo de nuevo.",
      link: "/rewards",
      referenceId: missionId,
      referenceType: "mission",
    });
  });

  // Creator verified → notify user
  eventBus.on("creator.verified", async ({ userId }) => {
    await createNotification({
      userId,
      type: "creator_verified",
      title: "¡Eres Creador Verificado!",
      message: "Tu solicitud de verificación fue aprobada. Ahora tienes acceso a misiones exclusivas.",
      link: "/creators",
    });
  });

  // Creator rejected → notify user
  eventBus.on("creator.rejected", async ({ userId }) => {
    await createNotification({
      userId,
      type: "creator_rejected",
      title: "Solicitud de verificación rechazada",
      message: "Tu solicitud de verificación fue revisada y no fue aprobada en este momento.",
      link: "/creators",
    });
  });

  // Tournament brackets generated → notify all registered team captains
  eventBus.on("tournament.brackets_generated", async ({ tournamentId }) => {
    const db = await getDb();
    if (!db) return;

    const registrations = await db
      .select({
        captainId: teams.captainId,
        teamName: teams.name,
      })
      .from(tournamentRegistrations)
      .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
      .where(eq(tournamentRegistrations.tournamentId, tournamentId));

    for (const reg of registrations) {
      if (reg.captainId) {
        await createNotification({
          userId: reg.captainId,
          type: "bracket_ready",
          title: "¡Brackets generados!",
          message: `Los brackets del torneo están listos. ¡Prepara a tu equipo para competir!`,
          link: `/tournaments/${tournamentId}`,
          referenceId: tournamentId,
          referenceType: "tournament",
        });
      }
    }
  });

  // Match finished → notify both teams
  eventBus.on("tournament.match_finished", async ({ tournamentId, winnerId, loserId }) => {
    const db = await getDb();
    if (!db) return;

    const [winner] = await db
      .select({ captainId: teams.captainId, name: teams.name })
      .from(teams)
      .where(eq(teams.id, winnerId));
    const [loser] = await db
      .select({ captainId: teams.captainId, name: teams.name })
      .from(teams)
      .where(eq(teams.id, loserId));

    if (winner?.captainId) {
      await createNotification({
        userId: winner.captainId,
        type: "match_result",
        title: "¡Victoria!",
        message: `Tu equipo ganó el partido. ¡Siguen avanzando en el torneo!`,
        link: `/tournaments/${tournamentId}`,
        referenceId: tournamentId,
        referenceType: "tournament",
      });
    }
    if (loser?.captainId) {
      await createNotification({
        userId: loser.captainId,
        type: "match_result",
        title: "Resultado del partido",
        message: `Tu equipo fue eliminado del torneo. ¡Sigan entrenando para el próximo!`,
        link: `/tournaments/${tournamentId}`,
        referenceId: tournamentId,
        referenceType: "tournament",
      });
    }
  });

  // Wallet updated → notify user of coins earned
  eventBus.on("wallet.updated", async ({ userId, amount, type, reference }) => {
    if (type === "earn") {
      await createNotification({
        userId,
        type: "coins_earned",
        title: `+${amount} RLC Coins`,
        message: `Recibiste ${amount} RLC Coins. ${reference}`,
        link: "/shop",
      });
    }
  });

  // Order created → notify user
  eventBus.on("order.created", async ({ orderId, userId }) => {
    await createNotification({
      userId,
      type: "order_confirmed",
      title: "Pedido confirmado",
      message: "Tu pedido fue procesado correctamente. Revisa el estado en tu perfil.",
      link: "/shop",
      referenceId: orderId,
      referenceType: "order",
    });
  });

  // Tournament status changed → notify all registered team captains
  eventBus.on("tournament.status_changed", async ({ tournamentId, newStatus, tournamentName }) => {
    const db = await getDb();
    if (!db) return;
    const registrations = await db
      .select({ captainId: teams.captainId, teamName: teams.name })
      .from(tournamentRegistrations)
      .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
      .where(eq(tournamentRegistrations.tournamentId, tournamentId));

    const statusMessages: Record<string, { title: string; message: string }> = {
      registration_open: {
        title: "Inscripciones abiertas",
        message: `Las inscripciones para "${tournamentName}" ya están abiertas. ¡Inscribe tu equipo ahora!`,
      },
      registration_closed: {
        title: "Inscripciones cerradas",
        message: `Las inscripciones para "${tournamentName}" han cerrado. Espera el inicio del torneo.`,
      },
      in_progress: {
        title: "¡El torneo ha comenzado!",
        message: `"${tournamentName}" está en curso. ¡Consulta el bracket y prepárate para competir!`,
      },
      completed: {
        title: "Torneo finalizado",
        message: `"${tournamentName}" ha concluido. ¡Revisa los resultados finales!`,
      },
      cancelled: {
        title: "Torneo cancelado",
        message: `El torneo "${tournamentName}" ha sido cancelado por el organizador.`,
      },
    };

    const notif = statusMessages[newStatus];
    if (!notif) return;

    const captainIds = registrations.map((r) => r.captainId).filter((id): id is number => id !== null && id !== undefined);
    const uniqueCaptains = Array.from(new Set(captainIds));
    for (const captainId of uniqueCaptains) {
      if (captainId) {
        await createNotification({
          userId: captainId,
          type: "general",
          title: notif.title,
          message: notif.message,
          link: `/tournaments/${tournamentId}`,
          referenceId: tournamentId,
          referenceType: "tournament",
        });
      }
    }
  });

  // Registration approved → notify team captain
  eventBus.on("registration.approved", async ({ teamCaptainId, tournamentId, tournamentName, teamName }) => {
    await createNotification({
      userId: teamCaptainId,
      type: "general",
      title: "¡Inscripción aprobada!",
      message: `Tu equipo "${teamName}" fue aceptado en el torneo "${tournamentName}". ¡Prepárense para competir!`,
      link: `/tournaments/${tournamentId}`,
      referenceId: tournamentId,
      referenceType: "tournament",
    });
  });

  // Registration rejected → notify team captain
  eventBus.on("registration.rejected", async ({ teamCaptainId, tournamentId, tournamentName, teamName, reason }) => {
    await createNotification({
      userId: teamCaptainId,
      type: "general",
      title: "Inscripción rechazada",
      message: `Tu equipo "${teamName}" no fue aceptado en "${tournamentName}".${reason ? ` Motivo: ${reason}` : ""}`,
      link: `/tournaments/${tournamentId}`,
      referenceId: tournamentId,
      referenceType: "tournament",
    });
  });

  console.log("[EventBus] Notification listeners registered.");
}
