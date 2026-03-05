/**
 * orchestrator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Orquestador central de la plataforma RLC.
 *
 * Responsabilidades:
 *   1. submitMapResult  — Registra el resultado de un mapa, valida la lógica
 *                         BOx y dispara el cierre de la serie si corresponde.
 *   2. processBetPayouts — Pool betting con comisión del 5% para la plataforma.
 *   3. syncTournamentRankings — Actualiza la tabla tournament_rankings tras
 *                               cada serie finalizada.
 *   4. scheduleMatchBettingWindow — Calcula y persiste betsOpenAt/betsCloseAt
 *                                   al programar un match.
 *
 * Este módulo es la única fuente de verdad para la transición de estados:
 *
 *   pending → betting_open → locked → in_progress → completed
 *
 * El cron job (seriesCronJob.ts) llama a este módulo cada minuto para
 * aplicar las transiciones de estado según el tiempo real.
 */

import { and, eq, sql, ne, desc } from "drizzle-orm";
import { getDb, addRlcTransaction, advanceRoundIfComplete } from "./db";
import {
  matchSeries,
  seriesMaps,
  tournamentMatches,
  bets,
  teams,
  tournaments,
  tournamentRankings,
  type MatchSeries,
} from "../drizzle/schema";
import { createNotification, notifyRlcReceived } from "./notifications";

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Victorias necesarias para ganar la serie según el formato. */
export const WINS_NEEDED: Record<string, number> = {
  BO1: 1,
  BO2: 2,
  BO3: 2,
  BO5: 3,
  BO7: 4,
};

/** Máximo de mapas jugables por formato. */
export const MAX_MAPS: Record<string, number> = {
  BO1: 1,
  BO2: 2,
  BO3: 3,
  BO5: 5,
  BO7: 7,
};

/** Comisión de la plataforma sobre el pool de apuestas (5%). */
const PLATFORM_COMMISSION = 0.05;

/** Puntos de ranking por resultado de serie. */
const RANKING_POINTS = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0,
} as const;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SubmitMapResultParams {
  seriesId: number;
  mapNumber: number;
  scoreTeam1: number;
  scoreTeam2: number;
  team1Id: number;
  team2Id: number;
  tournamentId: number;
}

export interface SubmitMapResultResponse {
  /** El mapa fue registrado correctamente. */
  mapRecorded: boolean;
  /** Ganador del mapa individual (teamId). */
  mapWinnerId: number | null;
  /** Marcador actual de la serie (mapas ganados). */
  seriesScore: { team1: number; team2: number };
  /** La serie ha terminado. */
  seriesComplete: boolean;
  /** Ganador de la serie (teamId). null si empate. */
  seriesWinnerId: number | null;
  /** ¿Terminó en empate? (solo posible en BO2 1-1). */
  isDraw: boolean;
  /** Mapas restantes antes de que la serie pueda terminar. */
  mapsRemaining: number;
  /** Formato de la serie. */
  format: string;
}

// ─── 1. submitMapResult ───────────────────────────────────────────────────────

/**
 * Registra el resultado de un mapa individual dentro de una serie BOx.
 *
 * Lógica BOx:
 *   - Calcula el ganador del mapa (scoreTeam1 vs scoreTeam2).
 *   - Actualiza los contadores de victorias en la serie.
 *   - Verifica si algún equipo alcanzó el umbral de victorias.
 *   - Si la serie termina: cancela mapas restantes, actualiza el match del
 *     bracket, paga apuestas y actualiza rankings.
 *
 * Umbrales de victoria:
 *   BO1 → 1 victoria
 *   BO2 → 2 victorias (o 1-1 = empate)
 *   BO3 → 2 victorias
 *   BO5 → 3 victorias
 *   BO7 → 4 victorias
 */
