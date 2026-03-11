# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (tsx watch, Vite middleware)
pnpm build        # Build frontend (Vite) + bundle server (esbuild) → dist/
pnpm start        # Run production build
pnpm check        # TypeScript type-check (no emit)
pnpm format       # Prettier format
pnpm test         # Run all tests (vitest)
pnpm db:push      # Generate Drizzle migrations + apply them
```

Run a single test file:
```bash
pnpm vitest run server/tournaments.test.ts
```

## Architecture

Full-stack TypeScript monorepo deployed on Railway (MySQL). The server serves the frontend as static files in production; in development, Vite runs as middleware inside the Express server.

### Directory structure
```
client/src/      # React frontend
server/          # Express + tRPC backend
  _core/         # Entry point, auth, tRPC init, context, OAuth
  routers.ts     # Single tRPC appRouter merging all sub-routers
  db.ts          # All DB access functions (Drizzle ORM over MySQL)
shared/          # Shared types and constants (aliases as @shared)
drizzle/
  schema.ts      # All table definitions (single source of truth)
  relations.ts   # Drizzle ORM relations
  migrations/    # Auto-generated SQL migrations
```

### Path aliases
- `@` → `client/src`
- `@shared` → `shared`

### API layer (tRPC)
All API calls go through tRPC at `/api/trpc`. There are three procedure types defined in `server/_core/trpc.ts`:
- `publicProcedure` — no auth required
- `protectedProcedure` — requires valid session (any authenticated user)
- `adminProcedure` — requires `admin` or `super_admin` role

The single `appRouter` in `server/routers.ts` imports all domain routers. On the client, `client/src/lib/trpc.ts` exports the typed `trpc` client (tRPC + React Query).

### Authentication
Session-based via JWT stored in an HTTP-only cookie (`app_session_id`). Auth flow lives in `server/_core/authService.ts`:
- Email/password (bcrypt, 12 rounds)
- Google OAuth (ID token verification via `google-auth-library`)

`JWT_SECRET` env var is required — server won't start without it.

### Database
MySQL via Drizzle ORM. `server/db.ts` exports all data-access functions; pages/routers never query the DB directly. Schema is defined in `drizzle/schema.ts`.

**Custom migrations**: `server/_core/index.ts` runs `runCustomMigrations()` at startup for schema changes added outside of `drizzle-kit generate` (ALTER TABLE statements). When adding a column manually, append it there; ignore error codes 1050, 1054, 1060, 1091, 1146.

### User roles
`player` | `to` (tournament organizer) | `cdc` | `partner` | `admin` | `super_admin`

TOs with extra permission also have `canCreateTournaments = true` (for CDC/Partner users approved for tournament creation).

### Real-time
- **SSE** (`/api/sse`): server-sent events for real-time push (follows, banners, news, tournaments). Client hook: `client/src/hooks/useSSE.ts`.
- **WebSocket** (`setupStreamChatWS`): per-stream chat. Lives in `server/streamChat.ts`.

### Background jobs (started after migrations)
- `startTwitchSyncJob()` — polls every 30s, auto-creates/closes stream records
- `startBetsClosingJob()` — checks every 60s for expired betting windows
- `startSeriesCronJob()` — 60/5s rule: opens/locks bets, handles state transitions
- `registerNotificationListeners()` / `registerNewsGeneratorListeners()` — event-driven

### Frontend routing
Uses `wouter`. All app routes share `SidebarLayout`. Admin routes (`/admin/*`) render a separate `AdminRouter`. Most pages are lazy-loaded via `React.lazy`.

### Storage
- AWS S3 (`@aws-sdk/client-s3`) for file uploads
- Cloudinary for image transformations
- Sharp for server-side image processing

### Environment variables
Key required vars: `DATABASE_URL`, `JWT_SECRET`. Optional: `GOOGLE_CLIENT_ID`, AWS/Cloudinary credentials, `PORT` (defaults to 3000).
