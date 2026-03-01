/**
 * Bets Closing Job
 * Runs every minute and closes betting windows for matches whose betsCloseAt has passed.
 * Sends an in-app notification to every bettor affected.
 */
import { getDb } from "./db";
import { bets, tournamentMatches, teams } from "../drizzle/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { createNotification } from "./notifications";
import { notifyOwner } from "./_core/notification";

// Track which matches we've already closed to avoid duplicate notifications
const closedMatchIds = new Set<number>();

async function closeBettingWindows(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  // Find pending matches whose betsCloseAt has passed and we haven't processed yet
  const matchesToClose = await db
    .select({
      id: tournamentMatches.id,
      team1Id: tournamentMatches.team1Id,
      team2Id: tournamentMatches.team2Id,
      betsCloseAt: tournamentMatches.betsCloseAt,
      scheduledAt: tournamentMatches.scheduledAt,
      tournamentId: tournamentMatches.tournamentId,
    })
    .from(tournamentMatches)
    .where(
      and(
        eq(tournamentMatches.status, "pending"),
        isNotNull(tournamentMatches.betsCloseAt),
        lte(tournamentMatches.betsCloseAt, now)
      )
    );

  for (const match of matchesToClose) {
    if (closedMatchIds.has(match.id)) continue;
    closedMatchIds.add(match.id);

    // Get all pending bets for this match
    const pendingBets = await db
      .select({ id: bets.id, userId: bets.userId, amount: bets.amount, teamId: bets.teamId })
      .from(bets)
      .where(and(eq(bets.matchId, match.id), eq(bets.status, "pending")));

    if (pendingBets.length === 0) continue;

    // Resolve team names for the notification message
    let team1Name = "Equipo 1";
    let team2Name = "Equipo 2";
    try {
      if (match.team1Id) {
        const [t1] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, match.team1Id)).limit(1);
        if (t1) team1Name = t1.name;
      }
      if (match.team2Id) {
        const [t2] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, match.team2Id)).limit(1);
        if (t2) team2Name = t2.name;
      }
    } catch (_) { /* non-critical */ }

    const vsLabel = `${team1Name} vs ${team2Name}`;
    const scheduledStr = match.scheduledAt
      ? new Date(match.scheduledAt).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
      : "próximamente";

    // Notify each unique bettor
    const notifiedUsers = new Set<number>();
    for (const bet of pendingBets) {
      if (notifiedUsers.has(bet.userId)) continue;
      notifiedUsers.add(bet.userId);

      try {
        await createNotification({
          userId: bet.userId,
          type: "general",
          title: "⏰ Apuestas cerradas",
          message: `Las apuestas para el partido ${vsLabel} (${scheduledStr}) han cerrado. ¡Espera el resultado!`,
          link: "/betting",
          referenceId: match.id,
          referenceType: "match",
        });
      } catch (e) {
        console.warn(`[BetsClosingJob] Failed to notify user ${bet.userId}:`, e);
      }
    }

    // Notify owner
    try {
      await notifyOwner({
        title: `🔒 Apuestas cerradas: ${vsLabel}`,
        content: `Las apuestas del partido ${vsLabel} (partido #${match.id}) han cerrado automáticamente. ${pendingBets.length} apuesta(s) pendiente(s). Partido programado: ${scheduledStr}.`,
      });
    } catch (_) { /* non-critical */ }

    console.log(`[BetsClosingJob] Closed bets for match #${match.id} (${vsLabel}), notified ${notifiedUsers.size} bettors.`);
  }
}

export function startBetsClosingJob(): void {
  // Run immediately on start, then every 60 seconds
  closeBettingWindows().catch(console.error);
  setInterval(() => {
    closeBettingWindows().catch(console.error);
  }, 60_000);
  console.log("[BetsClosingJob] Started — checking every 60s for expired betting windows.");
}