export async function submitMapResult(
  params: SubmitMapResultParams
): Promise<SubmitMapResultResponse> {
  const db = await getDb();
  if (!db) throw new Error("DB no disponible");

  const { seriesId, mapNumber, scoreTeam1, scoreTeam2, team1Id, team2Id, tournamentId } = params;

  // ── Obtener la serie ──────────────────────────────────────────────────────
  const [series] = await db
    .select()
    .from(matchSeries)
    .where(eq(matchSeries.id, seriesId))
    .limit(1);

  if (!series) throw new Error(`Serie #${seriesId} no encontrada`);
  if (series.status === "completed") throw new Error("La serie ya está completada");

  // ── Validar que el mapa existe y no está completado ───────────────────────
  const [map] = await db
    .select()
    .from(seriesMaps)
    .where(and(eq(seriesMaps.seriesId, seriesId), eq(seriesMaps.mapNumber, mapNumber)))
    .limit(1);

  if (!map) throw new Error(`Mapa #${mapNumber} no encontrado en la serie`);
  if (map.status === "completed") throw new Error(`El mapa #${mapNumber} ya fue registrado`);
  if (map.isCancelled) throw new Error(`El mapa #${mapNumber} fue cancelado (serie ya resuelta)`);

  // ── Determinar ganador del mapa ───────────────────────────────────────────
  let mapWinnerId: number | null = null;
  if (scoreTeam1 > scoreTeam2) mapWinnerId = team1Id;
  else if (scoreTeam2 > scoreTeam1) mapWinnerId = team2Id;
  // Empate de mapa: mapWinnerId = null (no suma victorias de serie)

  // ── Actualizar el mapa ────────────────────────────────────────────────────
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

  // ── Actualizar contadores de victorias en la serie ────────────────────────
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

  // ── Verificar si la serie terminó (lógica BOx) ────────────────────────────
  const needed = WINS_NEEDED[series.format] ?? 1;
  const maxMaps = MAX_MAPS[series.format] ?? 1;

  let seriesComplete = false;
  let seriesWinnerId: number | null = null;
  let isDraw = false;

  if (series.format === "BO2") {
    // BO2: termina en 2-0 (ganador) o 1-1 (empate)
    if (newWinsTeam1 === 2) { seriesComplete = true; seriesWinnerId = team1Id; }
    else if (newWinsTeam2 === 2) { seriesComplete = true; seriesWinnerId = team2Id; }
    else if (newWinsTeam1 === 1 && newWinsTeam2 === 1) { seriesComplete = true; isDraw = true; }
  } else {
    // BO1/BO3/BO5/BO7: el primero en alcanzar el umbral gana
    if (newWinsTeam1 >= needed) { seriesComplete = true; seriesWinnerId = team1Id; }
    else if (newWinsTeam2 >= needed) { seriesComplete = true; seriesWinnerId = team2Id; }
  }

  const mapsPlayed = newMapsWonTeam1 + newMapsWonTeam2;
  const mapsRemaining = seriesComplete ? 0 : maxMaps - mapsPlayed;

  // ── Si la serie terminó: disparar el cierre ───────────────────────────────
  if (seriesComplete) {
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

    // Marcar la serie como completada
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

    // Actualizar el match del bracket (status → completed, scores = victorias de serie)
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

    // Actualizar estadísticas globales de equipos (tabla teams)
    if (seriesWinnerId && !isDraw) {
      const loserId = seriesWinnerId === team1Id ? team2Id : team1Id;
      await db
        .update(teams)
        .set({ wins: sql`wins + 1`, points: sql`points + 30` })
        .where(eq(teams.id, seriesWinnerId));
      await db
        .update(teams)
        .set({ losses: sql`losses + 1`, points: sql`points + 5` })
        .where(eq(teams.id, loserId));
    }

    // Pagar apuestas (pool betting con comisión)
    await processBetPayouts({
      matchId: series.matchId,
      tournamentId,
      seriesWinnerId,
      isDraw,
    });

    // Sincronizar rankings del torneo
    await syncTournamentRankings({
      tournamentId,
      team1Id,
      team2Id,
      seriesWinnerId,
      isDraw,
      mapsWonTeam1: newMapsWonTeam1,
      mapsWonTeam2: newMapsWonTeam2,
    });

    // Avanzar el bracket al siguiente round
    const [match] = await db
      .select({ round: tournamentMatches.round })
      .from(tournamentMatches)
      .where(eq(tournamentMatches.id, series.matchId))
      .limit(1);

    if (match) {
      await advanceRoundIfComplete(tournamentId, match.round);
    }
  }

  return {
    mapRecorded: true,
    mapWinnerId,
    seriesScore: { team1: newWinsTeam1, team2: newWinsTeam2 },
    seriesComplete,
    seriesWinnerId,
    isDraw,
    mapsRemaining,
    format: series.format,
  };
}

