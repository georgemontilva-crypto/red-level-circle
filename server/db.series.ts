/**
 * db.series.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lógica de series BOx para la plataforma RLC.
 *
 * Responsabilidades:
 *   1. Crear/inicializar una serie para un match (con sus sub-mapas).
 *   2. Reportar el resultado de un mapa individual.
 *   3. Validar automáticamente si la serie está completa tras cada mapa.
 *   4. Gestionar el escrow de apuestas (apertura 60 min antes, cierre 5 min antes).
 *   5. Pagar apuestas al finalizar la serie.
 *   6. Actualizar estadísticas de rankings (wins/losses + mapas ganados/perdidos).
 */

import { and, eq, sql } from "drizzle-orm";
import { getDb, addRlcTransaction, advanceRoundIfComplete } from "./db";
import {
  matchSeries,
  seriesMaps,
  tournamentMatches,
  bets,
  teams,
  type MatchSeries,
  type InsertMatchSeries,
  type InsertSeriesMap,
} from "../drizzle/schema";

// ─── Constantes de formato ────────────────────────────────────────────────────

/** Victorias necesarias para ganar la serie según el formato. */
export const WINS_NEEDED: Record<string, number> = {
  BO1: 1,
  BO2: 2, // BO2 especial: puede terminar 2-0 o 1-1 (empate)
  BO3: 2,
  BO5: 3,
  BO7: 4,
};

/** Máximo de mapas que puede tener la serie. */
export const MAX_MAPS: Record<string, number> = {
  BO1: 1,
  BO2: 2,
  BO3: 3,
  BO5: 5,
  BO7: 7,
};

/**
 * Determina si la serie ha terminado dado el estado actual de victorias.
 * Reglas:
 *   - BO2: termina si alguien llega a 2, o si ambos tienen 1 (empate).
 *   - BO3/BO5/BO7: termina cuando alguien alcanza el umbral de victorias.
 */
export function isSeriesComplete(
  format: string,
  winsTeam1: number,
  winsTeam2: number
): { complete: boolean; winnerId: number | null; isDraw: boolean } {
  const needed = WINS_NEEDED[format] ?? 1;

  if (format === "BO2") {
    // BO2: 2-0 → ganador; 1-1 → empate (no hay ganador)
    if (winsTeam1 === 2) return { complete: true, winnerId: null, isDraw: false }; // se resuelve con teamId externo
    if (winsTeam2 === 2) return { complete: true, winnerId: null, isDraw: false };
    if (winsTeam1 === 1 && winsTeam2 === 1) return { complete: true, winnerId: null, isDraw: true };
    return { complete: false, winnerId: null, isDraw: false };
  }

  if (winsTeam1 >= needed) return { complete: true, winnerId: null, isDraw: false };
  if (winsTeam2 >= needed) return { complete: true, winnerId: null, isDraw: false };
  return { complete: false, winnerId: null, isDraw: false };
}

// ─── Crear serie ──────────────────────────────────────────────────────────────

/**
 * Crea una serie BOx para un match existente.
 * Genera automáticamente los sub-mapas (N = MAX_MAPS[format]).
 * Calcula betsOpenAt y betsCloseAt si se pasa scheduledAt.
 */
