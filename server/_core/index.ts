import "dotenv/config";
import express from "express";
import { registerNotificationListeners } from "../notifications";
import { registerNewsGeneratorListeners } from "../newsGenerator";
import { startTwitchSyncJob } from "../twitchSync";
import { registerWebhookRoutes } from "../webhooks";
import { startBetsClosingJob } from "../betsClosingJob";
import { startSeriesCronJob } from "../seriesCronJob";
import { setupStreamChatWS } from "../streamChat";
import { closeDbPool } from "../db";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { sseHandler } from "../sse";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function runMigrations() {
  if (!process.env.DATABASE_URL) return;
  try {
    const { drizzle } = await import("drizzle-orm/mysql2");
    const { migrate } = await import("drizzle-orm/mysql2/migrator");
    const db = drizzle(process.env.DATABASE_URL);
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[DB] Migrations applied successfully");
  } catch (err) {
    console.warn("[DB] Migration warning:", (err as Error).message);
  }
}

// Apply manual schema changes that were added outside of drizzle-kit generate
// NOTE: Railway MySQL does NOT support ADD COLUMN IF NOT EXISTS syntax.
// We use plain ALTER TABLE and catch error 1060 (ER_DUP_FIELDNAME) when column already exists.
async function runCustomMigrations() {
  if (!process.env.DATABASE_URL) return;
  const mysql2 = await import("mysql2/promise");
  const conn = await mysql2.createConnection(process.env.DATABASE_URL);
  const customMigrations = [
    // 0027: creator social networks
    "ALTER TABLE `content_creators` ADD COLUMN `facebook` varchar(256)",
    "ALTER TABLE `content_creators` ADD COLUMN `kick` varchar(256)",
    // content_creators extra columns that may be missing in Railway
    "ALTER TABLE `content_creators` ADD COLUMN `subscribers` int DEFAULT 0",
    "ALTER TABLE `content_creators` ADD COLUMN `adminNote` text",
    "ALTER TABLE `content_creators` ADD COLUMN `appliedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE `content_creators` ADD COLUMN `reviewedAt` timestamp NULL",
    "ALTER TABLE `content_creators` ADD COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    // 0028: news reference and gallery
    "ALTER TABLE `news` ADD COLUMN `referenceUrl` text",
    "ALTER TABLE `news` ADD COLUMN `gallery` text",
    // 0029: allies tiktok
    "ALTER TABLE `allies` ADD COLUMN `tiktok` varchar(128)",
    // 0030: tournament matches — nuevos estados y ventana de apuestas
    "ALTER TABLE `tournament_matches` MODIFY COLUMN `status` ENUM('pending','betting_open','locked','in_progress','completed') NOT NULL DEFAULT 'pending'",
    "ALTER TABLE `tournament_matches` ADD COLUMN `betsOpenAt` timestamp NULL",
    // 0031: tournaments — formato de serie por defecto
    "ALTER TABLE `tournaments` ADD COLUMN `defaultSeriesFormat` ENUM('BO1','BO2','BO3','BO5','BO7') NOT NULL DEFAULT 'BO1'",
    // 0032: tournament_rankings — tabla de clasificación por torneo
    'CREATE TABLE IF NOT EXISTS `tournament_rankings` (' +
    '  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `tournamentId` int NOT NULL,' +
    '  `teamId` int NOT NULL,' +
    '  `points` int NOT NULL DEFAULT 0,' +
    '  `seriesPlayed` int NOT NULL DEFAULT 0,' +
    '  `seriesWon` int NOT NULL DEFAULT 0,' +
    '  `seriesDrawn` int NOT NULL DEFAULT 0,' +
    '  `seriesLost` int NOT NULL DEFAULT 0,' +
    '  `mapsWon` int NOT NULL DEFAULT 0,' +
    '  `mapsLost` int NOT NULL DEFAULT 0,' +
    '  `mapDiff` int NOT NULL DEFAULT 0,' +
    '  `position` int NOT NULL DEFAULT 0,' +
    '  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' +
    ')',
    // 0036: collections — tabla de colecciones temáticas
    'CREATE TABLE IF NOT EXISTS `collections` (' +
    '  `id`          int          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `name`        varchar(128) NOT NULL,' +
    '  `slug`        varchar(128) NOT NULL UNIQUE,' +
    '  `description` text         NULL,' +
    '  `bannerImage` text         NULL,' +
    '  `isActive`    tinyint(1)   NOT NULL DEFAULT 1,' +
    '  `isFeatured`  tinyint(1)   NOT NULL DEFAULT 0,' +
    '  `startDate`   timestamp    NULL,' +
    '  `endDate`     timestamp    NULL,' +
    '  `createdAt`   timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ')',
    // 0033: cosmetics — supply & drop window fields
    'ALTER TABLE `cosmetics` ADD COLUMN `maxSupply` int NULL',
    'ALTER TABLE `cosmetics` ADD COLUMN `currentSupply` int NOT NULL DEFAULT 0',
    'ALTER TABLE `cosmetics` ADD COLUMN `dropStart` timestamp NULL',
    'ALTER TABLE `cosmetics` ADD COLUMN `dropEnd` timestamp NULL',
    // 0034: catalog_items — tabla base + rotation & scheduling fields
    'CREATE TABLE IF NOT EXISTS `catalog_items` (' +
    '  `id`           int          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `type`         ENUM(\'physical\',\'cosmetic\') NOT NULL,' +
    '  `referenceId`  int          NOT NULL,' +
    '  `title`        varchar(256) NOT NULL,' +
    '  `isFeatured`   tinyint(1)   NOT NULL DEFAULT 0,' +
    '  `isVisible`    tinyint(1)   NOT NULL DEFAULT 1,' +
    '  `weeklyFeatured` tinyint(1) NOT NULL DEFAULT 0,' +
    '  `featuredPriority` int      NOT NULL DEFAULT 0,' +
    '  `visibleFrom`  timestamp    NULL,' +
    '  `visibleUntil` timestamp    NULL,' +
    '  `publishDate`  timestamp    NULL,' +
    '  `collectionId` int          NULL,' +
    '  `sortOrder`    int          NOT NULL DEFAULT 0,' +
    '  `createdAt`    timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ')',
    'ALTER TABLE `catalog_items` ADD COLUMN `weeklyFeatured` tinyint(1) NOT NULL DEFAULT 0',
    'ALTER TABLE `catalog_items` ADD COLUMN `featuredPriority` int NOT NULL DEFAULT 0',
    'ALTER TABLE `catalog_items` ADD COLUMN `visibleFrom` timestamp NULL',
    'ALTER TABLE `catalog_items` ADD COLUMN `visibleUntil` timestamp NULL',
    'ALTER TABLE `catalog_items` ADD COLUMN `publishDate` timestamp NULL',
    // 0035: drops table — scheduled launch events
    'CREATE TABLE IF NOT EXISTS `drops` (' +
    '  `id`           int          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `name`         varchar(128) NOT NULL,' +
    '  `slug`         varchar(128) NOT NULL UNIQUE,' +
    '  `description`  text         NULL,' +
    '  `bannerImage`  text         NULL,' +
    '  `collectionId` int          NULL,' +
    '  `startDate`    timestamp    NOT NULL,' +
    '  `endDate`      timestamp    NOT NULL,' +
    '  `isActive`     tinyint(1)   NOT NULL DEFAULT 0,' +
    '  `createdAt`    timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ')',
    // 0037: brand_ads — imagen móvil específica para el carrusel
    'ALTER TABLE `brand_ads` ADD COLUMN `mobileImage` text NULL AFTER `bannerImage`',
    // 0038: missions system — misiones patrocinadas con video
    'CREATE TABLE IF NOT EXISTS `missions` (' +
    '  `id`                   int          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `title`                varchar(256) NOT NULL,' +
    '  `description`          text,' +
    '  `bannerUrl`             text,' +
    '  `videoUrl`              text         NOT NULL,' +
    '  `sponsorName`           varchar(128),' +
    '  `sponsorLogo`           text,' +
    '  `rewardRlc`             int          NOT NULL DEFAULT 0,' +
    '  `requiredWatchSeconds`  int          NOT NULL DEFAULT 30,' +
    '  `startDate`             timestamp    NULL,' +
    '  `endDate`               timestamp    NULL,' +
    '  `isActive`              tinyint(1)   NOT NULL DEFAULT 1,' +
    '  `createdAt`             timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ')',
    'CREATE TABLE IF NOT EXISTS `userMissions` (' +
    '  `id`             int          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `userId`         int          NOT NULL,' +
    '  `missionId`      int          NOT NULL,' +
    '  `accepted`       tinyint(1)   NOT NULL DEFAULT 0,' +
    '  `watchedSeconds` int          NOT NULL DEFAULT 0,' +
    '  `completed`      tinyint(1)   NOT NULL DEFAULT 0,' +
    '  `claimed`        tinyint(1)   NOT NULL DEFAULT 0,' +
    '  `completedAt`    timestamp    NULL,' +
    '  `createdAt`      timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  UNIQUE KEY `userMissions_userId_missionId_unique` (`userId`, `missionId`)' +
    ')',
    'CREATE TABLE IF NOT EXISTS `missionClaims` (' +
    '  `id`         int          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `userId`     int          NOT NULL,' +
    '  `missionId`  int          NOT NULL,' +
    '  `rewardRlc`  int          NOT NULL,' +
    '  `claimedAt`  timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ')',
    // 0039: creator missions system
    'CREATE TABLE IF NOT EXISTS `creator_missions` (' +
    '  `id`            int           NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `title`         varchar(255)  NOT NULL,' +
    '  `description`   text          NOT NULL,' +
    '  `requirements`  text          NULL,' +
    '  `resourcesUrl`  varchar(500)  NULL,' +
    '  `platforms`     varchar(255)  NULL,' +
    '  `rewardRlc`     int           NOT NULL DEFAULT 0,' +
    '  `bonusRlc`      int           NOT NULL DEFAULT 0,' +
    '  `startDate`     timestamp     NULL,' +
    '  `endDate`       timestamp     NULL,' +
    '  `isActive`      tinyint(1)    NOT NULL DEFAULT 1,' +
    '  `createdBy`     int           NOT NULL,' +
    '  `createdAt`     timestamp     NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  `updatedAt`     timestamp     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' +
    ')',
    'CREATE TABLE IF NOT EXISTS `creator_mission_accepts` (' +
    '  `id`         int        NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `missionId`  int        NOT NULL,' +
    '  `userId`     int        NOT NULL,' +
    '  `acceptedAt` timestamp  NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  UNIQUE KEY `cma_unique` (`missionId`, `userId`)' +
    ')',
    'CREATE TABLE IF NOT EXISTS `creator_mission_submissions` (' +
    '  `id`          int          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `missionId`   int          NOT NULL,' +
    '  `userId`      int          NOT NULL,' +
    '  `status_cms`  ENUM(\'pending\',\'approved\',\'rejected\') NOT NULL DEFAULT \'pending\',' +
    '  `adminNote`   text         NULL,' +
    '  `rewardPaid`  tinyint(1)   NOT NULL DEFAULT 0,' +
    '  `submittedAt` timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  `reviewedAt`  timestamp    NULL,' +
    '  `reviewedBy`  int          NULL,' +
    '  UNIQUE KEY `cms_unique` (`missionId`, `userId`)' +
    ')',
    // Fix: rename status column to status_cms if it exists as varchar
    'ALTER TABLE `creator_mission_submissions` CHANGE COLUMN `status` `status_cms` ENUM(\'pending\',\'approved\',\'rejected\') NOT NULL DEFAULT \'pending\'',
    'ALTER TABLE `creator_mission_submissions` ADD COLUMN `reviewedBy` int NULL',
    'CREATE TABLE IF NOT EXISTS `creator_mission_links` (' +
    '  `id`           int          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `submissionId` int          NOT NULL,' +
    '  `url`          text         NOT NULL,' +
    '  `platform`     varchar(64)  NULL,' +
    '  `addedAt`      timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ')',
    // Fix: rename createdAt to addedAt if it exists
    'ALTER TABLE `creator_mission_links` CHANGE COLUMN `createdAt` `addedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP',
    // 0040: stream_chat_messages — chat propio de RLC por stream
    'CREATE TABLE IF NOT EXISTS `stream_chat_messages` (' +
    '  `id`           int          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `streamId`     int          NOT NULL,' +
    '  `userId`       int          NOT NULL,' +
    '  `userName`     varchar(128) NOT NULL,' +
    '  `userAvatar`   text         NULL,' +
    '  `userRole`     varchar(32)  NULL DEFAULT \'user\',' +
    '  `userNickname` varchar(64)  NULL,' +
    '  `message`      text         NOT NULL,' +
    '  `createdAt`    timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  KEY `scm_stream_idx` (`streamId`)' +
    ')',
    // 0041: riot account linking columns
    'ALTER TABLE `users` ADD COLUMN `riotPuuid`      VARCHAR(78)  NULL',
    'ALTER TABLE `users` ADD COLUMN `riotGameName`   VARCHAR(64)  NULL',
    'ALTER TABLE `users` ADD COLUMN `riotTagLine`    VARCHAR(16)  NULL',
    'ALTER TABLE `users` ADD COLUMN `riotRegion`     VARCHAR(8)   NULL',
    'ALTER TABLE `users` ADD COLUMN `riotSummonerId` VARCHAR(128) NULL',
    'ALTER TABLE `users` ADD COLUMN `riotIconId`     INT          NULL',
    // 0042: tournament Battlefy-style fields
    'ALTER TABLE `tournaments` ADD COLUMN `region`             VARCHAR(32)  NULL',
    'ALTER TABLE `tournaments` ADD COLUMN `gameMap`            VARCHAR(64)  NULL',
    'ALTER TABLE `tournaments` ADD COLUMN `draftType`          VARCHAR(32)  NULL DEFAULT \'tournament_draft\'',
    'ALTER TABLE `tournaments` ADD COLUMN `checkInStart`       TIMESTAMP    NULL',
    'ALTER TABLE `tournaments` ADD COLUMN `checkInEnd`         TIMESTAMP    NULL',
    'ALTER TABLE `tournaments` ADD COLUMN `contactInfo`        TEXT         NULL',
    'ALTER TABLE `tournaments` ADD COLUMN `schedule`           TEXT         NULL',
    'ALTER TABLE `tournaments` ADD COLUMN `requireRiotAccount` TINYINT(1)   NOT NULL DEFAULT 0',
    'ALTER TABLE `tournaments` ADD COLUMN `maxFreeAgents`      INT          NOT NULL DEFAULT 0',
    // 0042b: tournament_checkins table
    'CREATE TABLE IF NOT EXISTS `tournament_checkins` (' +
    '  `id`            INT       NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `tournamentId`  INT       NOT NULL,' +
    '  `teamId`        INT       NOT NULL,' +
    '  `checkedInAt`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  `checkedInBy`   INT       NOT NULL,' +
    '  KEY `tc_tournament_idx` (`tournamentId`),' +
    '  KEY `tc_team_idx` (`teamId`)' +
    ')',
    // 0042c: tournament_announcements table
    'CREATE TABLE IF NOT EXISTS `tournament_announcements` (' +
    '  `id`            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `tournamentId`  INT          NOT NULL,' +
    '  `authorId`      INT          NULL,' +
    '  `authorName`    VARCHAR(128) NULL DEFAULT \'Sistema\',' +
    '  `message`       TEXT         NOT NULL,' +
    '  `isSystem`      TINYINT(1)   NOT NULL DEFAULT 0,' +
    '  `createdAt`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  KEY `ta_tournament_idx` (`tournamentId`)' +
    ')',
    // 0042d: tournament_free_agents table
    'CREATE TABLE IF NOT EXISTS `tournament_free_agents` (' +
    '  `id`            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `tournamentId`  INT          NOT NULL,' +
    '  `userId`        INT          NOT NULL,' +
    '  `role`          VARCHAR(32)  NULL,' +
    '  `riotId`        VARCHAR(128) NULL,' +
    '  `message`       TEXT         NULL,' +
    '  `status_fa`     VARCHAR(16)  NOT NULL DEFAULT \'pending\',' +
    '  `createdAt`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  KEY `tfa_tournament_idx` (`tournamentId`),' +
    '  KEY `tfa_user_idx` (`userId`)' +
    ')',
    // 0043: tournaments — invite code for private tournaments
    'ALTER TABLE `tournaments` ADD COLUMN `inviteCode` VARCHAR(32) NULL',
    // 0044: match chat messages
    'CREATE TABLE IF NOT EXISTS `match_chat_messages` (' +
    '  `id`          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `matchId`     INT          NOT NULL,' +
    '  `userId`      INT          NOT NULL,' +
    '  `userName`    VARCHAR(128) NOT NULL,' +
    '  `userAvatar`  TEXT         NULL,' +
    '  `teamId`      INT          NULL,' +
    '  `message`     TEXT         NOT NULL,' +
    '  `isSystem`    TINYINT(1)   NOT NULL DEFAULT 0,' +
    '  `createdAt`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  KEY `mcm_match_idx` (`matchId`)' +
    ')',
    // 0045: match disputes
    'CREATE TABLE IF NOT EXISTS `match_disputes` (' +
    '  `id`            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `matchId`       INT          NOT NULL,' +
    '  `tournamentId`  INT          NOT NULL,' +
    '  `reportedBy`    INT          NOT NULL,' +
    '  `teamId`        INT          NOT NULL,' +
    '  `reason`        TEXT         NOT NULL,' +
    '  `screenshotUrl` TEXT         NULL,' +
    '  `status_md`     VARCHAR(16)  NOT NULL DEFAULT \'open\',' +
    '  `resolvedBy`    INT          NULL,' +
    '  `resolution`    TEXT         NULL,' +
    '  `resolvedAt`    TIMESTAMP    NULL,' +
    '  `createdAt`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  KEY `md_match_idx` (`matchId`),' +
    '  KEY `md_tournament_idx` (`tournamentId`)' +
    ')',
    // 0046: match result confirmations
    'CREATE TABLE IF NOT EXISTS `match_result_confirmations` (' +
    '  `id`         INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `matchId`    INT         NOT NULL,' +
    '  `teamId`     INT         NOT NULL,' +
    '  `userId`     INT         NOT NULL,' +
    '  `action_mrc` VARCHAR(16) NOT NULL,' +
    '  `createdAt`  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  KEY `mrc_match_idx` (`matchId`)' +
    ')',
    // 0047: tournament activity log
    'CREATE TABLE IF NOT EXISTS `tournament_activity_log` (' +
    '  `id`           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `tournamentId` INT          NOT NULL,' +
    '  `eventType`    VARCHAR(64)  NOT NULL,' +
    '  `description`  TEXT         NOT NULL,' +
    '  `userId`       INT          NULL,' +
    '  `teamId`       INT          NULL,' +
    '  `matchId`      INT          NULL,' +
    '  `metadata`     JSON         NULL,' +
    '  `createdAt`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  KEY `tal_tournament_idx` (`tournamentId`)' +
    ')',
    // 0048: match check-ins
    'CREATE TABLE IF NOT EXISTS `match_checkins` (' +
    '  `id`          INT       NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
    '  `matchId`     INT       NOT NULL,' +
    '  `teamId`      INT       NOT NULL,' +
    '  `userId`      INT       NOT NULL,' +
    '  `checkedInAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  KEY `mci_match_idx` (`matchId`)' +
    ')',
    // 0049: tournaments — swiss and round_robin bracket types
    "ALTER TABLE `tournaments` MODIFY COLUMN `bracketType` ENUM('single_elimination','double_elimination','groups','swiss','round_robin') NOT NULL",
    // 0050: content_creators — youtubeChannelId for stable embed URLs
    'ALTER TABLE `content_creators` ADD COLUMN `youtubeChannelId` VARCHAR(64) NULL',
    // 0051a: users — map old roles to new role system before MODIFY COLUMN
    // user -> player, premium -> player, organizer -> to (must run before MODIFY COLUMN)
    "UPDATE `users` SET `role` = 'player' WHERE `role` IN ('user', 'premium')",
    "UPDATE `users` SET `role` = 'to' WHERE `role` = 'organizer'",
    // 0051b: users — role system (player/to/cdc/partner/admin/super_admin)
    "ALTER TABLE `users` MODIFY COLUMN `role` ENUM('player','to','cdc','partner','admin','super_admin') NOT NULL DEFAULT 'player'",
    // 0052: users — canCreateTournaments flag for CDC/Partner with special permission
    'ALTER TABLE `users` ADD COLUMN `canCreateTournaments` BOOLEAN NOT NULL DEFAULT false',
    // 0053: users — org profile fields for Tournament Organizers
    'ALTER TABLE `users` ADD COLUMN `orgName` VARCHAR(128) NULL',
    'ALTER TABLE `users` ADD COLUMN `orgDescription` TEXT NULL',
    // 0054: role_requests table
    'CREATE TABLE IF NOT EXISTS `role_requests` (' +
    '  `id`            INT AUTO_INCREMENT PRIMARY KEY,' +
    '  `userId`        INT NOT NULL,' +
    '  `requestedRole` ENUM(\'to\',\'cdc\',\'partner\') NOT NULL,' +
    '  `orgName`       VARCHAR(128) NOT NULL,' +
    '  `orgDescription` TEXT NULL,' +
    '  `experience`    TEXT NULL,' +
    '  `discordContact` VARCHAR(128) NULL,' +
    '  `websiteUrl`    VARCHAR(256) NULL,' +
    '  `status`        ENUM(\'pending\',\'approved\',\'rejected\') NOT NULL DEFAULT \'pending\',' +
    '  `reviewedBy`    INT NULL,' +
    '  `reviewNote`    TEXT NULL,' +
    '  `reviewedAt`    TIMESTAMP NULL,' +
    '  `createdAt`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  `updatedAt`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,' +
    '  INDEX `rr_user_idx` (`userId`)' +
    ')',
    // 0055: tournament_collaborators table
    'CREATE TABLE IF NOT EXISTS `tournament_collaborators` (' +
    '  `id`           INT AUTO_INCREMENT PRIMARY KEY,' +
    '  `tournamentId` INT NOT NULL,' +
    '  `userId`       INT NOT NULL,' +
    '  `addedBy`      INT NOT NULL,' +
    '  `addedAt`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  INDEX `tc_tournament_idx` (`tournamentId`),' +
    '  INDEX `tc_user_idx` (`userId`),' +
    '  UNIQUE KEY `tc_unique` (`tournamentId`, `userId`)' +
    ')',
    // 0056: push_subscriptions table for Web Push (VAPID) native notifications
    'CREATE TABLE IF NOT EXISTS `push_subscriptions` (' +
    '  `id`        INT AUTO_INCREMENT PRIMARY KEY,' +
    '  `userId`    INT NOT NULL,' +
    '  `endpoint`  VARCHAR(512) NOT NULL,' +
    '  `p256dh`    VARCHAR(256) NOT NULL,' +
    '  `auth`      VARCHAR(128) NOT NULL,' +
    '  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '  INDEX `ps_user_idx` (`userId`),' +
    '  UNIQUE KEY `ps_endpoint_unique` (`endpoint`(255))' +
    ')',
  ];
  for (const sql of customMigrations) {
    try {
      await conn.execute(sql);
    } catch (err: any) {
      // 1060 = ER_DUP_FIELDNAME: column already exists
      // 1050 = ER_TABLE_EXISTS_ERROR: table already exists (CREATE TABLE IF NOT EXISTS)
      // 1146 = ER_NO_SUCH_TABLE: table doesn't exist yet for ALTER
      // 1054 = ER_BAD_FIELD_ERROR: column doesn't exist (CHANGE COLUMN on non-existent column)
      // 1091 = ER_CANT_DROP_FIELD_OR_KEY: can't drop field that doesn't exist
      // 1265 = ER_WARN_DATA_TRUNCATED: MODIFY COLUMN enum when old values exist (migration 0051 handles data first)
      const ignoredErrno = [1050, 1054, 1060, 1091, 1146, 1265];
      const ignoredCodes = ["ER_DUP_FIELDNAME", "ER_TABLE_EXISTS_ERROR", "ER_BAD_FIELD_ERROR", "ER_NO_SUCH_TABLE", "ER_CANT_DROP_FIELD_OR_KEY"];
      if (!ignoredErrno.includes(err.errno) && !ignoredCodes.includes(err.code)) {
        console.warn("[DB] Custom migration warning:", err.message, "errno:", err.errno, "code:", err.code);
      }
    }
  }
  await conn.end();
  console.log("[DB] Custom migrations applied");
}

