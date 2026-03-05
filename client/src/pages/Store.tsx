/**
 * Store — Catálogo unificado de Commerce Core
 *
 * Rutas:
 *   /store              → Vista principal (Featured + Collections + todos los ítems)
 *   /store/physical     → Solo productos físicos
 *   /store/cosmetics    → Solo cosméticos
 *   /store/collections  → Lista de colecciones
 *   /store/collections/:slug → Detalle de colección
 *
 * Sistemas existentes NO modificados:
 *   /shop        → Tienda física (shop.*)
 *   /cosmetics   → Tienda de cosméticos (cosmetics.*)
 *   /inventory   → Inventario personal
 */

import { useState, useMemo } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import PageContainer from "@/components/PageContainer";
import { SectionBanner } from "@/components/SectionBanner";
import { ShoppingBag, Sparkles, Package, Layers, ChevronRight, Star, Tag, Clock, ArrowRight } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CatalogEntry =
  | { type: "physical"; catalogId: number; isFeatured: boolean; collectionId: number | null; item: any }
  | { type: "cosmetic"; catalogId: number; isFeatured: boolean; collectionId: number | null; item: any };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-400 border-gray-600",
  rare: "text-blue-400 border-blue-600",
  epic: "text-purple-400 border-purple-600",
  legendary: "text-yellow-400 border-yellow-600",
  mythic: "text-red-400 border-red-600",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Común",
  rare: "Raro",
  epic: "Épico",
  legendary: "Legendario",
  mythic: "Mítico",
};

function formatPrice(price: number, currency = "RLC") {
  if (currency === "USD") return `$${(price / 100).toFixed(2)}`;
  return `${price.toLocaleString()} RLC`;
}

// ─── Componentes ─────────────────────────────────────────────────────────────

