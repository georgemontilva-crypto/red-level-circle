/**
 * runMigrations.ts
 *
 * Ejecuta migraciones SQL pendientes al iniciar el servidor.
 * Se llama desde server/index.ts antes de iniciar el servidor HTTP.
 *
 * Cada migración tiene un ID único. Si ya fue ejecutada (registrada en
 * la tabla `_migrations`), se salta. Esto garantiza idempotencia.
 */

import { getDb } from "./db";
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
  {
    id: "0012_admin_improvements",
    up: `
      -- Agregar rol organizer al enum de users
      ALTER TABLE \`users\` MODIFY COLUMN \`role\` ENUM('user','premium','organizer','admin','super_admin') NOT NULL DEFAULT 'user';
      -- Agregar campos de tracking a shop_orders
      ALTER TABLE \`shop_orders\`
        ADD COLUMN IF NOT EXISTS \`trackingNumber\`  VARCHAR(128) NULL AFTER \`deliveryNote\`,
        ADD COLUMN IF NOT EXISTS \`shippingCarrier\` VARCHAR(64)  NULL AFTER \`trackingNumber\`;
      -- Agregar campos estructurados a verification_requests
      ALTER TABLE \`verification_requests\`
        ADD COLUMN IF NOT EXISTS \`verificationType\` ENUM('streamer','pro_player','team','organization','content_creator','other') NOT NULL DEFAULT 'other' AFTER \`status\`,
        ADD COLUMN IF NOT EXISTS \`socialLinks\`      TEXT NULL AFTER \`reason\`,
        ADD COLUMN IF NOT EXISTS \`followersCount\`   INT  NULL AFTER \`socialLinks\`;
      -- Ampliar enum de notificaciones con nuevos tipos
      ALTER TABLE \`notifications\` MODIFY COLUMN \`type\` ENUM(
        'bracket_ready','mission_approved','mission_rejected',
        'order_confirmed','order_processing','order_shipped','order_delivered','order_cancelled',
        'team_invite','team_invite_accepted','team_invite_rejected',
        'creator_verified','creator_rejected',
        'verification_approved','verification_rejected','verification_pending_admin',
        'tournament_full','match_scheduled','match_result',
        'coins_earned','coins_spent','general'
      ) NOT NULL;
    `,
  },
  {
    id: "0013_youtube_channel_id",
    up: `
      -- Add youtubeChannelId to content_creators for stable channelId-based embed URL
      ALTER TABLE \`content_creators\`
        ADD COLUMN IF NOT EXISTS \`youtubeChannelId\` VARCHAR(64) NULL AFTER \`youtube\`;
    `,
  },
  // 0014 moved to customMigrations in index.ts (Railway does not support ADD COLUMN IF NOT EXISTS)
  {
    id: "0015_battlefy_tournament_features",
    up: `
      -- Nuevos campos en tournaments (inspirados en Battlefy)
      ALTER TABLE \`tournaments\`
        ADD COLUMN IF NOT EXISTS \`region\`              VARCHAR(32)  NULL AFTER \`isLive\`,
        ADD COLUMN IF NOT EXISTS \`gameMap\`             VARCHAR(64)  NULL AFTER \`region\`,
        ADD COLUMN IF NOT EXISTS \`draftType\`           ENUM('tournament_draft','blind_pick','all_random','captains_draft') NULL DEFAULT 'tournament_draft' AFTER \`gameMap\`,
        ADD COLUMN IF NOT EXISTS \`checkInStart\`        TIMESTAMP    NULL AFTER \`draftType\`,
        ADD COLUMN IF NOT EXISTS \`checkInEnd\`          TIMESTAMP    NULL AFTER \`checkInStart\`,
        ADD COLUMN IF NOT EXISTS \`contactInfo\`         TEXT         NULL AFTER \`checkInEnd\`,
        ADD COLUMN IF NOT EXISTS \`schedule\`            TEXT         NULL AFTER \`contactInfo\`,
        ADD COLUMN IF NOT EXISTS \`requireRiotAccount\`  TINYINT(1)   NOT NULL DEFAULT 0 AFTER \`schedule\`,
        ADD COLUMN IF NOT EXISTS \`maxFreeAgents\`       INT          NOT NULL DEFAULT 0 AFTER \`requireRiotAccount\`;

      -- Tabla de check-ins de torneos
      CREATE TABLE IF NOT EXISTS \`tournament_checkins\` (
        \`id\`            INT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`tournamentId\`  INT       NOT NULL,
        \`teamId\`        INT       NOT NULL,
        \`checkedInAt\`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`checkedInBy\`   INT       NOT NULL,
        INDEX \`tc_tournament_idx\` (\`tournamentId\`),
        INDEX \`tc_team_idx\` (\`teamId\`)
      );

      -- Tabla de anuncios de torneos
      CREATE TABLE IF NOT EXISTS \`tournament_announcements\` (
        \`id\`            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`tournamentId\`  INT          NOT NULL,
        \`authorId\`      INT          NULL,
        \`authorName\`    VARCHAR(128) NULL DEFAULT 'Sistema',
        \`message\`       TEXT         NOT NULL,
        \`isSystem\`      TINYINT(1)   NOT NULL DEFAULT 0,
        \`createdAt\`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`ta_tournament_idx\` (\`tournamentId\`)
      );

      -- Tabla de agentes libres de torneos
      CREATE TABLE IF NOT EXISTS \`tournament_free_agents\` (
        \`id\`            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`tournamentId\`  INT          NOT NULL,
        \`userId\`        INT          NOT NULL,
        \`role\`          VARCHAR(32)  NULL,
        \`riotId\`        VARCHAR(128) NULL,
        \`message\`       TEXT         NULL,
        \`status_fa\`     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        \`createdAt\`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`tfa_tournament_idx\` (\`tournamentId\`),
        INDEX \`tfa_user_idx\` (\`userId\`)
      );
    `,
  },
];

export async function runMigrations() {
  const db = await getDb();
  if (!db) {
    console.warn("[migrations] DB not available, skipping migrations");
    return;
  }

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