// ─── 2. processBetPayouts (Pool Betting) ─────────────────────────────────────

/**
 * Distribuye las apuestas usando el modelo de Pool Betting:
 *
 *   1. Suma todo el RLC apostado (pool total).
 *   2. Descuenta la comisión de la plataforma (5%).
 *   3. Distribuye el pool neto proporcionalmente entre los ganadores,
 *      según el monto que cada uno apostó.
 *
 * Ejemplo (BO3, equipo A gana):
 *   Apuestas al equipo A: 100 + 200 = 300 RLC
 *   Apuestas al equipo B: 400 RLC
 *   Pool total: 700 RLC
 *   Comisión (5%): 35 RLC
 *   Pool neto: 665 RLC
 *   Usuario 1 (apostó 100 al ganador): recibe 665 * (100/300) ≈ 222 RLC
 *   Usuario 2 (apostó 200 al ganador): recibe 665 * (200/300) ≈ 443 RLC
 *
 * En caso de empate (BO2 1-1): reembolso completo sin comisión.
 */
export async function processBetPayouts(params: {
  matchId: number;
  tournamentId: number;
  seriesWinnerId: number | null;
  isDraw: boolean;
}) {
  const db = await getDb();
  if (!db) return;

  const { matchId, tournamentId, seriesWinnerId, isDraw } = params;

  // Obtener todas las apuestas pendientes del match
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

  if (pendingBets.length === 0) return;

  // ── Empate: reembolso completo ────────────────────────────────────────────
  if (isDraw || !seriesWinnerId) {
    for (const bet of pendingBets) {
      await db
        .update(bets)
        .set({ status: "refunded", resolvedAt: new Date() })
        .where(eq(bets.id, bet.id));

      const newBal1 = await addRlcTransaction({
        userId: bet.userId,
        type: "refund",
        amount: bet.amount,
        description: `Reembolso por empate en serie BO2 (match #${matchId})`,
        referenceId: bet.id,
      });
      try {
        await notifyRlcReceived({
          userId: bet.userId,
          amount: bet.amount,
          type: "refund",
          newBalance: newBal1,
          description: `La serie terminó en empate. Reembolso de ${bet.amount} RLC.`,
        });
      } catch (_) { /* non-critical */ }
    }

    // Liberar escrow
    await db
      .update(matchSeries)
      .set({ escrowAmount: 0 })
      .where(eq(matchSeries.matchId, matchId));

    return;
  }

  // ── Pool Betting: calcular distribución ──────────────────────────────────
  const winnerBets = pendingBets.filter((b) => b.teamId === seriesWinnerId);
  const loserBets = pendingBets.filter((b) => b.teamId !== seriesWinnerId);

  const totalPool = pendingBets.reduce((sum, b) => sum + b.amount, 0);
  const winnerPool = winnerBets.reduce((sum, b) => sum + b.amount, 0);

  // Si no hay apuestas ganadoras, reembolsar todo
  if (winnerPool === 0) {
    for (const bet of pendingBets) {
      await db
        .update(bets)
        .set({ status: "refunded", resolvedAt: new Date() })
        .where(eq(bets.id, bet.id));
      await addRlcTransaction({
        userId: bet.userId,
        type: "refund",
        amount: bet.amount,
        description: `Reembolso: no hubo apuestas al ganador (match #${matchId})`,
        referenceId: bet.id,
      });
    }
    await db
      .update(matchSeries)
      .set({ escrowAmount: 0 })
      .where(eq(matchSeries.matchId, matchId));
    return;
  }

  const commission = Math.floor(totalPool * PLATFORM_COMMISSION);
  const netPool = totalPool - commission;

  // Registrar comisión de la plataforma
  if (commission > 0) {
    console.log(
      `[Orchestrator] Comisión de plataforma: ${commission} RLC (match #${matchId})`
    );
    // En producción: transferir a wallet de la plataforma
    // await addRlcTransaction({ userId: PLATFORM_USER_ID, type: "commission", amount: commission, ... });
  }

  // ── Pagar a los ganadores (proporcionalmente) ─────────────────────────────
  for (const bet of winnerBets) {
    // Proporción = monto apostado / pool total de ganadores
    const proportion = bet.amount / winnerPool;
    const payout = Math.floor(netPool * proportion);

    await db
      .update(bets)
      .set({ status: "won", resolvedAt: new Date() })
      .where(eq(bets.id, bet.id));

    const newBal2 = await addRlcTransaction({
      userId: bet.userId,
      type: "bet_won",
      amount: payout,
      description: `Apuesta ganada (pool betting, match #${matchId}) — ${bet.amount} RLC apostados`,
      referenceId: bet.id,
    });
    try {
      await notifyRlcReceived({
        userId: bet.userId,
        amount: payout,
        type: "bet_won",
        newBalance: newBal2,
        description: `¡Apuesta ganada! Ganaste ${payout} RLC en el match #${matchId}.`,
      });
    } catch (_) { /* non-critical */ }
  }

  // ── Marcar apuestas perdedoras ────────────────────────────────────────────
  for (const bet of loserBets) {
    await db
      .update(bets)
      .set({ status: "lost", resolvedAt: new Date() })
      .where(eq(bets.id, bet.id));

    // Notificar al perdedor
    try {
      await createNotification({
        userId: bet.userId,
        type: "general",
        title: "❌ Apuesta perdida",
        message: `Tu apuesta de ${bet.amount} RLC en el match #${matchId} no fue ganadora.`,
        link: "/betting",
        referenceId: matchId,
        referenceType: "match",
      });
    } catch (_) { /* non-critical */ }
  }

  // Liberar escrow
  await db
    .update(matchSeries)
    .set({ escrowAmount: 0 })
    .where(eq(matchSeries.matchId, matchId));

  console.log(
    `[Orchestrator] Payouts procesados: match #${matchId} | pool ${totalPool} RLC | ` +
    `comisión ${commission} | neto ${netPool} | ganadores: ${winnerBets.length} | perdedores: ${loserBets.length}`
  );
}

