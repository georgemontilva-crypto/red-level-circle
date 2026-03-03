/**
 * authService.ts
 * Sistema de autenticación propio: correo/contraseña + Google OAuth
 * Reemplaza el sistema de Manus OAuth
 */

import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { randomUUID } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import * as db from "../db";
import { ENV } from "./env";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

const BCRYPT_ROUNDS = 12;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── JWT helpers ─────────────────────────────────────────────────────────────

function getSecretKey(): Uint8Array {
  const secret = ENV.cookieSecret || "fallback-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(openId: string, name: string): Promise<string> {
  const secretKey = getSecretKey();
  const expiresAt = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);
  return new SignJWT({ openId, appId: ENV.appId || "rlc", name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiresAt)
    .sign(secretKey);
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ openId: string; appId: string; name: string } | null> {
  if (!token) return null;
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    const { openId, appId, name } = payload as Record<string, unknown>;
    if (typeof openId !== "string" || typeof appId !== "string" || typeof name !== "string") return null;
    return { openId, appId, name };
  } catch {
    return null;
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export function setSessionCookie(req: Request, res: Response, token: string) {
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export function clearSessionCookie(req: Request, res: Response) {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
}

// ─── Email / Password Auth ────────────────────────────────────────────────────

export async function registerWithEmail(
  email: string,
  password: string,
  name: string
): Promise<{ success: true; openId: string } | { success: false; error: string }> {
  // Validate inputs
  if (!email || !password || !name) {
    return { success: false, error: "Todos los campos son requeridos" };
  }
  if (password.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "El correo electrónico no es válido" };
  }

  // Check if email already exists
  const existing = await db.getUserByEmail(email.toLowerCase());
  if (existing) {
    return { success: false, error: "Este correo ya está registrado" };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const openId = `email_${randomUUID()}`;

  await db.upsertUser({
    openId,
    name,
    email: email.toLowerCase(),
    loginMethod: "email",
    passwordHash,
    emailVerified: false,
    lastSignedIn: new Date(),
  });

  return { success: true, openId };
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ success: true; openId: string; name: string } | { success: false; error: string }> {
  if (!email || !password) {
    return { success: false, error: "Correo y contraseña son requeridos" };
  }

  const user = await db.getUserByEmail(email.toLowerCase());
  if (!user || !user.passwordHash) {
    // Use same error to prevent email enumeration
    return { success: false, error: "Correo o contraseña incorrectos" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Correo o contraseña incorrectos" };
  }

  await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

  return { success: true, openId: user.openId, name: user.name || "" };
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export async function loginWithGoogle(
  idToken: string
): Promise<{ success: true; openId: string; name: string } | { success: false; error: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return { success: false, error: "Google OAuth no está configurado en el servidor" };
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      return { success: false, error: "Token de Google inválido" };
    }

    const googleId = payload.sub;
    const email = payload.email ?? null;
    const name = payload.name || email || "Usuario";
    const avatar = payload.picture ?? null;
    const openId = `google_${googleId}`;

    // Upsert user — create if new, update lastSignedIn if existing
    await db.upsertUser({
      openId,
      name,
      email: email?.toLowerCase() ?? null,
      loginMethod: "google",
      emailVerified: payload.email_verified ?? false,
      avatar,
      lastSignedIn: new Date(),
    });

    return { success: true, openId, name };
  } catch (err) {
    console.error("[Auth] Google token verification failed:", err);
    return { success: false, error: "No se pudo verificar el token de Google" };
  }
}

// ─── Session Authentication ───────────────────────────────────────────────────

export async function authenticateRequest(req: Request) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  const session = await verifySessionToken(sessionCookie);
  if (!session) return null;

  const user = await db.getUserByOpenId(session.openId);
  if (!user) return null;

  return user;
}

function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key) map.set(key.trim(), rest.join("=").trim());
  }
  return map;
}
