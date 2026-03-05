/**
 * useSSE — Real-time updates via Server-Sent Events
 *
 * Connects to /api/sse and invalidates React Query caches when the server
 * pushes events. This makes all data changes (follows, banners, news,
 * tournaments, allies, ads) appear instantly without manual refresh.
 *
 * Usage: call once in the root layout component (App.tsx or Layout.tsx).
 */

import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

interface UseSSEOptions {
  /** Authenticated user ID, if any. Passed to server to receive private events. */
  userId?: number | null;
}

export function useSSE({ userId }: UseSSEOptions = {}) {
  const utils = trpc.useUtils();
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const url = userId ? `/api/sse?userId=${userId}` : "/api/sse";
      const es = new EventSource(url);
      esRef.current = es;

      // ── Tournament events ──────────────────────────────────────────────
      es.addEventListener("tournament", () => {
        utils.tournaments.list.invalidate();
        utils.tournaments.byId.invalidate();
        utils.home.featuredTournaments.invalidate();
      });
      // ── News events ─────────────────────────────────────────────────────
      es.addEventListener("news", () => {
        utils.news.list.invalidate();
        utils.news.bySlug.invalidate();
        utils.news.byId.invalidate();
      });

      // ── Banner events ─────────────────────────────────────────────────────
      es.addEventListener("banner", () => {
        utils.banners.getSection.invalidate();
        utils.banners.listAll.invalidate();
      });

       // ── Ad events ─────────────────────────────────────────────────────
      es.addEventListener("ad", () => {
        utils.ads.list.invalidate();
      });

      // ── Ally events ────────────────────────────────────────────────────
      es.addEventListener("ally", () => {
        utils.allies.list.invalidate();
        utils.allies.locations.invalidate();
      });

      // ── Follow / Unfollow events (private, per-user) ───────────────────
      es.addEventListener("follow", () => {
        utils.follows.getCounts.invalidate();
        utils.follows.getFollowers.invalidate();
        utils.follows.getFollowing.invalidate();
        utils.follows.isFollowing.invalidate();
        utils.profile.getWithStats.invalidate();
        utils.notifications.unreadCount.invalidate();
        utils.notifications.list.invalidate();
      });

      es.addEventListener("unfollow", () => {
        utils.follows.getCounts.invalidate();
        utils.follows.getFollowers.invalidate();
        utils.follows.getFollowing.invalidate();
        utils.follows.isFollowing.invalidate();
        utils.profile.getWithStats.invalidate();
      });

      // ── Notification events ────────────────────────────────────────────
      es.addEventListener("notification", () => {
        utils.notifications.unreadCount.invalidate();
        utils.notifications.list.invalidate();
      });
      // ── Coins events ─────────────────────────────────────────────────────
      es.addEventListener("coins", () => {
        utils.profile.getWithStats.invalidate();
        utils.auth.me.invalidate();
      });
      // ── Connection error / reconnect ───────────────────────────────────
      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!destroyed) {
          // Reconnect after 5s
          reconnectTimer.current = setTimeout(connect, 5_000);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [userId]); // reconnect if userId changes (login/logout)
}
