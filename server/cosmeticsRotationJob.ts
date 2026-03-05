/**
 * cosmeticsRotationJob.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Rotación semanal de cosméticos en la tienda.
 *
 * Lógica:
 *   - Cada lunes a las 00:00 UTC se seleccionan aleatoriamente N cosméticos
 *     activos y se marcan como "en rotación" (isFeatured = true).
 *   - Los cosméticos que estaban en rotación la semana anterior se desmarcan.
 *   - Los cosméticos isLimited nunca rotan — siempre están disponibles mientras
 *     isActive = true.
 *
 * Uso en Railway:
 *   Cron expression: 0 0 0 * * 1  (lunes a las 00:00:00 UTC)
 *   Comando: node -e "require('./dist/cosmeticsRotationJob').runWeeklyRotation()"
 *
 * Uso embebido (arranca con el servidor):
 *   import { startCosmeticsRotationJob } from "./cosmeticsRotationJob";
 *   startCosmeticsRotationJob();
 */

import { getDb } from "./db";
import { cosmetics } from "../drizzle/schema";
import { eq, and, ne } from "drizzle-orm";

const ROTATION_SIZE = 8; // cuántos cosméticos no-limitados rotan cada semana

export async function runWeeklyRotation(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[CosmeticsRotation] DB no disponible");
    return;
  }

  console.log("[CosmeticsRotation] Iniciando rotación semanal...");

  try {
    // 1. Desmarcar todos los cosméticos no-limitados que estaban en featured
    await db
      .update(cosmetics)
      .set({ isFeatured: false })
      .where(and(eq(cosmetics.isFeatured, true), eq(cosmetics.isLimited, false)));

    // 2. Obtener todos los cosméticos activos no-limitados
    const available = await db
      .select({ id: cosmetics.id })
      .from(cosmetics)
      .where(and(eq(cosmetics.isActive, true), eq(cosmetics.isLimited, false)));

    if (available.length === 0) {
      console.log("[CosmeticsRotation] No hay cosméticos disponibles para rotar.");
      return;
    }

    // 3. Seleccionar aleatoriamente hasta ROTATION_SIZE cosméticos
    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(ROTATION_SIZE, shuffled.length));

    // 4. Marcar los seleccionados como featured
    for (const c of selected) {
      await db
        .update(cosmetics)
        .set({ isFeatured: true })
        .where(eq(cosmetics.id, c.id));
    }

    console.log(`[CosmeticsRotation] Rotación completada. ${selected.length} cosméticos en tienda esta semana.`);
  } catch (err) {
    console.error("[CosmeticsRotation] Error durante la rotación:", err);
  }
}

/**
 * Arranca el cron job embebido.
 * Calcula el tiempo hasta el próximo lunes 00:00 UTC y luego repite cada 7 días.
 */
export function startCosmeticsRotationJob(): void {
  const msUntilNextMonday = getMillisUntilNextMonday();
  console.log(
    `[CosmeticsRotation] Próxima rotación en ${Math.round(msUntilNextMonday / 1000 / 60 / 60)}h`
  );

  setTimeout(() => {
    runWeeklyRotation();
    // Repetir cada 7 días exactos
    setInterval(runWeeklyRotation, 7 * 24 * 60 * 60 * 1000);
  }, msUntilNextMonday);
}

function getMillisUntilNextMonday(): number {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(0, 0, 0, 0);
  return nextMonday.getTime() - now.getTime();
}
