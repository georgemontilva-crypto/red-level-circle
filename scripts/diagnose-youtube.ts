/**
 * diagnose-youtube.ts
 * Ejecutar con: npx tsx scripts/diagnose-youtube.ts
 *
 * Diagnostica por qué YouTube no detecta transmisiones en vivo.
 * Verifica: API key, campo youtube del creador, resolución de channelId, búsqueda live.
 */
import { and, eq, isNotNull } from "drizzle-orm";
import { contentCreators, users } from "../drizzle/schema";
import { getDb } from "../server/db";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? "";
const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

async function main() {
  console.log("\n=== DIAGNÓSTICO YOUTUBE SYNC ===\n");

  // 1. Verificar API key
  if (!YOUTUBE_API_KEY) {
    console.error("❌ YOUTUBE_API_KEY no está configurada en las variables de entorno.");
    console.error("   → Ve a Railway → Variables → Agrega YOUTUBE_API_KEY=<tu_clave>");
    process.exit(1);
  }
  console.log("✅ YOUTUBE_API_KEY está configurada");

  // 2. Verificar conexión a DB
  const db = await getDb();
  if (!db) {
    console.error("❌ No se pudo conectar a la base de datos.");
    process.exit(1);
  }
  console.log("✅ Conexión a DB exitosa");

  // 3. Obtener creadores aprobados con YouTube
  const creators = await db
    .select({
      userId: contentCreators.userId,
      youtube: contentCreators.youtube,
      status: contentCreators.status,
      userName: users.name,
      nickname: users.nickname,
    })
    .from(contentCreators)
    .innerJoin(users, eq(contentCreators.userId, users.id))
    .where(and(eq(contentCreators.status, "approved"), isNotNull(contentCreators.youtube)));

  console.log(`\n📋 Creadores aprobados con campo youtube: ${creators.length}`);

  if (creators.length === 0) {
    console.error("❌ No hay creadores aprobados con campo youtube configurado.");
    console.error("   → Verifica en el panel de admin que el creador esté aprobado");
    console.error("   → y que tenga su URL de YouTube guardada en el perfil.");

    // Mostrar todos los creadores aprobados aunque no tengan youtube
    const allApproved = await db
      .select({
        userId: contentCreators.userId,
        youtube: contentCreators.youtube,
        twitch: contentCreators.twitch,
        status: contentCreators.status,
        userName: users.name,
      })
      .from(contentCreators)
      .innerJoin(users, eq(contentCreators.userId, users.id))
      .where(eq(contentCreators.status, "approved"));

    console.log(`\n   Creadores aprobados en total: ${allApproved.length}`);
    for (const c of allApproved) {
      console.log(`   - userId=${c.userId} name="${c.userName}" youtube="${c.youtube ?? "(vacío)"}" twitch="${c.twitch ?? "(vacío)"}"`);
    }
    process.exit(1);
  }

  for (const creator of creators) {
    const name = creator.nickname ?? creator.userName ?? `userId=${creator.userId}`;
    console.log(`\n--- Creador: ${name} ---`);
    console.log(`   Campo youtube en DB: "${creator.youtube}"`);

    // 4. Extraer handle
    let handle: string | null = null;
    if (creator.youtube!.includes("youtube.com")) {
      try {
        const parsed = new URL(creator.youtube!);
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (parts[0]?.startsWith("@")) handle = parts[0].slice(1).toLowerCase();
        else if (["channel", "c", "user"].includes(parts[0])) handle = parts[1]?.toLowerCase() ?? null;
      } catch { handle = null; }
    } else {
      handle = creator.youtube!.toLowerCase().replace("@", "");
    }

    if (!handle) {
      console.error(`   ❌ No se pudo extraer el handle de: "${creator.youtube}"`);
      console.error(`   → Formatos válidos: https://youtube.com/@handle, @handle, handle`);
      continue;
    }
    console.log(`   ✅ Handle extraído: "${handle}"`);

    // 5. Resolver channelId
    let channelId: string | null = null;
    if (/^UC[\w-]{22}$/.test(handle)) {
      channelId = handle;
      console.log(`   ✅ Es un channelId directo: ${channelId}`);
    } else {
      const params = new URLSearchParams({
        part: "id",
        forHandle: handle.startsWith("@") ? handle : `@${handle}`,
        key: YOUTUBE_API_KEY,
      });
      const res = await fetch(`${YOUTUBE_CHANNELS_URL}?${params}`);
      const data = (await res.json()) as any;
      if (!res.ok) {
        console.error(`   ❌ Error en YouTube Channels API: ${res.status}`);
        console.error(`   Respuesta: ${JSON.stringify(data)}`);
        continue;
      }
      channelId = data.items?.[0]?.id ?? null;
      if (!channelId) {
        console.error(`   ❌ No se encontró channelId para "@${handle}"`);
        console.error(`   Respuesta de la API: ${JSON.stringify(data)}`);
        console.error(`   → Verifica que el handle sea correcto en YouTube`);
        continue;
      }
      console.log(`   ✅ ChannelId resuelto: ${channelId}`);
    }

    // 6. Buscar stream en vivo
    const searchParams = new URLSearchParams({
      part: "snippet",
      channelId,
      eventType: "live",
      type: "video",
      key: YOUTUBE_API_KEY,
    });
    const searchRes = await fetch(`${YOUTUBE_SEARCH_URL}?${searchParams}`);
    const searchData = (await searchRes.json()) as any;

    if (!searchRes.ok) {
      console.error(`   ❌ Error en YouTube Search API: ${searchRes.status}`);
      console.error(`   Respuesta: ${JSON.stringify(searchData)}`);
      continue;
    }

    if (!searchData.items || searchData.items.length === 0) {
      console.log(`   ℹ️  No hay transmisión en vivo actualmente para este canal.`);
      console.log(`   → Si estás en vivo ahora mismo, puede haber un retraso de hasta 30s`);
      console.log(`   → o el canal puede estar usando una cuenta diferente.`);
    } else {
      const item = searchData.items[0];
      console.log(`   🔴 TRANSMISIÓN EN VIVO DETECTADA:`);
      console.log(`      videoId: ${item.id.videoId}`);
      console.log(`      título: ${item.snippet.title}`);
      console.log(`      embedUrl: https://www.youtube-nocookie.com/embed/${item.id.videoId}?autoplay=1&mute=1`);
    }
  }

  console.log("\n=== FIN DEL DIAGNÓSTICO ===\n");
  process.exit(0);
}

main().catch((e) => {
  console.error("Error fatal:", e);
  process.exit(1);
});
