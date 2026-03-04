import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isLocalRequest(req: Request): boolean {
  const hostname = req.hostname ?? "";
  return LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);
}

function isSecureRequest(req: Request) {
  // Con `app.set("trust proxy", 1)` en Express, req.protocol ya refleja
  // el valor del header X-Forwarded-Proto enviado por Railway.
  // Esta comprobación cubre todos los entornos: local (http) y producción (https).
  if (req.protocol === "https") return true;

  // Fallback manual por si trust proxy no está activo en algún entorno
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);

  return {
    httpOnly: true,
    path: "/",
    // sameSite: "none" requiere secure: true (obligatorio para cookies cross-site).
    // En local (http) usamos "lax" para evitar el error de Chrome con sameSite=none sin secure.
    sameSite: secure ? "none" : "lax",
    secure,
  };
}
