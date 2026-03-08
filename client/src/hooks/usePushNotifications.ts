/**
 * usePushNotifications.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * React hook to register/unregister Web Push subscriptions.
 * Registers the service worker, requests Notification permission,
 * and sends the subscription to the backend.
 */
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: vapidKey } = trpc.push.vapidPublicKey.useQuery();
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();

  // Check current state on mount
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);
    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    }).catch(() => {});
  }, []);

  // Register service worker on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.warn("[SW] Registration failed:", err);
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setIsLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await subscribeMutation.mutateAsync({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error("[Push] Subscribe failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [vapidKey, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeMutation.mutateAsync({ endpoint: sub.endpoint });
        await sub.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error("[Push] Unsubscribe failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [unsubscribeMutation]);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
