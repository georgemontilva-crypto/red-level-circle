/**
 * Internal Event Bus for Red Level Circle
 * Decouples domain logic using a simple typed EventEmitter.
 *
 * Usage:
 *   eventBus.emit("tournament.full", { tournamentId: 1 });
 *   eventBus.on("tournament.full", async ({ tournamentId }) => { ... });
 */

import { EventEmitter } from "events";

// ─── Event Payloads ───────────────────────────────────────────────────────────

export interface RlcEvents {
  "tournament.full": { tournamentId: number };
  "tournament.brackets_generated": { tournamentId: number };
  "tournament.match_finished": { matchId: number; tournamentId: number; winnerId: number; loserId: number };
  "mission.approved": { missionId: number; submissionId: number; userId: number; coins: number };
  "mission.rejected": { missionId: number; submissionId: number; userId: number };
  "creator.verified": { userId: number };
  "creator.rejected": { userId: number };
  "order.created": { orderId: number; userId: number };
  "wallet.updated": { userId: number; amount: number; type: "earn" | "spend"; reference: string };
  "team.invite_sent": { teamId: number; invitedUserId: number; inviterUserId: number };
  "team.invite_accepted": { teamId: number; userId: number };
  "team.invite_rejected": { teamId: number; userId: number };
}

// ─── Typed EventBus class ─────────────────────────────────────────────────────

class TypedEventBus extends EventEmitter {
  emit<K extends keyof RlcEvents>(event: K, payload: RlcEvents[K]): boolean {
    return super.emit(event as string, payload);
  }

  on<K extends keyof RlcEvents>(
    event: K,
    listener: (payload: RlcEvents[K]) => void | Promise<void>
  ): this {
    super.on(event as string, (payload: RlcEvents[K]) => {
      // Wrap async listeners to catch errors without crashing the process
      const result = listener(payload);
      if (result instanceof Promise) {
        result.catch((err) => {
          console.error(`[EventBus] Error in listener for "${event}":`, err);
        });
      }
    });
    return this;
  }

  once<K extends keyof RlcEvents>(
    event: K,
    listener: (payload: RlcEvents[K]) => void | Promise<void>
  ): this {
    super.once(event as string, (payload: RlcEvents[K]) => {
      const result = listener(payload);
      if (result instanceof Promise) {
        result.catch((err) => {
          console.error(`[EventBus] Error in once-listener for "${event}":`, err);
        });
      }
    });
    return this;
  }
}

export const eventBus = new TypedEventBus();
// Increase max listeners to avoid Node.js warnings with many modules
eventBus.setMaxListeners(50);
