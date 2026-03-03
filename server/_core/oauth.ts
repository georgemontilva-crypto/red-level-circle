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
    const { email, password, name } = req.body ?? {};
    const result = await registerWithEmail(email, password, name);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    const token = await signSessionToken(result.openId, name);
    setSessionCookie(req, res, token);
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