async function startServer() {
  await runMigrations();
  await runCustomMigrations();
  const app = express();
  const server = createServer(app);

  // Railway (y cualquier proxy inverso) reenvía el tráfico HTTPS al servidor
  // como HTTP interno. Sin esta línea, Express no sabe que está detrás de HTTPS
  // y las cookies de sesión no reciben el flag `Secure`, lo que hace que
  // Chrome muestre "No es seguro" aunque el certificado SSL sea válido.
  app.set("trust proxy", 1);

  // Webhook routes MUST be registered BEFORE express.json() to capture raw body for signature verification
  registerWebhookRoutes(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Server-Sent Events — real-time push to clients
  app.get("/api/sse", sseHandler);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // ─── Exportación de torneos (CSV) ──────────────────────────────────────────────────────────────────────────────────────
  app.get("/api/tournaments/:id/export", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { tournaments, tournamentRegistrations, tournamentMatches, teams } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "DB not available" });
      const tournamentId = parseInt(req.params.id);
      if (isNaN(tournamentId)) return res.status(400).json({ error: "Invalid tournament id" });
      const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
      if (!tournament) return res.status(404).json({ error: "Tournament not found" });
      const format = (req.query.format as string) || "csv";
      // Fetch registrations with team names
      const regs = await db
        .select({
          teamId: tournamentRegistrations.teamId,
          status: tournamentRegistrations.status,
          registeredAt: tournamentRegistrations.registeredAt,
          teamName: teams.name,
          teamTag: teams.tag,
        })
        .from(tournamentRegistrations)
        .leftJoin(teams, eq(teams.id, tournamentRegistrations.teamId))
        .where(eq(tournamentRegistrations.tournamentId, tournamentId));
      // Fetch matches
      const matches = await db.select().from(tournamentMatches).where(eq(tournamentMatches.tournamentId, tournamentId));
      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="torneo-${tournamentId}.json"`);
        return res.json({ tournament: { id: tournament.id, name: tournament.name, status: tournament.status, game: tournament.game }, registrations: regs, matches: matches.map(m => ({ id: m.id, round: m.round, matchNumber: m.matchNumber, team1Name: m.team1Name, team2Name: m.team2Name, team1Score: m.team1Score, team2Score: m.team2Score, winnerId: m.winnerId, completedAt: m.completedAt })) });
      }
      // CSV format
      const lines: string[] = [];
      lines.push(`TORNEO: ${tournament.name}`);
      lines.push(`Juego: ${tournament.game}`);
      lines.push(`Estado: ${tournament.status}`);
      lines.push(`Exportado: ${new Date().toLocaleString("es-ES")}`);
      lines.push("");
      lines.push("=== PARTICIPANTES ===");
      lines.push("Equipo,Tag,Estado,Fecha Inscripción");
      for (const r of regs) {
        lines.push(`"${r.teamName ?? ""}","${r.teamTag ?? ""}","${r.status}","${r.registeredAt ? new Date(r.registeredAt).toLocaleString("es-ES") : ""}"`);
      }
      lines.push("");
      lines.push("=== RESULTADOS ===");
      lines.push("Ronda,Match,Equipo 1,Equipo 2,Score 1,Score 2,Ganador");
      for (const m of matches) {
        if (m.winnerId) {
          const winner = m.winnerId === m.team1Id ? m.team1Name : m.team2Name;
          lines.push(`${m.round ?? ""},${m.matchNumber ?? ""},"${m.team1Name ?? "TBD"}","${m.team2Name ?? "TBD"}",${m.team1Score ?? ""},${m.team2Score ?? ""},"${winner ?? ""}"`);
        }
      }
      const csv = lines.join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="torneo-${tournamentId}.csv"`);
      return res.send("\uFEFF" + csv); // BOM for Excel UTF-8
    } catch (err) {
      console.error("[Export] Error:", err);
      return res.status(500).json({ error: "Export failed" });
    }
  });

  // Stream chat WebSocket server
  setupStreamChatWS(server);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // ─── Background jobs ─────────────────────────────────────────────────────────
  // Se inician DESPUÉS de runCustomMigrations() para garantizar que todas las
  // columnas existen antes del primer ciclo de sync (evita warnings de columnas
  // no disponibles como youtubeChannelId en el arranque).
  // Register event-driven notification listeners
  registerNotificationListeners();
  // Register auto-news generation listeners (GPT-powered)
  registerNewsGeneratorListeners();
  // Start Twitch stream sync job (polls every 30s, auto-creates/closes streams)
  startTwitchSyncJob();
  // Start bets closing job (checks every 60s for expired betting windows)
  startBetsClosingJob();
  // Start series cron job: regla 60/5 (abrir/bloquear apuestas, transiciones de estado)
  startSeriesCronJob();
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────────────
//
// Railway envía SIGTERM antes de detener el contenedor.
// Cerramos el pool de DB limpiamente para evitar conexiones colgadas
// y asegurar que todas las queries en vuelo terminen.

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Server] ${signal} recibido — iniciando graceful shutdown...`);
  try {
    await closeDbPool();
    console.log("[Server] Shutdown completo.");
  } catch (err) {
    console.error("[Server] Error durante shutdown:", err);
  }
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// Capturar errores no manejados para evitar que el proceso muera silenciosamente
process.on("uncaughtException", (err) => {
  console.error("[Server] uncaughtException:", err);
  // No salir — Railway reiniciará el proceso si es necesario
});
process.on("unhandledRejection", (reason) => {
  console.error("[Server] unhandledRejection:", reason);
});

startServer().catch(console.error);
