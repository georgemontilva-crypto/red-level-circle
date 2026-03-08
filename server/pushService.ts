/**
 * pushService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Web Push (VAPID) + Email (Resend) notification service for Red Level Circle.
 *
 * Web Push: sends native OS push notifications to subscribed browsers/PWA.
 * Email: sends transactional emails via Resend for critical events.
 *
 * VAPID keys must be set in Railway environment variables:
 *   VAPID_PUBLIC_KEY  — public key (also exposed to client)
 *   VAPID_PRIVATE_KEY — private key (server only)
 *   VAPID_SUBJECT     — mailto: or URL (e.g. mailto:admin@redlevelcircle.gg)
 *   RESEND_API_KEY    — Resend API key for email
 *   EMAIL_FROM        — sender address (e.g. "RLC <noreply@redlevelcircle.gg>")
 */
import webpush from "web-push";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

// ─── VAPID setup ──────────────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@redlevelcircle.gg";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

// ─── Push subscription management ────────────────────────────────────────────
export async function savePushSubscription(
  userId: number,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Upsert by endpoint to avoid duplicates
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
    .limit(1);
  if (existing.length > 0) {
    // Update userId in case it changed (re-login)
    await db
      .update(pushSubscriptions)
      .set({ userId })
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
  } else {
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });
  }
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function getUserPushSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}

// ─── Send Web Push ────────────────────────────────────────────────────────────
export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  const subs = await getUserPushSubscriptions(userId);
  if (!subs.length) return;

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/favicon.png",
    badge: payload.badge ?? "/favicon.png",
    url: payload.url ?? "/",
    tag: payload.tag ?? "rlc-notification",
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        data,
        { TTL: 86400 } // 24h TTL
      )
    )
  );

  // Remove expired/invalid subscriptions
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      const err = result.reason as any;
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await removePushSubscription(subs[i].endpoint);
      }
    }
  }
}

// ─── Broadcast push to ALL subscribed users ─────────────────────────────────
/**
 * Send a Web Push notification to every user that has at least one active subscription.
 * Used for platform-wide events like news publications.
 * Runs in the background — does NOT block the HTTP response.
 */
export async function broadcastPushToAll(payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  const db = await getDb();
  if (!db) return;
  // Get all unique userIds that have push subscriptions
  const rows = await db
    .selectDistinct({ userId: pushSubscriptions.userId })
    .from(pushSubscriptions);
  // Fire-and-forget: send to each user without blocking
  for (const row of rows) {
    sendPushToUser(row.userId, payload).catch((e) =>
      console.warn(`[Push] broadcastPushToAll failed for user ${row.userId}:`, (e as Error).message)
    );
  }
}

// ─── Email via Resend ─────────────────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Red Level Circle <noreply@redlevelcircle.gg>";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set — skipping email to", payload.to);
    return;
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
  } catch (err) {
    console.error("[Email] Failed to send email:", (err as Error).message);
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Red Level Circle</title>
</head>
<body style="margin:0;padding:0;background:#0e0e10;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e10;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#16191f;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a0a0a,#0e0e10);padding:28px 32px;border-bottom:1px solid rgba(220,38,38,0.3);">
            <table width="100%"><tr>
              <td>
                <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:2px;font-family:monospace;">⬡ RED LEVEL CIRCLE</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0e0e10;padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0;font-size:12px;color:#666;text-align:center;">
              Red Level Circle · Plataforma competitiva de gaming<br/>
              <a href="https://redlevelcircle.gg" style="color:#dc2626;text-decoration:none;">redlevelcircle.gg</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildTournamentApprovedEmail(params: {
  userName: string;
  tournamentName: string;
  tournamentId: number;
}): string {
  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">¡Tu torneo fue aprobado! 🎉</h2>
    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.6;">
      Hola <strong style="color:#fff;">${params.userName}</strong>, tu torneo ha sido revisado y aprobado por el equipo de RLC.
    </p>
    <div style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Torneo</p>
      <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">${params.tournamentName}</p>
    </div>
    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;">
      Ya puedes abrir las inscripciones y gestionar tu torneo desde el panel de control.
    </p>
    <a href="https://redlevelcircle.gg/dashboard/tournament/${params.tournamentId}"
       style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:1px;">
      GESTIONAR TORNEO →
    </a>
  `);
}

export function buildTournamentRejectedEmail(params: {
  userName: string;
  tournamentName: string;
  reason?: string;
}): string {
  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">Torneo no aprobado</h2>
    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.6;">
      Hola <strong style="color:#fff;">${params.userName}</strong>, lamentablemente tu torneo no pudo ser aprobado en esta ocasión.
    </p>
    <div style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Torneo</p>
      <p style="margin:0 0 12px;color:#fff;font-size:18px;font-weight:700;">${params.tournamentName}</p>
      ${params.reason ? `<p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Motivo</p><p style="margin:0;color:#fca5a5;font-size:14px;">${params.reason}</p>` : ""}
    </div>
    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;">
      Puedes corregir los detalles y volver a enviarlo para revisión.
    </p>
    <a href="https://redlevelcircle.gg/dashboard/tournaments"
       style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:1px;">
      VER MIS TORNEOS →
    </a>
  `);
}