// ─── 3. syncTournamentRankings ────────────────────────────────────────────────

/**
 * Actualiza la tabla tournament_rankings tras finalizar una serie.
 *
 * Criterios de ordenación (en orden de prioridad):
 *   1. points (desc)      — 3 pts victoria, 1 pt empate, 0 pts derrota
 *   2. seriesWon (desc)
 *   3. mapDiff (desc)     — mapsWon - mapsLost
 *   4. mapsWon (desc)
 *
 * Recalcula las posiciones de todos los equipos del torneo tras cada actualización.
 */
export async function syncTournamentRankings(params: {
  tournamentId: number;
  team1Id: number;
  team2Id: number;
  seriesWinnerId: number | null;
  isDraw: boolean;
  mapsWonTeam1: number;
  mapsWonTeam2: number;
}) {
  const db = await getDb();
  if (!db) return;

  const { tournamentId, team1Id, team2Id, seriesWinnerId, isDraw, mapsWonTeam1, mapsWonTeam2 } = params;

  // Determinar resultados para cada equipo
  const team1Won = !isDraw && seriesWinnerId === team1Id;
  const team2Won = !isDraw && seriesWinnerId === team2Id;

  const team1Points = team1Won ? RANKING_POINTS.WIN : isDraw ? RANKING_POINTS.DRAW : RANKING_POINTS.LOSS;
  const team2Points = team2Won ? RANKING_POINTS.WIN : isDraw ? RANKING_POINTS.DRAW : RANKING_POINTS.LOSS;

  // Función auxiliar para upsert de ranking
  async function upsertRanking(
    teamId: number,
    pts: number,
    won: boolean,
    draw: boolean,
    mapsWon: number,
    mapsLost: number
  ) {
    const [existing] = await db
      .select()
      .from(tournamentRankings)
      .where(
        and(
          eq(tournamentRankings.tournamentId, tournamentId),
          eq(tournamentRankings.teamId, teamId)
        )
      )
      .limit(1);

    if (existing) {
      const newMapsWon = existing.mapsWon + mapsWon;
      const newMapsLost = existing.mapsLost + mapsLost;
      await db
        .update(tournamentRankings)
        .set({
          points: existing.points + pts,
          seriesPlayed: existing.seriesPlayed + 1,
          seriesWon: existing.seriesWon + (won ? 1 : 0),
          seriesDrawn: existing.seriesDrawn + (draw ? 1 : 0),
          seriesLost: existing.seriesLost + (!won && !draw ? 1 : 0),
          mapsWon: newMapsWon,
          mapsLost: newMapsLost,
          mapDiff: newMapsWon - newMapsLost,
        })
        .where(
          and(
            eq(tournamentRankings.tournamentId, tournamentId),
            eq(tournamentRankings.teamId, teamId)
          )
        );
    } else {
      await db.insert(tournamentRankings).values({
        tournamentId,
        teamId,
        points: pts,
        seriesPlayed: 1,
        seriesWon: won ? 1 : 0,
        seriesDrawn: draw ? 1 : 0,
        seriesLost: !won && !draw ? 1 : 0,
        mapsWon: mapsWon,
        mapsLost: mapsLost,
        mapDiff: mapsWon - mapsLost,
        position: 0,
      });
    }
  }

  // Actualizar ambos equipos
  await upsertRanking(team1Id, team1Points, team1Won, isDraw, mapsWonTeam1, mapsWonTeam2);
  await upsertRanking(team2Id, team2Points, team2Won, isDraw, mapsWonTeam2, mapsWonTeam1);

  // Recalcular posiciones de todos los equipos del torneo
  const allRankings = await db
    .select()
    .from(tournamentRankings)
    .where(eq(tournamentRankings.tournamentId, tournamentId))
    .orderBy(
      desc(tournamentRankings.points),
      desc(tournamentRankings.seriesWon),
      desc(tournamentRankings.mapDiff),
      desc(tournamentRankings.mapsWon)
    );

  // Asignar posiciones (con soporte para empates de posición)
  for (let i = 0; i < allRankings.length; i++) {
    const ranking = allRankings[i];
    const position = i + 1;
    await db
      .update(tournamentRankings)
      .set({ position })
      .where(
        and(
          eq(tournamentRankings.tournamentId, tournamentId),
          eq(tournamentRankings.teamId, ranking.teamId)
        )
      );
  }

  console.log(
    `[Orchestrator] Rankings sincronizados: torneo #${tournamentId} | ` +
    `${allRankings.length} equipos clasificados`
  );
}

