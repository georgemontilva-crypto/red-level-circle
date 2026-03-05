import "dotenv/config";
import express from "express";
import { registerNotificationListeners } from "../notifications";
import { registerNewsGeneratorListeners } from "../newsGenerator";
import { startTwitchSyncJob } from "../twitchSync";
import { startBetsClosingJob } from "../betsClosingJob";
import { startSeriesCronJob } from "../seriesCronJob";
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
    'ALTER TABLE `brand_ads` ADD COLUMN `mobileImage` text NULL AFTER `bannerImage`'
  ];
  for (const sql of customMigrations) {
    try {
      await conn.execute(sql);
    } catch (err: any) {
      // 1060 = ER_DUP_FIELDNAME: column already exists
      // 1050 = ER_TABLE_EXISTS_ERROR: table already exists (CREATE TABLE IF NOT EXISTS)
      // 1146 = ER_NO_SUCH_TABLE: table doesn't exist yet for ALTER (will be created by CREATE TABLE above)
      const ignoredErrno = [1050, 1060];
      const ignoredCodes = ["ER_DUP_FIELDNAME", "ER_TABLE_EXISTS_ERROR"];
      if (!ignoredErrno.includes(err.errno) && !ignoredCodes.includes(err.code)) {
        console.warn("[DB] Custom migration warning:", err.message);
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
}

// Register event-driven notification listeners
registerNotificationListeners();
// Register auto-news generation listeners (GPT-powered)
registerNewsGeneratorListeners();
// Start Twitch stream sync job (polls every 2 minutes)
startTwitchSyncJob();
// Start bets closing job (checks every 60s for expired betting windows)
startBetsClosingJob();
// Start series cron job: regla 60/5 (abrir/bloquear apuestas, transiciones de estado)
startSeriesCronJob();

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
