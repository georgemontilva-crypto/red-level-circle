/**
 * Commerce Core Router
 *
 * Capa superior de comercio que unifica el catálogo de productos físicos y
 * cosméticos sin modificar shop.* ni cosmetics.*
 *
 * Endpoints:
 *   commerce.catalog              — Catálogo unificado (físicos + cosméticos visibles)
 *   commerce.featured             — Ítems destacados del catálogo
 *   commerce.weeklyFeatured       — Ítems destacados de la semana
 *   commerce.collections          — Lista de colecciones activas
 *   commerce.collection           — Detalle de una colección con sus ítems
 *   commerce.drops                — Lista de drops activos
 *   commerce.drop                 — Detalle de un drop por slug
 *   commerce.transactions         — Historial de transacciones del usuario
 *   commerce.wallet               — Balance RLC del usuario autenticado
 *   commerce.recordTransaction    — Registrar una transacción (uso interno)
 *   commerce.adminCreateCollection    — Admin: crear colección
 *   commerce.adminUpdateCollection    — Admin: actualizar colección
 *   commerce.adminSyncCatalog         — Admin: sincronizar catálogo desde shopItems y cosmetics
 *   commerce.adminUpdateCatalogItem   — Admin: actualizar item del catálogo
 *   commerce.adminCreateDrop          — Admin: crear drop
 *   commerce.adminUpdateDrop          — Admin: actualizar drop
 *   commerce.adminDeleteDrop          — Admin: eliminar drop
 */

import { z } from "zod";
import { eq, and, desc, lte, gte, or, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  transactions,
  wallets,
  collections,
  catalogItems,
  shopItems,
  cosmetics,
  users,
  drops,
} from "../drizzle/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAdmin(role: string) {
  return role === "admin" || role === "super_admin";
}

/**
 * Obtiene o crea el wallet del usuario.
 * Sincroniza el balance con users.rlcBalance para mantener consistencia.
 */
