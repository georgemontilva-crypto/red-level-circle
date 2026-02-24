/**
 * Backfill script: Fase 2 de migración gameSlug
 *
 * Propósito: poblar el campo `gameSlug` en las tablas `tournaments` y `teams`
 * a partir del campo legacy `game` (nombre de texto) haciendo JOIN con `games.slug`.
 *
 * Características:
 * - Idempotente: solo actualiza registros donde gameSlug IS NULL (seguro de re-ejecutar)
 * - Mapeo de normalización explícito para variantes legacy conocidas
 * - Reporta registros huérfanos (game no encontrado en la tabla games)
 * - No elimina ni modifica el campo `game` original
 *
 * Uso:
 *   node scripts/backfill-game-slug.mjs
 *   node scripts/backfill-game-slug.mjs --dry-run   (solo muestra lo que haría)
 */

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Mapeo de normalización ────────────────────────────────────────────────────
// Añadir aquí cualquier variante legacy que no coincida exactamente con games.name
const LEGACY_NAME_MAP = {
  // Abreviaciones comunes
  "lol": "League of Legends",
  "LoL": "League of Legends",
  "LOL": "League of Legends",
  "league": "League of Legends",
  "valorant": "Valorant",
  "val": "Valorant",
  "VAL": "Valorant",
  "cs": "Counter-Strike 2",
  "cs2": "Counter-Strike 2",
  "CS2": "Counter-Strike 2",
  "csgo": "Counter-Strike 2",
  "CSGO": "Counter-Strike 2",
  "dota": "Dota 2",
  "dota2": "Dota 2",
  "Dota2": "Dota 2",
  "fortnite": "Fortnite",
  "fn": "Fortnite",
  "apex": "Apex Legends",
  "rl": "Rocket League",
  "rocket league": "Rocket League",
  "overwatch": "Overwatch 2",
  "ow": "Overwatch 2",
  "ow2": "Overwatch 2",
};

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  console.log("✅ Conectado a la base de datos");
  console.log(DRY_RUN ? "🔍 MODO DRY-RUN: no se realizarán cambios\n" : "🚀 MODO REAL: se aplicarán cambios\n");

  try {
    // 1. Cargar todos los juegos disponibles (name → slug)
    const [gameRows] = await conn.execute("SELECT name, slug FROM games WHERE isActive = 1");
    const nameToSlug = {};
    for (const g of gameRows) {
      nameToSlug[g.name] = g.slug;
    }
    console.log(`📋 Juegos disponibles en la tabla games (${gameRows.length}):`);
    for (const [name, slug] of Object.entries(nameToSlug)) {
      console.log(`   "${name}" → "${slug}"`);
    }
    console.log();

    // Función auxiliar: resolver nombre legacy → slug
    function resolveSlug(gameName) {
      if (!gameName) return null;
      // Coincidencia exacta
      if (nameToSlug[gameName]) return nameToSlug[gameName];
      // Mapeo de normalización
      const normalized = LEGACY_NAME_MAP[gameName];
      if (normalized && nameToSlug[normalized]) return nameToSlug[normalized];
      // Coincidencia case-insensitive como último recurso
      const lower = gameName.toLowerCase();
      for (const [name, slug] of Object.entries(nameToSlug)) {
        if (name.toLowerCase() === lower) return slug;
      }
      return null;
    }

    // ─── Backfill tournaments ────────────────────────────────────────────────
    console.log("── Procesando tabla: tournaments ──────────────────────────────");
    const [tournaments] = await conn.execute(
      "SELECT id, name, game FROM tournaments WHERE gameSlug IS NULL"
    );
    console.log(`   Registros con gameSlug = NULL: ${tournaments.length}`);

    let tUpdated = 0, tOrphan = 0;
    for (const t of tournaments) {
      const slug = resolveSlug(t.game);
      if (slug) {
        console.log(`   ✓ Torneo #${t.id} "${t.name}": game="${t.game}" → gameSlug="${slug}"`);
        if (!DRY_RUN) {
          await conn.execute(
            "UPDATE tournaments SET gameSlug = ? WHERE id = ? AND gameSlug IS NULL",
            [slug, t.id]
          );
        }
        tUpdated++;
      } else {
        console.warn(`   ⚠️  Torneo #${t.id} "${t.name}": game="${t.game}" → SIN COINCIDENCIA (huérfano)`);
        tOrphan++;
      }
    }
    console.log(`   Resultado: ${tUpdated} actualizados, ${tOrphan} huérfanos\n`);

    // ─── Backfill teams ──────────────────────────────────────────────────────
    console.log("── Procesando tabla: teams ────────────────────────────────────");
    const [teams] = await conn.execute(
      "SELECT id, name, game FROM teams WHERE gameSlug IS NULL AND game IS NOT NULL"
    );
    console.log(`   Registros con gameSlug = NULL y game != NULL: ${teams.length}`);

    let eUpdated = 0, eOrphan = 0;
    for (const team of teams) {
      const slug = resolveSlug(team.game);
      if (slug) {
        console.log(`   ✓ Equipo #${team.id} "${team.name}": game="${team.game}" → gameSlug="${slug}"`);
        if (!DRY_RUN) {
          await conn.execute(
            "UPDATE teams SET gameSlug = ? WHERE id = ? AND gameSlug IS NULL",
            [slug, team.id]
          );
        }
        eUpdated++;
      } else {
        console.warn(`   ⚠️  Equipo #${team.id} "${team.name}": game="${team.game}" → SIN COINCIDENCIA (huérfano)`);
        eOrphan++;
      }
    }
    console.log(`   Resultado: ${eUpdated} actualizados, ${eOrphan} huérfanos\n`);

    // ─── Verificación post-backfill ──────────────────────────────────────────
    if (!DRY_RUN) {
      console.log("── Verificación post-backfill ─────────────────────────────────");
      const [[{ nullTournaments }]] = await conn.execute(
        "SELECT COUNT(*) AS nullTournaments FROM tournaments WHERE gameSlug IS NULL"
      );
      const [[{ nullTeams }]] = await conn.execute(
        "SELECT COUNT(*) AS nullTeams FROM teams WHERE gameSlug IS NULL AND game IS NOT NULL"
      );
      console.log(`   tournaments con gameSlug = NULL: ${nullTournaments}`);
      console.log(`   teams con gameSlug = NULL (y game != NULL): ${nullTeams}`);
      if (nullTournaments === 0 && nullTeams === 0) {
        console.log("   ✅ Backfill completo: no quedan registros sin gameSlug");
      } else {
        console.warn("   ⚠️  Quedan registros sin gameSlug. Revisar los huérfanos reportados arriba.");
      }
    }

    // ─── Resumen final ───────────────────────────────────────────────────────
    console.log("\n── Resumen ────────────────────────────────────────────────────");
    console.log(`   Torneos actualizados: ${tUpdated} | Huérfanos: ${tOrphan}`);
    console.log(`   Equipos actualizados: ${eUpdated} | Huérfanos: ${eOrphan}`);
    if (DRY_RUN) console.log("\n   ℹ️  Ejecutar sin --dry-run para aplicar los cambios.");

  } finally {
    await conn.end();
    console.log("\n✅ Conexión cerrada.");
  }
}

main().catch((err) => {
  console.error("❌ Error en el backfill:", err);
  process.exit(1);
});
