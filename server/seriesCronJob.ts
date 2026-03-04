/**
 * seriesCronJob.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cron Job de Orquestación de Series BOx para Railway.
 * Se ejecuta cada minuto y gestiona las transiciones de estado de los matches.
 *
 * Regla 60/5:
 *   - Abre apuestas 60 minutos antes del inicio del match (→ betting_open)
 *   - Bloquea apuestas 5 minutos antes del inicio del match (→ locked)
 *
 * Ciclo de vida completo de un match:
 *
 *   pending
 *     │  (scheduledAt - 60 min)
 *     ▼
 *   betting_open  ← notifica a usuarios que pueden apostar
 *     │  (scheduledAt - 5 min)
 *     ▼
 *   locked        ← notifica que las apuestas cerraron
 *     │  (manual: organizador inicia el match)
 *     ▼
 *   in_progress
 *     │  (automático: submitMapResult completa la serie)
 *     ▼
 *   completed
 *
 * Configuración en Railway:
 *   - Cron expression: * * * * * (cada minuto)
 *   - O bien: llamar a startSeriesCronJob() desde el servidor principal.
 */

import { and, eq, isNotNull, lte, gte, ne } from "drizzle-orm";
import { getDb } from "./db";
import { tournamentMatches, matchSeries, bets, teams } from "../drizzle/schema";
import { createNotification } from "./notifications";
import { notifyOwner } from "./_core/notification";

// ─── Estado interno del job ───────────────────────────────────────────────────

/** Matches ya procesados en esta sesión (evita notificaciones duplicadas). */
const processedOpenIds = new Set<number>();
const processedLockIds = new Set<number>();

// ─── Función principal del tick ───────────────────────────────────────────────

async function runSeriesCronTick(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  // ── PASO 1: Abrir apuestas (pending → betting_open) ───────────────────────
  // Matches con betsOpenAt ≤ now y status = pending
  const matchesToOpen = await db
    .select({
      id: tournamentMatches.id,
      team1Id: tournamentMatches.team1Id,
      team2Id: tournamentMatches.team2Id,
      tournamentId: tournamentMatches.tournamentId,
      scheduledAt: tournamentMatches.scheduledAt,
      betsOpenAt: tournamentMatches.betsOpenAt,
      betsCloseAt: tournamentMatches.betsCloseAt,
    })
    .from(tournamentMatches)
    .where(
      and(
        eq(tournamentMatches.status, "pending"),
        isNotNull(tournamentMatches.betsOpenAt),
        lte(tournamentMatches.betsOpenAt, now)
      )
    );

  for (const match of matchesToOpen) {
    if (processedOpenIds.has(match.id)) continue;
    processedOpenIds.add(match.id);

    // Transición de estado
    await db
      .update(tournamentMatches)
      .set({ status: "betting_open" })
      .where(eq(tournamentMatches.id, match.id));

    // Resolver nombres de equipos para notificaciones
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
    const closeStr = match.betsCloseAt
      ? new Date(match.betsCloseAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : "próximamente";

    // Notificar al organizador del torneo
    try {
      await notifyOwner({
        title: `🟢 Apuestas abiertas: ${vsLabel}`,
        content: `Las apuestas para el match #${match.id} (${vsLabel}) están ahora abiertas. Se cerrarán a las ${closeStr}.`,
      });
    } catch (_) { /* non-critical */ }

    console.log(`[SeriesCron] ✅ Apuestas ABIERTAS: match #${match.id} (${vsLabel})`);
  }

  // ── PASO 2: Bloquear apuestas (betting_open → locked) ─────────────────────
  // Matches con betsCloseAt ≤ now y status = betting_open
  const matchesToLock = await db
    .select({
      id: tournamentMatches.id,
      team1Id: tournamentMatches.team1Id,
      team2Id: tournamentMatches.team2Id,
      tournamentId: tournamentMatches.tournamentId,
      scheduledAt: tournamentMatches.scheduledAt,
    })
    .from(tournamentMatches)
    .where(
      and(
        eq(tournamentMatches.status, "betting_open"),
        isNotNull(tournamentMatches.betsCloseAt),
        lte(tournamentMatches.betsCloseAt, now)
      )
    );

  for (const match of matchesToLock) {
    if (processedLockIds.has(match.id)) continue;
    processedLockIds.add(match.id);

    // Transición de estado
    await db
      .update(tournamentMatches)
      .set({ status: "locked" })
      .where(eq(tournamentMatches.id, match.id));

    // Resolver nombres de equipos
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

    // Notificar a todos los apostadores del match
    const pendingBets = await db
      .select({ id: bets.id, userId: bets.userId, amount: bets.amount })
      .from(bets)
      .where(and(eq(bets.matchId, match.id), eq(bets.status, "pending")));

    const notifiedUsers = new Set<number>();
    for (const bet of pendingBets) {
      if (notifiedUsers.has(bet.userId)) continue;
      notifiedUsers.add(bet.userId);
      try {
        await createNotification({
          userId: bet.userId,
          type: "general",
          title: "🔒 Apuestas cerradas",
          message: `Las apuestas para ${vsLabel} (${scheduledStr}) han cerrado. ¡El match comienza pronto!`,
          link: "/betting",
          referenceId: match.id,
          referenceType: "match",
        });
      } catch (_) { /* non-critical */ }
    }

    // Notificar al organizador
    try {
      await notifyOwner({
        title: `🔒 Apuestas bloqueadas: ${vsLabel}`,
        content: `Las apuestas del match #${match.id} (${vsLabel}) han cerrado. ${pendingBets.length} apuesta(s) en escrow. Inicio: ${scheduledStr}.`,
      });
    } catch (_) { /* non-critical */ }

    console.log(
      `[SeriesCron] 🔒 Apuestas BLOQUEADAS: match #${match.id} (${vsLabel}) | ` +
      `${notifiedUsers.size} apostadores notificados`
    );
  }

  // ── PASO 3: Limpiar sets de IDs procesados (cada 24h aprox.) ──────────────
  // Para evitar que los sets crezcan indefinidamente en procesos de larga duración
  if (processedOpenIds.size > 10_000) processedOpenIds.clear();
  if (processedLockIds.size > 10_000) processedLockIds.clear();
}

// ─── Exportar el job ──────────────────────────────────────────────────────────

/**
 * Inicia el cron job de series.
 * Llama a esta función desde el servidor principal (index.ts o server.ts).
 *
 * @example
 * import { startSeriesCronJob } from "./seriesCronJob";
 * startSeriesCronJob();
 */
export function startSeriesCronJob(): void {
  // Ejecutar inmediatamente al arrancar
  runSeriesCronTick().catch(console.error);

  // Luego cada 60 segundos
  setInterval(() => {
    runSeriesCronTick().catch(console.error);
  }, 60_000);

  console.log(
    "[SeriesCron] 🚀 Iniciado — regla 60/5 activa (tick cada 60s)\n" +
    "  • betting_open: scheduledAt - 60 min\n" +
    "  • locked:       scheduledAt - 5 min"
  );
}

/**
 * Ejecuta un solo tick manualmente (útil para testing o Railway Cron Jobs).
 * Configurar en Railway como: node -e "require('./dist/seriesCronJob').runOnce()"
 */
export async function runOnce(): Promise<void> {
  console.log("[SeriesCron] Ejecutando tick manual...");
  await runSeriesCronTick();
  console.log("[SeriesCron] Tick manual completado.");
  process.exit(0);
}
