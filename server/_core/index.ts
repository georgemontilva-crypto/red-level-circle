import "dotenv/config";
import express from "express";
import { registerNotificationListeners } from "../notifications";
import { startTwitchSyncJob } from "../twitchSync";
import { startBetsClosingJob } from "../betsClosingJob";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
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
  ];
  for (const sql of customMigrations) {
    try {
      await conn.execute(sql);
    } catch (err: any) {
      // 1060 = ER_DUP_FIELDNAME: column already exists — safe to ignore
      if (err.errno !== 1060 && err.code !== "ER_DUP_FIELDNAME") {
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
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
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
// Start Twitch stream sync job (polls every 2 minutes)
startTwitchSyncJob();
// Start bets closing job (checks every 60s for expired betting windows)
startBetsClosingJob();

startServer().catch(console.error);