export function buildRegistrationApprovedEmail(params: {
  userName: string;
  teamName: string;
  tournamentName: string;
  tournamentId: number;
}): string {
  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">¡Inscripción aprobada! ✅</h2>
    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.6;">
      Hola <strong style="color:#fff;">${params.userName}</strong>, tu equipo ha sido aceptado en el torneo.
    </p>
    <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Equipo</p>
      <p style="margin:0 0 12px;color:#fff;font-size:16px;font-weight:700;">${params.teamName}</p>
      <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Torneo</p>
      <p style="margin:0;color:#4ade80;font-size:16px;font-weight:700;">${params.tournamentName}</p>
    </div>
    <a href="https://redlevelcircle.gg/tournament/${params.tournamentId}"
       style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:1px;">
      VER TORNEO →
    </a>
  `);
}

export function buildRoleApprovedEmail(params: {
  userName: string;
  role: string;
}): string {
  const roleLabels: Record<string, string> = {
    to: "Organizador de Torneos (TO)",
    cdc: "CDC",
    partner: "Partner",
    admin: "Administrador",
  };
  const roleLabel = roleLabels[params.role] ?? params.role.toUpperCase();
  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">¡Rol aprobado! 🏆</h2>
    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.6;">
      Hola <strong style="color:#fff;">${params.userName}</strong>, tu solicitud de rol ha sido aprobada.
    </p>
    <div style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Nuevo rol</p>
      <p style="margin:0;color:#fff;font-size:20px;font-weight:900;letter-spacing:2px;">${roleLabel}</p>
    </div>
    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;">
      Ya puedes acceder a todas las funciones de tu nuevo rol en la plataforma.
    </p>
    <a href="https://redlevelcircle.gg/dashboard"
       style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:1px;">
      IR AL DASHBOARD →
    </a>
  `);
}

// ─── RLC Received ─────────────────────────────────────────────────────────────────────────────────
export async function sendRlcReceivedPush(params: {
  userId: number;
  amount: number;
  newBalance: number;
  type: string;
  description?: string;
}): Promise<void> {
  const typeLabels: Record<string, string> = {
    deposit: "💰 RLC recibidos",
    bet_won: "🏆 ¡Apuesta ganada!",
    refund: "↩️ Reembolso RLC",
    reward: "⭐ Recompensa RLC",
  };
  const title = typeLabels[params.type] ?? "💰 RLC recibidos";
  const body = params.description
    ? `${params.description}. Saldo: ${params.newBalance.toLocaleString()} RLC`
    : `Has recibido ${params.amount.toLocaleString()} RLC. Saldo: ${params.newBalance.toLocaleString()} RLC`;

  await sendPushToUser(params.userId, {
    title,
    body,
    icon: "/favicon.png",
    badge: "/favicon.png",
    url: "/dashboard",
    tag: "rlc-coins",
  });
}

export function buildRlcReceivedEmail(params: {
  userName: string;
  amount: number;
  newBalance: number;
  type: string;
  description?: string;
}): string {
  const typeLabels: Record<string, string> = {
    deposit: "Depósito de RLC",
    bet_won: "Apuesta ganada",
    refund: "Reembolso de RLC",
    reward: "Recompensa RLC",
  };
  const label = typeLabels[params.type] ?? "RLC recibidos";
  const colorMap: Record<string, string> = {
    deposit: "rgba(220,38,38,0.08)",
    bet_won: "rgba(234,179,8,0.08)",
    refund: "rgba(59,130,246,0.08)",
    reward: "rgba(34,197,94,0.08)",
  };
  const borderMap: Record<string, string> = {
    deposit: "rgba(220,38,38,0.25)",
    bet_won: "rgba(234,179,8,0.25)",
    refund: "rgba(59,130,246,0.25)",
    reward: "rgba(34,197,94,0.25)",
  };
  const amountColorMap: Record<string, string> = {
    deposit: "#f87171",
    bet_won: "#fde047",
    refund: "#93c5fd",
    reward: "#86efac",
  };
  const bg = colorMap[params.type] ?? colorMap.deposit;
  const border = borderMap[params.type] ?? borderMap.deposit;
  const amountColor = amountColorMap[params.type] ?? amountColorMap.deposit;

  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">${label} 💰</h2>
    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.6;">
      Hola <strong style="color:#fff;">${params.userName}</strong>, tu saldo ha sido actualizado.
    </p>
    <div style="background:${bg};border:1px solid ${border};border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">RLC recibidos</p>
      <p style="margin:0 0 12px;color:${amountColor};font-size:28px;font-weight:900;letter-spacing:2px;">+${params.amount.toLocaleString()} RLC</p>
      ${params.description ? `<p style="margin:0 0 12px;color:#a1a1aa;font-size:13px;">${params.description}</p>` : ""}
      <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Saldo actual</p>
      <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">${params.newBalance.toLocaleString()} RLC</p>
    </div>
    <a href="https://redlevelcircle.gg/dashboard"
       style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:1px;">
      VER MI WALLET →
    </a>
  `);
}

export function buildMatchScheduledEmail(params: {
  userName: string;
  tournamentName: string;
  matchLabel: string;
  scheduledAt: Date;
  tournamentId: number;
}): string {
  const dateStr = params.scheduledAt.toLocaleString("es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota",
  });
  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">Partido programado 🗓️</h2>
    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.6;">
      Hola <strong style="color:#fff;">${params.userName}</strong>, tu próximo partido ha sido programado.
    </p>
    <div style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.25);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Torneo</p>
      <p style="margin:0 0 12px;color:#fff;font-size:16px;font-weight:700;">${params.tournamentName}</p>
      <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Partido</p>
      <p style="margin:0 0 12px;color:#fff;font-size:16px;font-weight:700;">${params.matchLabel}</p>
      <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Fecha y hora</p>
      <p style="margin:0;color:#fde047;font-size:16px;font-weight:700;">${dateStr}</p>
    </div>
    <a href="https://redlevelcircle.gg/tournament/${params.tournamentId}"
       style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:1px;">
      VER TORNEO →
    </a>
  `);
}