async function getOrCreateWallet(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const [existing] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [user] = await db
    .select({ rlcBalance: users.rlcBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await db.insert(wallets).values({
    userId,
    balanceRlc: user?.rlcBalance ?? 0,
  });

  const [created] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);

  return created;
}

/**
 * Registra una transacción en la tabla global transactions.
 * No modifica balances — eso lo hacen shop.* y cosmetics.*
 */
async function recordTx(data: {
  userId: number;
  type: "physical_purchase" | "cosmetic_purchase" | "reward" | "gift" | "refund" | "deposit";
  amount: number;
  currency: "RLC" | "USD";
  referenceId?: number;
  referenceType?: "shop_item" | "cosmetic" | "order" | "bet" | "reward";
  description?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(transactions).values(data);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const commerceRouter = router({
  /**
   * catalog — Catálogo unificado de productos visibles.
   *
   * Respeta visibleFrom/visibleUntil y publishDate para mostrar solo
   * ítems que deben estar visibles en este momento.
   */
  catalog: publicProcedure
    .input(z.object({
      type: z.enum(["all", "physical", "cosmetic"]).default("all"),
      collectionId: z.number().optional(),
      featured: z.boolean().optional(),
      weeklyFeatured: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const now = new Date();

      const filters: Parameters<typeof and> = [
        eq(catalogItems.isVisible, true),
        // publishDate: null o ya pasó
        or(isNull(catalogItems.publishDate), lte(catalogItems.publishDate, now)),
        // visibleFrom: null o ya pasó
        or(isNull(catalogItems.visibleFrom), lte(catalogItems.visibleFrom, now)),
        // visibleUntil: null o aún no llegó
        or(isNull(catalogItems.visibleUntil), gte(catalogItems.visibleUntil, now)),
      ];

      if (input.type !== "all") {
        filters.push(eq(catalogItems.type, input.type));
      }
      if (input.collectionId) {
        filters.push(eq(catalogItems.collectionId, input.collectionId));
      }
      if (input.featured) {
        filters.push(eq(catalogItems.isFeatured, true));
      }
      if (input.weeklyFeatured) {
        filters.push(eq(catalogItems.weeklyFeatured, true));
      }

      const catalog = await db
        .select()
        .from(catalogItems)
        .where(and(...filters))
        .orderBy(desc(catalogItems.isFeatured), desc(catalogItems.weeklyFeatured), catalogItems.featuredPriority, catalogItems.sortOrder)
        .limit(input.limit);

      if (catalog.length === 0) return [];

      const physicalIds = catalog.filter(c => c.type === "physical").map(c => c.referenceId);
      const cosmeticIds = catalog.filter(c => c.type === "cosmetic").map(c => c.referenceId);

      const [physicalItems, cosmeticItems] = await Promise.all([
        physicalIds.length > 0
          ? db.select().from(shopItems).where(eq(shopItems.isActive, true))
          : Promise.resolve([]),
        cosmeticIds.length > 0
          ? db.select().from(cosmetics).where(eq(cosmetics.isActive, true))
          : Promise.resolve([]),
      ]);

      const physicalMap = new Map(physicalItems.map(i => [i.id, i]));
      const cosmeticMap = new Map(cosmeticItems.map(i => [i.id, i]));

      return catalog
        .map(entry => {
          if (entry.type === "physical") {
            const item = physicalMap.get(entry.referenceId);
            if (!item) return null;
            return {
              type: "physical" as const,
              catalogId: entry.id,
              isFeatured: entry.isFeatured,
              weeklyFeatured: entry.weeklyFeatured,
              featuredPriority: entry.featuredPriority,
              collectionId: entry.collectionId,
              item,
            };
          } else {
            const item = cosmeticMap.get(entry.referenceId);
            if (!item) return null;
            return {
              type: "cosmetic" as const,
              catalogId: entry.id,
              isFeatured: entry.isFeatured,
              weeklyFeatured: entry.weeklyFeatured,
              featuredPriority: entry.featuredPriority,
              collectionId: entry.collectionId,
              item,
            };
          }
        })
        .filter(Boolean);
    }),

  /**
   * featured — Ítems destacados del catálogo (máx 8).
   */
  featured: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const now = new Date();

    const featured = await db
      .select()
      .from(catalogItems)
      .where(and(
        eq(catalogItems.isFeatured, true),
        eq(catalogItems.isVisible, true),
        or(isNull(catalogItems.publishDate), lte(catalogItems.publishDate, now)),
        or(isNull(catalogItems.visibleFrom), lte(catalogItems.visibleFrom, now)),
        or(isNull(catalogItems.visibleUntil), gte(catalogItems.visibleUntil, now)),
      ))
      .orderBy(catalogItems.featuredPriority, catalogItems.sortOrder)
      .limit(8);

    if (featured.length === 0) return [];

    const physicalIds = featured.filter(f => f.type === "physical").map(f => f.referenceId);
    const cosmeticIds = featured.filter(f => f.type === "cosmetic").map(f => f.referenceId);

    const [physicalItems, cosmeticItems] = await Promise.all([
      physicalIds.length > 0 ? db.select().from(shopItems) : Promise.resolve([]),
      cosmeticIds.length > 0 ? db.select().from(cosmetics) : Promise.resolve([]),
    ]);

    const physicalMap = new Map(physicalItems.map(i => [i.id, i]));
    const cosmeticMap = new Map(cosmeticItems.map(i => [i.id, i]));

    return featured
      .map(entry => {
        if (entry.type === "physical") {
          const item = physicalMap.get(entry.referenceId);
          return item ? { type: "physical" as const, item, catalogId: entry.id, featuredPriority: entry.featuredPriority } : null;
        } else {
          const item = cosmeticMap.get(entry.referenceId);
          return item ? { type: "cosmetic" as const, item, catalogId: entry.id, featuredPriority: entry.featuredPriority } : null;
        }
      })
      .filter(Boolean);
  }),

  /**
   * weeklyFeatured — Ítems destacados de la semana (máx 12).
   */
  weeklyFeatured: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const now = new Date();

    const weekly = await db
      .select()
      .from(catalogItems)
      .where(and(
        eq(catalogItems.weeklyFeatured, true),
        eq(catalogItems.isVisible, true),
        or(isNull(catalogItems.publishDate), lte(catalogItems.publishDate, now)),
        or(isNull(catalogItems.visibleFrom), lte(catalogItems.visibleFrom, now)),
        or(isNull(catalogItems.visibleUntil), gte(catalogItems.visibleUntil, now)),
      ))
      .orderBy(catalogItems.featuredPriority, catalogItems.sortOrder)
      .limit(12);

    if (weekly.length === 0) return [];

    const physicalIds = weekly.filter(f => f.type === "physical").map(f => f.referenceId);
    const cosmeticIds = weekly.filter(f => f.type === "cosmetic").map(f => f.referenceId);

    const [physicalItems, cosmeticItems] = await Promise.all([
      physicalIds.length > 0 ? db.select().from(shopItems) : Promise.resolve([]),
      cosmeticIds.length > 0 ? db.select().from(cosmetics) : Promise.resolve([]),
    ]);

    const physicalMap = new Map(physicalItems.map(i => [i.id, i]));
    const cosmeticMap = new Map(cosmeticItems.map(i => [i.id, i]));

    return weekly
      .map(entry => {
        if (entry.type === "physical") {
          const item = physicalMap.get(entry.referenceId);
          return item ? { type: "physical" as const, item, catalogId: entry.id } : null;
        } else {
          const item = cosmeticMap.get(entry.referenceId);
          return item ? { type: "cosmetic" as const, item, catalogId: entry.id } : null;
        }
      })
      .filter(Boolean);
  }),

  /**
   * collections — Lista de colecciones activas.
   */
  collections: publicProcedure
    .input(z.object({
      featuredOnly: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const filters: Parameters<typeof and> = [eq(collections.isActive, true)];
      if (input?.featuredOnly) {
        filters.push(eq(collections.isFeatured, true));
      }

      return db
        .select()
        .from(collections)
        .where(and(...filters))
        .orderBy(desc(collections.isFeatured), desc(collections.createdAt));
    }),

  /**
   * collection — Detalle de una colección con sus ítems del catálogo.
   */
  collection: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "NOT_FOUND" });

      const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.slug, input.slug))
        .limit(1);

      if (!collection) throw new TRPCError({ code: "NOT_FOUND" });

      const now = new Date();
      const items = await db
        .select()
        .from(catalogItems)
        .where(and(
          eq(catalogItems.collectionId, collection.id),
          eq(catalogItems.isVisible, true),
          or(isNull(catalogItems.publishDate), lte(catalogItems.publishDate, now)),
          or(isNull(catalogItems.visibleFrom), lte(catalogItems.visibleFrom, now)),
          or(isNull(catalogItems.visibleUntil), gte(catalogItems.visibleUntil, now)),
        ))
        .orderBy(catalogItems.sortOrder);

      return { collection, items };
    }),

  // ─── Drops ─────────────────────────────────────────────────────────────────

  /**
   * drops — Lista de drops activos en este momento.
   */
  drops: publicProcedure
    .input(z.object({
      activeOnly: z.boolean().default(true),
      limit: z.number().min(1).max(50).default(10),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const now = new Date();
      const activeOnly = input?.activeOnly ?? true;

      const filters: Parameters<typeof and> = [];
      if (activeOnly) {
        filters.push(
          lte(drops.startDate, now),
          gte(drops.endDate, now),
        );
      }

      return db
        .select()
        .from(drops)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(desc(drops.startDate))
        .limit(input?.limit ?? 10);
    }),

  /**
   * drop — Detalle de un drop por slug, incluyendo los ítems del catálogo asociados.
   */
  drop: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "NOT_FOUND" });

      const [drop] = await db
        .select()
        .from(drops)
        .where(eq(drops.slug, input.slug))
        .limit(1);

      if (!drop) throw new TRPCError({ code: "NOT_FOUND" });

      // Si el drop tiene collectionId, traer los ítems de esa colección
      let items: (typeof catalogItems.$inferSelect)[] = [];
      if (drop.collectionId) {
        const now = new Date();
        items = await db
          .select()
          .from(catalogItems)
          .where(and(
            eq(catalogItems.collectionId, drop.collectionId),
            eq(catalogItems.isVisible, true),
            or(isNull(catalogItems.publishDate), lte(catalogItems.publishDate, now)),
          ))
          .orderBy(catalogItems.sortOrder);
      }

      return { drop, items };
    }),

  /**
   * activeDrops — Ítems del catálogo con drop window activo en este momento.
   * Busca cosméticos cuyo dropStart <= now <= dropEnd.
   */
  activeDrops: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const now = new Date();

    // Buscar cosméticos con drop activo
    const activeCosmeticDrops = await db
      .select()
      .from(cosmetics)
      .where(and(
        eq(cosmetics.isActive, true),
        lte(cosmetics.dropStart, now),
        gte(cosmetics.dropEnd, now),
      ))
      .limit(20);

    if (activeCosmeticDrops.length === 0) return [];

    // Buscar sus entradas en el catálogo
    const cosmeticIds = activeCosmeticDrops.map(c => c.id);
    const catalogEntries = await db
      .select()
      .from(catalogItems)
      .where(and(
        eq(catalogItems.type, "cosmetic"),
        eq(catalogItems.isVisible, true),
      ))
      .limit(100);

    const catalogMap = new Map(catalogEntries.map(e => [e.referenceId, e]));
    const cosmeticMap = new Map(activeCosmeticDrops.map(c => [c.id, c]));

    return cosmeticIds
      .map(id => {
        const catalogEntry = catalogMap.get(id);
        const item = cosmeticMap.get(id);
        if (!item) return null;
        return {
          type: "cosmetic" as const,
          catalogId: catalogEntry?.id ?? id,
          isFeatured: catalogEntry?.isFeatured ?? false,
          weeklyFeatured: catalogEntry?.weeklyFeatured ?? false,
          collectionId: catalogEntry?.collectionId ?? null,
          dropEnd: item.dropEnd,
          item,
        };
      })
      .filter(Boolean);
  }),

  // ─── Wallet & Transactions ─────────────────────────────────────────────────

  /**
   * wallet — Balance RLC del usuario autenticado.
   */
  wallet: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await getOrCreateWallet(ctx.user.id);
    return {
      balanceRlc: ctx.user.rlcBalance ?? wallet.balanceRlc,
      updatedAt: wallet.updatedAt,
    };
  }),

  /**
   * transactions — Historial de transacciones del usuario autenticado.
   */
  transactions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      type: z.enum(["physical_purchase", "cosmetic_purchase", "reward", "gift", "refund", "deposit"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const filters: Parameters<typeof and> = [
        eq(transactions.userId, ctx.user.id),
      ];
      if (input?.type) {
        filters.push(eq(transactions.type, input.type));
      }

      return db
        .select()
        .from(transactions)
        .where(and(...filters))
        .orderBy(desc(transactions.createdAt))
        .limit(input?.limit ?? 20);
    }),

  /**
   * recordTransaction — Registra una transacción global.
   * Solo para uso interno (llamado desde shop.* y cosmetics.* al comprar).
   */
  recordTransaction: protectedProcedure
    .input(z.object({
      type: z.enum(["physical_purchase", "cosmetic_purchase", "reward", "gift", "refund", "deposit"]),
      amount: z.number(),
      currency: z.enum(["RLC", "USD"]).default("RLC"),
      referenceId: z.number().optional(),
      referenceType: z.enum(["shop_item", "cosmetic", "order", "bet", "reward"]).optional(),
      description: z.string().max(256).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await recordTx({ userId: ctx.user.id, ...input });
      return { ok: true };
    }),

  // ─── Admin ─────────────────────────────────────────────────────────────────

  /**
   * adminCreateCollection — Crear una colección temática.
   */
  adminCreateCollection: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      slug: z.string().min(1).max(128).regex(/^[a-z0-9-]+$/),
      description: z.string().optional(),
      bannerImage: z.string().optional(),
      isActive: z.boolean().default(true),
      isFeatured: z.boolean().default(false),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(collections).values({
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      });
      return { ok: true };
    }),

  /**
   * adminUpdateCollection — Actualizar una colección.
   */
  adminUpdateCollection: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(128).optional(),
      slug: z.string().min(1).max(128).optional(),
      description: z.string().optional(),
      bannerImage: z.string().optional(),
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { id, startDate, endDate, ...rest } = input;
      await db.update(collections).set({
        ...rest,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
      }).where(eq(collections.id, id));
      return { ok: true };
    }),

  /**
   * adminSyncCatalog — Sincroniza el catálogo desde shopItems y cosmetics activos.
   *
   * Agrega al catálogo los ítems que aún no están registrados.
   * No elimina entradas existentes (operación segura e idempotente).
   */
  adminSyncCatalog: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const existing = await db.select().from(catalogItems);
    const existingPhysical = new Set(
      existing.filter(e => e.type === "physical").map(e => e.referenceId)
    );
    const existingCosmetic = new Set(
      existing.filter(e => e.type === "cosmetic").map(e => e.referenceId)
    );

    const [allPhysical, allCosmetic] = await Promise.all([
      db.select().from(shopItems).where(eq(shopItems.isActive, true)),
      db.select().from(cosmetics).where(eq(cosmetics.isActive, true)),
    ]);

    const toInsert: (typeof catalogItems.$inferInsert)[] = [];

    for (const item of allPhysical) {
      if (!existingPhysical.has(item.id)) {
        toInsert.push({
          type: "physical",
          referenceId: item.id,
          title: item.name,
          isFeatured: false,
          isVisible: true,
          weeklyFeatured: false,
          featuredPriority: 0,
          sortOrder: 0,
        });
      }
    }

    for (const item of allCosmetic) {
      if (!existingCosmetic.has(item.id)) {
        toInsert.push({
          type: "cosmetic",
          referenceId: item.id,
          title: item.name,
          isFeatured: false,
          isVisible: true,
          weeklyFeatured: false,
          featuredPriority: 0,
          sortOrder: 0,
        });
      }
    }

    if (toInsert.length > 0) {
      await db.insert(catalogItems).values(toInsert);
    }

    return {
      ok: true,
      added: toInsert.length,
      totalPhysical: allPhysical.length,
      totalCosmetic: allCosmetic.length,
    };
  }),

  /**
   * adminUpdateCatalogItem — Actualizar visibilidad, featured, rotación y colección de un ítem.
   */
  adminUpdateCatalogItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      isFeatured: z.boolean().optional(),
      isVisible: z.boolean().optional(),
      weeklyFeatured: z.boolean().optional(),
      featuredPriority: z.number().optional(),
      visibleFrom: z.string().nullable().optional(),
      visibleUntil: z.string().nullable().optional(),
      publishDate: z.string().nullable().optional(),
      collectionId: z.number().nullable().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { id, visibleFrom, visibleUntil, publishDate, ...rest } = input;
      await db.update(catalogItems).set({
        ...rest,
        ...(visibleFrom !== undefined ? { visibleFrom: visibleFrom ? new Date(visibleFrom) : null } : {}),
        ...(visibleUntil !== undefined ? { visibleUntil: visibleUntil ? new Date(visibleUntil) : null } : {}),
        ...(publishDate !== undefined ? { publishDate: publishDate ? new Date(publishDate) : null } : {}),
      }).where(eq(catalogItems.id, id));
      return { ok: true };
    }),

  // ─── Admin Drops ───────────────────────────────────────────────────────────

  /**
   * adminCreateDrop — Crear un evento de drop.
   */
  adminCreateDrop: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      slug: z.string().min(1).max(128).regex(/^[a-z0-9-]+$/),
      description: z.string().optional(),
      bannerImage: z.string().optional(),
      collectionId: z.number().optional(),
      startDate: z.string(),
      endDate: z.string(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(drops).values({
        ...input,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });
      return { ok: true };
    }),

  /**
   * adminUpdateDrop — Actualizar un drop existente.
   */
  adminUpdateDrop: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(128).optional(),
      slug: z.string().min(1).max(128).optional(),
      description: z.string().optional(),
      bannerImage: z.string().optional(),
      collectionId: z.number().nullable().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { id, startDate, endDate, ...rest } = input;
      await db.update(drops).set({
        ...rest,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
      }).where(eq(drops.id, id));
      return { ok: true };
    }),

  /**
   * adminDeleteDrop — Eliminar un drop (soft: solo desactivar).
   */
  adminDeleteDrop: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(drops).set({ isActive: false }).where(eq(drops.id, input.id));
      return { ok: true };
    }),

  /**
   * adminListDrops — Listar todos los drops (admin).
   */
  adminListDrops: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(drops)
      .orderBy(desc(drops.startDate));
  }),
});

export { recordTx };
