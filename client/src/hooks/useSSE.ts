/**
 * useSSE — Real-time updates via tRPC v11 native SSE subscriptions
 *
 * Connects to the tRPC `notifications.subscribe` procedure using
 * httpSubscriptionLink and invalidates React Query caches when the server
 * pushes events. This makes all data changes (follows, banners, news,
 * tournaments, allies, ads) appear instantly without manual refresh.
 *
 * Usage: call once in the root layout component (App.tsx or Layout.tsx).
 *
 * Migration note:
 *   Previously this hook used a raw EventSource on /api/sse?userId=<id>.
 *   Now it uses tRPC's native subscription mechanism:
 *   - Authentication is handled by the session cookie (no userId in URL)
 *   - Reconnection and error recovery are managed by tRPC's httpSubscriptionLink
 *   - The legacy /api/sse endpoint is kept for backwards compatibility
 */
import { skipToken } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

interface UseSSEOptions {
  /** Authenticated user ID, if any. Only subscribes when a user is logged in. */
  userId?: number | null;
}

export function useSSE({ userId }: UseSSEOptions = {}) {
  const utils = trpc.useUtils();

  // Only subscribe when the user is authenticated.
  // skipToken disables the subscription when userId is null/undefined.
  trpc.notifications.subscribe.useSubscription(
    userId ? {} : skipToken,
    {
      onData(event) {
        const type = event.type as string;

        // ── Tournament events ──────────────────────────────────────────────
        if (type === "tournament") {
          utils.tournaments.list.invalidate();
          utils.tournaments.byId.invalidate();
          utils.home.featuredTournaments.invalidate();
          return;
        }

        // ── News events ─────────────────────────────────────────────────────
        if (type === "news") {
          utils.news.list.invalidate();
          utils.news.bySlug.invalidate();
          utils.news.byId.invalidate();
          return;
        }

        // ── Banner events ─────────────────────────────────────────────────────
        if (type === "banner") {
          utils.banners.getSection.invalidate();
          utils.banners.listAll.invalidate();
          return;
        }

        // ── Ad events ─────────────────────────────────────────────────────
        if (type === "ad") {
          utils.ads.list.invalidate();
          return;
        }

        // ── Ally events ────────────────────────────────────────────────────
        if (type === "ally") {
          utils.allies.list.invalidate();
          utils.allies.locations.invalidate();
          return;
        }

        // ── Follow / Unfollow events (private, per-user) ───────────────────
        if (type === "follow") {
          utils.follows.getCounts.invalidate();
          utils.follows.getFollowers.invalidate();
          utils.follows.getFollowing.invalidate();
          utils.follows.isFollowing.invalidate();
          utils.profile.getWithStats.invalidate();
          utils.notifications.unreadCount.invalidate();
          utils.notifications.list.invalidate();
          return;
        }

        if (type === "unfollow") {
          utils.follows.getCounts.invalidate();
          utils.follows.getFollowers.invalidate();
          utils.follows.getFollowing.invalidate();
          utils.follows.isFollowing.invalidate();
          utils.profile.getWithStats.invalidate();
          return;
        }

        // ── Notification events ────────────────────────────────────────────
        if (type === "notification") {
          utils.notifications.unreadCount.invalidate();
          utils.notifications.list.invalidate();
          return;
        }

        // ── Coins events ─────────────────────────────────────────────────────
        if (type === "coins") {
          utils.profile.getWithStats.invalidate();
          utils.auth.me.invalidate();
          return;
        }
      },
      onError(err) {
        console.error("[tRPC SSE] Subscription error:", err);
      },
    },
  );
}