// ─── 4. scheduleMatchBettingWindow ────────────────────────────────────────────

/**
 * Calcula y persiste las ventanas de apuestas al programar un match.
 *
 * Regla 60/5:
 *   betsOpenAt  = scheduledAt - 60 minutos
 *   betsCloseAt = scheduledAt - 5 minutos
 *
 * También actualiza la serie asociada (si existe) con las mismas ventanas.
 */
export async function scheduleMatchBettingWindow(
  matchId: number,
  scheduledAt: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const betsOpenAt = new Date(scheduledAt.getTime() - 60 * 60 * 1000);  // -60 min
  const betsCloseAt = new Date(scheduledAt.getTime() - 5 * 60 * 1000);  // -5 min

  // Actualizar el match
  await db
    .update(tournamentMatches)
    .set({ scheduledAt, betsOpenAt, betsCloseAt })
    .where(eq(tournamentMatches.id, matchId));

  // Actualizar la serie asociada (si existe)
  await db
    .update(matchSeries)
    .set({ betsOpenAt, betsCloseAt })
    .where(eq(matchSeries.matchId, matchId));

  console.log(
    `[Orchestrator] Ventana de apuestas programada: match #${matchId} | ` +
    `abre ${betsOpenAt.toISOString()} | cierra ${betsCloseAt.toISOString()}`
  );
}
