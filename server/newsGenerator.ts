/**
 * Automatic News Generator for Red Level Circle
 *
 * Uses GPT (via invokeLLM) to generate news articles automatically
 * based on platform events. Images are taken from existing entity assets.
 *
 * Triggered by:
 *  - tournament.status_changed  → "en_curso" or "finalizado"
 *  - tournament.match_finished  → match result (sampled)
 *  - ally approved              → called directly from allies router
 */

import { invokeLLM } from "./_core/llm";
import { createNews, getTournamentById, getTeamById } from "./db";
import { eventBus } from "./eventBus";
import { getDb } from "./db";
import { allies, news } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── System author ID (1 = first admin / system user) ────────────────────────
const SYSTEM_AUTHOR_ID = 1;

// ─── Slug generator ───────────────────────────────────────────────────────────
function toSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) +
    "-" +
    Date.now()
  );
}

// ─── Duplicate guard ──────────────────────────────────────────────────────────
async function newsAlreadyExists(referenceKey: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: news.id })
    .from(news)
    .where(eq(news.referenceUrl, referenceKey))
    .limit(1);
  return rows.length > 0;
}

// ─── Core GPT call ────────────────────────────────────────────────────────────
async function generateNewsContent(prompt: string): Promise<{
  title: string;
  excerpt: string;
  content: string;
} | null> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Eres el redactor oficial de Red Level Circle (RLC), una plataforma competitiva de esports en Latinoamérica.
Escribe noticias breves, emocionantes y en español. Usa un tono profesional pero apasionado, propio del mundo competitivo.
Responde ÚNICAMENTE con un JSON válido con las claves: title (máx 80 chars), excerpt (máx 160 chars), content (HTML simple con <p> y <strong>, máx 300 palabras).
No incluyas markdown, bloques de código ni texto fuera del JSON.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      outputSchema: {
        name: "news_article",
        schema: {
          type: "object" as const,
          properties: {
            title: { type: "string" as const },
            excerpt: { type: "string" as const },
            content: { type: "string" as const },
          },
          required: ["title", "excerpt", "content"],
          additionalProperties: false,
        },
        strict: true,
      },
    });

    const raw = result.choices?.[0]?.message?.content ?? "";
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed as { title: string; excerpt: string; content: string };
  } catch (err) {
    console.error("[NewsGenerator] GPT call failed:", err);
    return null;
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleTournamentStatusChanged(payload: {
  tournamentId: number;
  newStatus: string;
  tournamentName: string;
}) {
  const { tournamentId, newStatus, tournamentName } = payload;

  if (newStatus !== "en_curso" && newStatus !== "finalizado") return;

  const refKey = `tournament:${tournamentId}:${newStatus}`;
  if (await newsAlreadyExists(refKey)) return;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) return;

  const isStart = newStatus === "en_curso";
  const prompt = isStart
    ? `El torneo "${tournamentName}" de ${tournament.game ?? "esports"} en Red Level Circle acaba de comenzar. 
       Tiene ${tournament.maxTeams ?? "varios"} equipos participantes. 
       Fecha de inicio: ${tournament.startDate ? new Date(tournament.startDate).toLocaleDateString("es-ES") : "hoy"}.
       Genera una noticia de apertura emocionante para la comunidad RLC.`
    : `El torneo "${tournamentName}" de ${tournament.game ?? "esports"} en Red Level Circle ha finalizado.
       Genera una noticia de cierre que celebre la competencia y motive a los equipos a seguir participando en RLC.`;

  const generated = await generateNewsContent(prompt);
  if (!generated) return;

  const coverImage = tournament.banner ?? null;

  await createNews({
    title: generated.title,
    slug: toSlug(generated.title),
    excerpt: generated.excerpt,
    content: generated.content,
    coverImage: coverImage ?? undefined,
    category: "torneos",
    authorId: SYSTEM_AUTHOR_ID,
    isPublished: true,
    isFeatured: false,
    referenceUrl: refKey,
    publishedAt: new Date(),
  });

  console.log(`[NewsGenerator] Created news for tournament ${tournamentId} (${newStatus})`);
}

async function handleMatchFinished(payload: {
  matchId: number;
  tournamentId: number;
  winnerId: number;
  loserId: number;
}) {
  const { matchId, tournamentId, winnerId, loserId } = payload;

  // Sample: only generate for 1 in every 4 matches to avoid flooding
  if (matchId % 4 !== 0) return;

  const refKey = `match:${matchId}:finished`;
  if (await newsAlreadyExists(refKey)) return;

  const [tournament, winner, loser] = await Promise.all([
    getTournamentById(tournamentId),
    getTeamById(winnerId),
    getTeamById(loserId),
  ]);

  if (!tournament || !winner || !loser) return;

  const prompt = `En el torneo "${tournament.name}" de Red Level Circle, el equipo "${winner.name}" venció a "${loser.name}".
  Juego: ${tournament.game ?? "esports"}.
  Genera una noticia breve sobre este resultado competitivo.`;

  const generated = await generateNewsContent(prompt);
  if (!generated) return;

  const coverImage = winner.banner ?? winner.logo ?? tournament.banner ?? null;

  await createNews({
    title: generated.title,
    slug: toSlug(generated.title),
    excerpt: generated.excerpt,
    content: generated.content,
    coverImage: coverImage ?? undefined,
    category: "torneos",
    authorId: SYSTEM_AUTHOR_ID,
    isPublished: true,
    isFeatured: false,
    referenceUrl: refKey,
    publishedAt: new Date(),
  });

  console.log(`[NewsGenerator] Created news for match ${matchId}`);
}

// ─── Exported helper for ally approval ───────────────────────────────────────
export async function handleAllyApproved(allyId: number): Promise<void> {
  const refKey = `ally:${allyId}:approved`;
  if (await newsAlreadyExists(refKey)) return;

  const db = await getDb();
  if (!db) return;

  const [ally] = await db.select().from(allies).where(eq(allies.id, allyId)).limit(1);
  if (!ally) return;

  const location = [ally.city, ally.country].filter(Boolean).join(", ");
  const prompt = `La marca/empresa "${ally.name}"${location ? ` de ${location}` : ""} acaba de unirse como aliado oficial de Red Level Circle.
  ${ally.description ? `Descripción: ${ally.description}` : ""}
  Genera una noticia de bienvenida para la comunidad RLC.`;

  const generated = await generateNewsContent(prompt);
  if (!generated) return;

  const coverImage = ally.coverImage ?? ally.logo ?? null;

  await createNews({
    title: generated.title,
    slug: toSlug(generated.title),
    excerpt: generated.excerpt,
    content: generated.content,
    coverImage: coverImage ?? undefined,
    category: "plataforma",
    authorId: SYSTEM_AUTHOR_ID,
    isPublished: true,
    isFeatured: true,
    referenceUrl: refKey,
    publishedAt: new Date(),
  });

  console.log(`[NewsGenerator] Created news for ally ${allyId}`);
}

// ─── Register all event listeners ────────────────────────────────────────────
export function registerNewsGeneratorListeners(): void {
  eventBus.on("tournament.status_changed", handleTournamentStatusChanged);
  eventBus.on("tournament.match_finished", handleMatchFinished);
  console.log("[NewsGenerator] Auto-news listeners registered.");
}
