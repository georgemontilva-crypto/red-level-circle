/**
 * runMigrations.ts
 *
 * Ejecuta migraciones SQL pendientes al iniciar el servidor.
 * Se llama desde server/index.ts antes de iniciar el servidor HTTP.
 *
 * Cada migración tiene un ID único. Si ya fue ejecutada (registrada en
 * la tabla `_migrations`), se salta. Esto garantiza idempotencia.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

const MIGRATIONS: { id: string; up: string }[] = [
  {
    id: "0010_drops_and_catalog_rotation",
    up: `
      -- cosmetics: supply & drop window
      ALTER TABLE \`cosmetics\`
        ADD COLUMN IF NOT EXISTS \`maxSupply\`     INT          NULL          AFTER \`isLimited\`,
        ADD COLUMN IF NOT EXISTS \`currentSupply\` INT          NOT NULL DEFAULT 0 AFTER \`maxSupply\`,
        ADD COLUMN IF NOT EXISTS \`dropStart\`     TIMESTAMP    NULL          AFTER \`currentSupply\`,
        ADD COLUMN IF NOT EXISTS \`dropEnd\`       TIMESTAMP    NULL          AFTER \`dropStart\`;

      -- catalog_items: rotation & scheduling
      ALTER TABLE \`catalog_items\`
        ADD COLUMN IF NOT EXISTS \`weeklyFeatured\`   TINYINT(1)  NOT NULL DEFAULT 0 AFTER \`isVisible\`,
        ADD COLUMN IF NOT EXISTS \`featuredPriority\` INT         NOT NULL DEFAULT 0 AFTER \`weeklyFeatured\`,
        ADD COLUMN IF NOT EXISTS \`visibleFrom\`      TIMESTAMP   NULL          AFTER \`featuredPriority\`,
        ADD COLUMN IF NOT EXISTS \`visibleUntil\`     TIMESTAMP   NULL          AFTER \`visibleFrom\`,
        ADD COLUMN IF NOT EXISTS \`publishDate\`      TIMESTAMP   NULL          AFTER \`visibleUntil\`;

      -- drops table
      CREATE TABLE IF NOT EXISTS \`drops\` (
        \`id\`           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`name\`         VARCHAR(128) NOT NULL,
        \`slug\`         VARCHAR(128) NOT NULL UNIQUE,
        \`description\`  TEXT         NULL,
        \`bannerImage\`  TEXT         NULL,
        \`collectionId\` INT          NULL,
        \`startDate\`    TIMESTAMP    NOT NULL,
        \`endDate\`      TIMESTAMP    NOT NULL,
        \`isActive\`     TINYINT(1)   NOT NULL DEFAULT 0,
        \`createdAt\`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    id: "0011_missions_system",
    up: `
      CREATE TABLE IF NOT EXISTS \`missions\` (
        \`id\`                   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`title\`                VARCHAR(256) NOT NULL,
        \`description\`          TEXT,
        \`bannerUrl\`             TEXT,
        \`videoUrl\`              TEXT         NOT NULL,
        \`sponsorName\`           VARCHAR(128),
        \`sponsorLogo\`           TEXT,
        \`rewardRlc\`             INT          NOT NULL DEFAULT 0,
        \`requiredWatchSeconds\`  INT          NOT NULL DEFAULT 30,
        \`startDate\`             TIMESTAMP    NULL,
        \`endDate\`               TIMESTAMP    NULL,
        \`isActive\`              TINYINT(1)   NOT NULL DEFAULT 1,
        \`createdAt\`             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS \`userMissions\` (
        \`id\`           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`userId\`       INT          NOT NULL,
        \`missionId\`    INT          NOT NULL,
        \`accepted\`     TINYINT(1)   NOT NULL DEFAULT 0,
        \`watchedSeconds\` INT        NOT NULL DEFAULT 0,
        \`completed\`    TINYINT(1)   NOT NULL DEFAULT 0,
        \`claimed\`      TINYINT(1)   NOT NULL DEFAULT 0,
        \`completedAt\`  TIMESTAMP    NULL,
        \`createdAt\`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY \`userMissions_userId_missionId_unique\` (\`userId\`, \`missionId\`)
      );

      CREATE TABLE IF NOT EXISTS \`missionClaims\` (
        \`id\`         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`userId\`     INT          NOT NULL,
        \`missionId\`  INT          NOT NULL,
        \`rewardRlc\`  INT          NOT NULL,
        \`claimedAt\`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
];

export async function runMigrations() {
  // Ensure migrations tracking table exists
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS \`_migrations\` (
      \`id\`        VARCHAR(128) NOT NULL PRIMARY KEY,
      \`appliedAt\` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `));

  for (const migration of MIGRATIONS) {
    // Check if already applied
    const rows = await db.execute(
      sql.raw(`SELECT id FROM \`_migrations\` WHERE id = '${migration.id}'`)
    );
    // drizzle returns rows array
    const applied = Array.isArray(rows) ? rows.length > 0 : (rows as any)[0]?.length > 0;
    if (applied) {
      console.log(`[migrations] Skipping ${migration.id} (already applied)`);
      continue;
    }

    console.log(`[migrations] Applying ${migration.id}...`);
    // TiDB supports multiple statements in one execute call
    // Split by semicolon and run each non-empty statement
    const statements = migration.up
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await db.execute(sql.raw(stmt));
      } catch (err: any) {
        // Ignore "duplicate column" errors (1060) — means already applied partially
        if (err?.errno === 1060 || err?.message?.includes("Duplicate column")) {
          console.warn(`[migrations] Column already exists, skipping: ${stmt.slice(0, 60)}...`);
          continue;
        }
        throw err;
      }
    }

    // Mark as applied
    await db.execute(
      sql.raw(`INSERT INTO \`_migrations\` (id) VALUES ('${migration.id}')`)
    );
    console.log(`[migrations] Applied ${migration.id} ✓`);
  }
}
