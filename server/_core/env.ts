/**
 * env.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX BAJO #13: Validación de variables de entorno críticas al arranque.
 *
 * Antes: ENV usaba ?? "" para todas las variables, lo que permitía que el
 * servidor arrancara con valores vacíos y fallara silenciosamente en runtime
 * (ej. JWT firmado con string vacío, DB no conectada, OAuth roto).
 *
 * Ahora: Las variables críticas se validan al importar este módulo. Si falta
 * alguna en producción, el proceso termina con un mensaje claro en lugar de
 * fallar de forma impredecible más tarde.
 */

/** Variables de entorno requeridas en producción */
const REQUIRED_IN_PRODUCTION: (keyof typeof rawEnv)[] = [
  "JWT_SECRET",
  "DATABASE_URL",
  "OAUTH_SERVER_URL",
];

const rawEnv = {
  VITE_APP_ID: process.env.VITE_APP_ID ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  OAUTH_SERVER_URL: process.env.OAUTH_SERVER_URL ?? "",
  OWNER_OPEN_ID: process.env.OWNER_OPEN_ID ?? "",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  BUILT_IN_FORGE_API_URL: process.env.BUILT_IN_FORGE_API_URL ?? "",
  BUILT_IN_FORGE_API_KEY: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

if (rawEnv.NODE_ENV === "production") {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !rawEnv[key]);
  if (missing.length > 0) {
    console.error(
      `[ENV] FATAL: Las siguientes variables de entorno son requeridas en producción pero no están configuradas:\n` +
      missing.map((k) => `  - ${k}`).join("\n") +
      `\n\nConfigúralas en Railway → Variables antes de desplegar.`
    );
    process.exit(1);
  }
}

// Advertencia en desarrollo si falta JWT_SECRET
if (rawEnv.NODE_ENV !== "production" && !rawEnv.JWT_SECRET) {
  console.warn(
    "[ENV] ADVERTENCIA: JWT_SECRET no configurado. " +
    "El servidor usará un secret vacío en desarrollo. " +
    "Configura JWT_SECRET en tu .env local para evitar problemas."
  );
}

export const ENV = {
  appId: rawEnv.VITE_APP_ID,
  cookieSecret: rawEnv.JWT_SECRET,
  databaseUrl: rawEnv.DATABASE_URL,
  oAuthServerUrl: rawEnv.OAUTH_SERVER_URL,
  ownerOpenId: rawEnv.OWNER_OPEN_ID,
  isProduction: rawEnv.NODE_ENV === "production",
  forgeApiUrl: rawEnv.BUILT_IN_FORGE_API_URL,
  forgeApiKey: rawEnv.BUILT_IN_FORGE_API_KEY,
};