export async function createMatchSeries(params: {
  matchId: number;
  tournamentId: number;
  format: "BO1" | "BO2" | "BO3" | "BO5" | "BO7";
  scheduledAt?: Date;
}): Promise<MatchSeries> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const { matchId, tournamentId, format, scheduledAt } = params;

  // Calcular ventana de apuestas
  let betsOpenAt: Date | undefined;
  let betsCloseAt: Date | undefined;
  if (scheduledAt) {
    betsOpenAt = new Date(scheduledAt.getTime() - 60 * 60 * 1000);  // -60 min
    betsCloseAt = new Date(scheduledAt.getTime() - 5 * 60 * 1000);  // -5 min
  }

  // Insertar la serie
  await db.insert(matchSeries).values({
    matchId,
    tournamentId,
    format,
    winsTeam1: 0,
    winsTeam2: 0,
    mapsWonTeam1: 0,
    mapsWonTeam2: 0,
    status: "pending",
    betsOpenAt: betsOpenAt ?? null,
    betsCloseAt: betsCloseAt ?? null,
    escrowAmount: 0,
  } as InsertMatchSeries);

  const [series] = await db
    .select()
    .from(matchSeries)
    .where(eq(matchSeries.matchId, matchId))
    .limit(1);

  if (!series) throw new Error("Failed to create match series");

  // Generar sub-mapas
  const maxMaps = MAX_MAPS[format] ?? 1;
  const mapsToInsert: InsertSeriesMap[] = [];
  for (let i = 1; i <= maxMaps; i++) {
    mapsToInsert.push({
      seriesId: series.id,
      matchId,
      mapNumber: i,
      status: "pending",
      isCancelled: false,
    });
  }
  await db.insert(seriesMaps).values(mapsToInsert);

  return series;
}

// ─── Obtener serie con mapas ──────────────────────────────────────────────────

export async function getSeriesWithMaps(matchId: number) {
  const db = await getDb();
  if (!db) return null;

  const [series] = await db
    .select()
    .from(matchSeries)
    .where(eq(matchSeries.matchId, matchId))
    .limit(1);

  if (!series) return null;

  const maps = await db
    .select()
    .from(seriesMaps)
    .where(eq(seriesMaps.seriesId, series.id))
    .orderBy(seriesMaps.mapNumber);

  return { series, maps };
}

export async function getSeriesById(seriesId: number) {
  const db = await getDb();
  if (!db) return null;
  const [series] = await db.select().from(matchSeries).where(eq(matchSeries.id, seriesId)).limit(1);
  return series ?? null;
}

// ─── Reportar resultado de un mapa ───────────────────────────────────────────

/**
 * Reporta el resultado de un mapa individual dentro de una serie.
 * Actualiza winsTeam1/winsTeam2 en la serie.
 * Si la serie se completa, llama a finalizeSeries().
 */
export async function reportMapResult(params: {
  seriesId: number;
  mapNumber: number;
  scoreTeam1: number;
  scoreTeam2: number;
  team1Id: number;
  team2Id: number;
}): Promise<{ seriesComplete: boolean; seriesWinnerId: number | null; isDraw: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const { seriesId, mapNumber, scoreTeam1, scoreTeam2, team1Id, team2Id } = params;

  // Obtener la serie
  const [series] = await db
    .select()
    .from(matchSeries)
    .where(eq(matchSeries.id, seriesId))
    .limit(1);

  if (!series) throw new Error("Series not found");
  if (series.status === "completed") throw new Error("Series already completed");

  // Determinar ganador del mapa
  let mapWinnerId: number | null = null;
  if (scoreTeam1 > scoreTeam2) mapWinnerId = team1Id;
  else if (scoreTeam2 > scoreTeam1) mapWinnerId = team2Id;
  // scoreTeam1 === scoreTeam2 → mapa empatado (sin ganador de mapa)

  // Actualizar el mapa
  await db
    .update(seriesMaps)
    .set({
      scoreTeam1,
      scoreTeam2,
      winnerId: mapWinnerId,
      status: "completed",
      completedAt: new Date(),
    })
    .where(and(eq(seriesMaps.seriesId, seriesId), eq(seriesMaps.mapNumber, mapNumber)));

  // Actualizar victorias en la serie
  const newWinsTeam1 = series.winsTeam1 + (mapWinnerId === team1Id ? 1 : 0);
  const newWinsTeam2 = series.winsTeam2 + (mapWinnerId === team2Id ? 1 : 0);
  const newMapsWonTeam1 = series.mapsWonTeam1 + (mapWinnerId === team1Id ? 1 : 0);
  const newMapsWonTeam2 = series.mapsWonTeam2 + (mapWinnerId === team2Id ? 1 : 0);

  await db
    .update(matchSeries)
    .set({
      winsTeam1: newWinsTeam1,
      winsTeam2: newWinsTeam2,
      mapsWonTeam1: newMapsWonTeam1,
      mapsWonTeam2: newMapsWonTeam2,
      status: "in_progress",
    })
    .where(eq(matchSeries.id, seriesId));

  // Verificar si la serie terminó
  const { complete, isDraw } = isSeriesComplete(series.format, newWinsTeam1, newWinsTeam2);

  if (complete) {
    let seriesWinnerId: number | null = null;
    if (!isDraw) {
      seriesWinnerId = newWinsTeam1 > newWinsTeam2 ? team1Id : team2Id;
    }

    // Cancelar mapas restantes
    await db
      .update(seriesMaps)
      .set({ status: "cancelled", isCancelled: true })
      .where(
        and(
          eq(seriesMaps.seriesId, seriesId),
          eq(seriesMaps.status, "pending")
        )
      );

    // Finalizar la serie
    await finalizeSeries({
      seriesId,
      seriesWinnerId,
      isDraw,
      team1Id,
      team2Id,
      newWinsTeam1,
      newWinsTeam2,
      newMapsWonTeam1,
      newMapsWonTeam2,
    });

    return { seriesComplete: true, seriesWinnerId, isDraw };
  }

  return { seriesComplete: false, seriesWinnerId: null, isDraw: false };
}

