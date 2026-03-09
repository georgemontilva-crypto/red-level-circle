import type { Express, Request, Response } from "express";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  signSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from "./authService";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {

  // ─── Email / Password: Register ─────────────────────────────────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, nickname, country } = req.body ?? {};
    const name = [firstName, lastName].filter(Boolean).join(" ") || nickname || "Usuario";
    const result = await registerWithEmail(email, password, name, { nickname, country });
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    const token = await signSessionToken(result.openId, name);
    setSessionCookie(req, res, token);
    // Send welcome email (non-blocking)
    if (email) {
      setImmediate(async () => {
        try {
          const { sendEmail } = await import("../pushService");
          const displayName = [firstName, lastName].filter(Boolean).join(" ") || nickname || "Jugador";
          await sendEmail({
            to: email.toLowerCase(),
            subject: "¡Bienvenido a Red Level Circle! 🎮",
            html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#0d0d0d;color:#fff;font-family:Arial,sans-serif;margin:0;padding:0"><div style="max-width:600px;margin:0 auto;padding:40px 20px"><div style="text-align:center;margin-bottom:32px"><img src="https://redlevelcircle.gg/logo.png" alt="RLC" style="height:60px" onerror="this.style.display='none'"><h1 style="color:#e53e3e;font-size:28px;margin:16px 0">Red Level Circle</h1></div><div style="background:#1a1a2e;border-radius:12px;padding:32px;border:1px solid #e53e3e33"><h2 style="color:#fff;margin-top:0">¡Bienvenido, ${displayName}! 🎮</h2><p style="color:#ccc;line-height:1.6">Tu cuenta ha sido creada exitosamente. Ya eres parte de la comunidad competitiva de Red Level Circle.</p><p style="color:#ccc;line-height:1.6">Desde tu cuenta puedes:</p><ul style="color:#ccc;line-height:2"><li>Participar en torneos competitivos</li><li>Crear y gestionar tu equipo</li><li>Ganar RLC Coins completando misiones</li><li>Conectar con otros jugadores</li></ul><div style="text-align:center;margin-top:32px"><a href="https://redlevelcircle.gg/dashboard" style="background:#e53e3e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">IR AL DASHBOARD</a></div></div><p style="color:#666;text-align:center;font-size:12px;margin-top:24px">Red Level Circle · redlevelcircle.gg</p></div></body></html>`,
          });
        } catch (_) { /* non-critical */ }
      });
    }
    res.json({ success: true });
  });

  // ─── Email / Password: Login ─────────────────────────────────────────────────
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    const result = await loginWithEmail(email, password);
    if (!result.success) {
      res.status(401).json({ error: result.error });
      return;
    }
    const token = await signSessionToken(result.openId, result.name);
    setSessionCookie(req, res, token);
    res.json({ success: true });
  });

  // ─── Google OAuth: Verify ID Token ──────────────────────────────────────────
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    const { idToken } = req.body ?? {};
    if (!idToken) {
      res.status(400).json({ error: "idToken es requerido" });
      return;
    }
    const result = await loginWithGoogle(idToken);
    if (!result.success) {
      res.status(401).json({ error: result.error });
      return;
    }
    const token = await signSessionToken(result.openId, result.name);
    setSessionCookie(req, res, token);
    res.json({ success: true });
  });

  // ─── Logout ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    clearSessionCookie(req, res);
    res.json({ success: true });
  });

  // ─── Legacy Manus OAuth callback (kept for backward compatibility) ───────────
  app.get("/api/oauth/callback", (req: Request, res: Response) => {
    res.redirect("/login?error=manus_oauth_disabled");
  });
}