function CatalogCard({ entry }: { entry: CatalogEntry }) {
  const isPhysical = entry.type === "physical";
  const item = entry.item;

  const imageUrl = isPhysical
    ? (item.image || item.imageUrl || item.thumbnail)
    : (item.previewImage || item.frameImage || item.image);

  const price = isPhysical
    ? formatPrice(item.price ?? 0, "RLC")
    : formatPrice(item.price ?? 0, "RLC");

  const rarityClass = !isPhysical && item.rarity ? RARITY_COLORS[item.rarity] ?? "" : "";
  const rarityLabel = !isPhysical && item.rarity ? RARITY_LABELS[item.rarity] : null;

  const href = isPhysical ? `/shop` : `/shop?tab=cosmetics`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="relative bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden cursor-pointer group"
    >
      <Link href={href}>
        {/* Imagen */}
        <div className="relative aspect-square bg-[#111] overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {isPhysical
                ? <Package className="w-12 h-12 text-white/20" />
                : <Sparkles className="w-12 h-12 text-white/20" />
              }
            </div>
          )}

          {/* Badge tipo */}
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold border backdrop-blur-sm ${
            isPhysical
              ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
              : "bg-purple-500/20 border-purple-500/40 text-purple-300"
          }`}>
            {isPhysical ? "Físico" : "Digital"}
          </div>

          {/* Badge featured */}
          {entry.isFeatured && (
            <div className="absolute top-2 right-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-2 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm flex items-center gap-1">
              <Star className="w-3 h-3" />
              Destacado
            </div>
          )}

          {/* Badge rareza (solo cosméticos) */}
          {rarityLabel && (
            <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold border backdrop-blur-sm bg-black/60 ${rarityClass}`}>
              {rarityLabel}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-white font-semibold text-sm truncate">{item.name}</p>
          {item.description && (
            <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{item.description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[#e63946] font-bold text-sm">{price}</span>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CollectionCard({ collection }: { collection: any }) {
  const isActive = collection.isActive;
  const hasExpiry = !!collection.endDate;
  const daysLeft = hasExpiry
    ? Math.max(0, Math.ceil((new Date(collection.endDate).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-xl overflow-hidden border border-white/10 group cursor-pointer"
    >
      <Link href={`/store/collections/${collection.slug}`}>
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] overflow-hidden">
          {collection.bannerImage ? (
            <img
              src={collection.bannerImage}
              alt={collection.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-70"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Layers className="w-10 h-10 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Badges */}
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <p className="text-white font-bold text-sm drop-shadow">{collection.name}</p>
            <div className="flex gap-1">
              {collection.isFeatured && (
                <span className="bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 text-xs px-2 py-0.5 rounded-full">
                  Destacada
                </span>
              )}
              {daysLeft !== null && daysLeft <= 7 && (
                <span className="bg-red-500/30 border border-red-500/50 text-red-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {daysLeft}d
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Descripción */}
        {collection.description && (
          <div className="p-3 bg-[#1a1a1a]">
            <p className="text-white/50 text-xs line-clamp-2">{collection.description}</p>
          </div>
        )}
      </Link>
    </motion.div>
  );
}

// ─── Secciones ────────────────────────────────────────────────────────────────

function FeaturedSection() {
  const { data: featured, isLoading } = trpc.commerce.featured.useQuery();

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (!featured?.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Destacados
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {featured.filter(Boolean).map((entry: any) => (
          <CatalogCard key={`${entry.type}-${entry.catalogId}`} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function CollectionsSection() {
  const { data: cols, isLoading } = trpc.commerce.collections.useQuery({ featuredOnly: false });

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (!cols?.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          Colecciones
        </h2>
        <Link href="/store/collections" className="text-white/50 hover:text-white text-sm flex items-center gap-1 transition-colors">
          Ver todas <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cols.slice(0, 6).map((col: any) => (
          <CollectionCard key={col.id} collection={col} />
        ))}
      </div>
    </section>
  );
}

function CatalogSection({ type, title, icon, limit = 12 }: {
  type: "all" | "physical" | "cosmetic";
  title: string;
  icon: React.ReactNode;
  limit?: number;
}) {
  const { data: catalog, isLoading } = trpc.commerce.catalog.useQuery({ type, limit });

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (!catalog?.length) return (
    <div className="text-center py-12 text-white/30">
      <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm">No hay ítems disponibles en este momento</p>
    </div>
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <Link
          href={type === "physical" ? "/shop" : type === "cosmetic" ? "/shop?tab=cosmetics" : "/store"}
          className="text-white/50 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          Ver tienda <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {catalog.filter(Boolean).map((entry: any) => (
          <CatalogCard key={`${entry.type}-${entry.catalogId}`} entry={entry} />
        ))}
      </div>
    </section>
  );
}

// ─── Sub-páginas ──────────────────────────────────────────────────────────────

function CollectionDetail({ slug }: { slug: string }) {
  const { data, isLoading } = trpc.commerce.collection.useQuery({ slug });

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-white/30">
      <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p>Colección no encontrada</p>
    </div>
  );

  const { collection, items } = data;

  return (
    <div className="space-y-6">
      {/* Header de colección */}
      <div className="relative rounded-xl overflow-hidden h-48">
        {collection.bannerImage ? (
          <img src={collection.bannerImage} alt={collection.name} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <h1 className="text-white text-2xl font-bold">{collection.name}</h1>
          {collection.description && (
            <p className="text-white/60 text-sm mt-1">{collection.description}</p>
          )}
        </div>
      </div>

      {/* Ítems de la colección */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Esta colección aún no tiene ítems</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item: any) => (
            <div key={item.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3">
              <p className="text-white text-sm font-medium">{item.title}</p>
              <p className="text-white/40 text-xs mt-1 capitalize">{item.type}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AllCollections() {
  const { data: cols, isLoading } = trpc.commerce.collections.useQuery({});

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (!cols?.length) return (
    <div className="text-center py-20 text-white/30">
      <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p>No hay colecciones activas</p>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cols.map((col: any) => (
        <CollectionCard key={col.id} collection={col} />
      ))}
    </div>
  );
}

// ─── Tabs de navegación ───────────────────────────────────────────────────────

const TABS = [
  { id: "all", label: "Todo", icon: <ShoppingBag className="w-4 h-4" /> },
  { id: "physical", label: "Físicos", icon: <Package className="w-4 h-4" /> },
  { id: "cosmetic", label: "Digitales", icon: <Sparkles className="w-4 h-4" /> },
  { id: "collections", label: "Colecciones", icon: <Layers className="w-4 h-4" /> },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Store() {
  const [, params] = useRoute("/store/collections/:slug");
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("all");

  // Detectar sub-ruta
  const isCollectionDetail = !!params?.slug;
  const isAllCollections = location === "/store/collections";

  return (
    <PageContainer>
      <SectionBanner sectionKey="store" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-[#e63946]" />
          Tienda
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Productos físicos y cosméticos digitales en un solo lugar
        </p>
      </div>

      {/* Breadcrumb en sub-páginas */}
      {(isCollectionDetail || isAllCollections) && (
        <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
          <Link href="/store" className="hover:text-white transition-colors">Tienda</Link>
          <ChevronRight className="w-3 h-3" />
          {isAllCollections && <span className="text-white">Colecciones</span>}
          {isCollectionDetail && (
            <>
              <Link href="/store/collections" className="hover:text-white transition-colors">Colecciones</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white capitalize">{params.slug.replace(/-/g, " ")}</span>
            </>
          )}
        </div>
      )}

      {/* Sub-páginas */}
      {isCollectionDetail && <CollectionDetail slug={params.slug} />}
      {isAllCollections && !isCollectionDetail && (
        <div className="space-y-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Todas las colecciones
          </h2>
          <AllCollections />
        </div>
      )}

      {/* Página principal */}
      {!isCollectionDetail && !isAllCollections && (
        <div className="space-y-8">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-[#e63946] text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-10"
            >
              {activeTab === "all" && (
                <>
                  <FeaturedSection />
                  <CollectionsSection />
                  <CatalogSection
                    type="physical"
                    title="Productos Físicos"
                    icon={<Package className="w-5 h-5 text-blue-400" />}
                    limit={8}
                  />
                  <CatalogSection
                    type="cosmetic"
                    title="Cosméticos Digitales"
                    icon={<Sparkles className="w-5 h-5 text-purple-400" />}
                    limit={8}
                  />
                </>
              )}

              {activeTab === "physical" && (
                <CatalogSection
                  type="physical"
                  title="Productos Físicos"
                  icon={<Package className="w-5 h-5 text-blue-400" />}
                  limit={50}
                />
              )}

              {activeTab === "cosmetic" && (
                <CatalogSection
                  type="cosmetic"
                  title="Cosméticos Digitales"
                  icon={<Sparkles className="w-5 h-5 text-purple-400" />}
                  limit={50}
                />
              )}

              {activeTab === "collections" && (
                <div className="space-y-4">
                  <CollectionsSection />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </PageContainer>
  );
}