// ─── Finalizar serie ──────────────────────────────────────────────────────────

/**
 * Finaliza la serie:
 *   1. Marca la serie como completada.
 *   2. Actualiza el tournamentMatch con el ganador.
 *   3. Actualiza estadísticas de equipos (wins/losses + mapas).
 *   4. Paga las apuestas de la serie.
 *   5. Avanza el bracket al siguiente round.
 */
async function finalizeSeries(params: {
  seriesId: number;
  seriesWinnerId: number | null;
  isDraw: boolean;
  team1Id: number;
  team2Id: number;
  newWinsTeam1: number;
  newWinsTeam2: number;
  newMapsWonTeam1: number;
  newMapsWonTeam2: number;
}) {
  const db = await getDb();
  if (!db) return;

  const {
    seriesId,
    seriesWinnerId,
    isDraw,
    team1Id,
    team2Id,
    newWinsTeam1,
    newWinsTeam2,
    newMapsWonTeam1,
    newMapsWonTeam2,
  } = params;

  // 1. Marcar serie como completada
  await db
    .update(matchSeries)
    .set({
      seriesWinnerId,
      status: "completed",
      completedAt: new Date(),
      winsTeam1: newWinsTeam1,
      winsTeam2: newWinsTeam2,
      mapsWonTeam1: newMapsWonTeam1,
      mapsWonTeam2: newMapsWonTeam2,
    })
    .where(eq(matchSeries.id, seriesId));

  // Obtener la serie para el matchId y tournamentId
  const [series] = await db
    .select()
    .from(matchSeries)
    .where(eq(matchSeries.id, seriesId))
    .limit(1);

  if (!series) return;

  // 2. Actualizar el tournamentMatch con el ganador y marcador de la serie
  await db
    .update(tournamentMatches)
    .set({
      winnerId: seriesWinnerId,
      team1Score: newWinsTeam1,
      team2Score: newWinsTeam2,
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(tournamentMatches.id, series.matchId));

  // 3. Actualizar estadísticas de equipos
  if (seriesWinnerId && !isDraw) {
    const loserId = seriesWinnerId === team1Id ? team2Id : team1Id;
    const winnerMaps = seriesWinnerId === team1Id ? newMapsWonTeam1 : newMapsWonTeam2;
    const loserMaps = seriesWinnerId === team1Id ? newMapsWonTeam2 : newMapsWonTeam1;

    // Ganador: +30 pts, +1 win, mapas ganados/perdidos
    await db
      .update(teams)
      .set({
        wins: sql`wins + 1`,
        points: sql`points + 30`,
      })
      .where(eq(teams.id, seriesWinnerId));

    // Perdedor: +5 pts, +1 loss
    await db
      .update(teams)
      .set({
        losses: sql`losses + 1`,
        points: sql`points + 5`,
      })
      .where(eq(teams.id, loserId));

    // 4. Pagar apuestas de la serie
    await resolveSeriesBets(series.matchId, series.tournamentId, seriesWinnerId);

    // 5. Avanzar bracket
    const [match] = await db
      .select()
      .from(tournamentMatches)
      .where(eq(tournamentMatches.id, series.matchId))
      .limit(1);

    if (match) {
      await advanceRoundIfComplete(series.tournamentId, match.round);
    }
  } else if (isDraw) {
    // BO2 empate 1-1: refund de apuestas
    await refundSeriesBets(series.matchId, series.tournamentId);
  }
}

// ─── Gestión de apuestas de la serie ─────────────────────────────────────────

/**
 * Paga las apuestas de una serie al equipo ganador.
 * Las apuestas al perdedor se marcan como "lost".
 */
export async function resolveSeriesBets(
  matchId: number,
  tournamentId: number,
  winnerTeamId: number
) {
  const db = await getDb();
  if (!db) return;

  const pendingBets = await db
    .select()
    .from(bets)
    .where(
      and(
        eq(bets.tournamentId, tournamentId),
        eq(bets.matchId, matchId),
        eq(bets.status, "pending")
      )
    );

  for (const bet of pendingBets) {
    if (bet.teamId === winnerTeamId) {
      await db
        .update(bets)
        .set({ status: "won", resolvedAt: new Date() })
        .where(eq(bets.id, bet.id));

      await addRlcTransaction({
        userId: bet.userId,
        type: "bet_won",
        amount: bet.potentialWin,
        description: `Apuesta ganada en serie (match #${matchId})`,
        referenceId: bet.id,
      });
    } else {
      await db
        .update(bets)
        .set({ status: "lost", resolvedAt: new Date() })
        .where(eq(bets.id, bet.id));
    }
  }

  // Liberar escrow
  await db
    .update(matchSeries)
    .set({ escrowAmount: 0 })
    .where(eq(matchSeries.matchId, matchId));
}

/**
 * Reembolsa las apuestas de una serie (BO2 empate 1-1 u otro caso de cancelación).
 */
export async function refundSeriesBets(matchId: number, tournamentId: number) {
  const db = await getDb();
  if (!db) return;

  const pendingBets = await db
    .select()
    .from(bets)
    .where(
      and(
        eq(bets.tournamentId, tournamentId),
        eq(bets.matchId, matchId),
        eq(bets.status, "pending")
      )
    );

  for (const bet of pendingBets) {
    await db
      .update(bets)
      .set({ status: "refunded", resolvedAt: new Date() })
      .where(eq(bets.id, bet.id));

    await addRlcTransaction({
      userId: bet.userId,
      type: "refund",
      amount: bet.amount,
      description: `Reembolso por empate en serie BO2 (match #${matchId})`,
      referenceId: bet.id,
    });
  }

  await db
    .update(matchSeries)
    .set({ escrowAmount: 0 })
    .where(eq(matchSeries.matchId, matchId));
}

/**
 * Agrega el monto de una apuesta al escrow de la serie.
 * Se llama cuando un usuario hace una apuesta sobre un match con serie activa.
 */
export async function addToSeriesEscrow(matchId: number, amount: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(matchSeries)
    .set({ escrowAmount: sql`escrowAmount + ${amount}` })
    .where(eq(matchSeries.matchId, matchId));
}

// ─── Verificar si las apuestas están abiertas ─────────────────────────────────

/**
 * Retorna true si el mercado de apuestas de la serie está actualmente abierto.
 * Abre 60 min antes del mapa 1, cierra 5 min antes.
 */
export async function isSeriesBettingOpen(matchId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [series] = await db
    .select()
    .from(matchSeries)
    .where(eq(matchSeries.matchId, matchId))
    .limit(1);

  if (!series || !series.betsOpenAt || !series.betsCloseAt) return false;
  if (series.status === "completed") return false;

  const now = new Date();
  return now >= series.betsOpenAt && now <= series.betsCloseAt;
}
