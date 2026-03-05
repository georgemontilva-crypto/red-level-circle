/**
 * Inventory.tsx — /inventory
 * ─────────────────────────────────────────────────────────────────────────────
 * Página de inventario de cosméticos del usuario.
 *
 * Features:
 *  - Grid de todos los cosméticos que el usuario posee
 *  - Filtros por tipo (frame, aura, badge, background, decoration, effect)
 *  - Badge "Equipado" en los cosméticos activos
 *  - Clic en cualquier cosmético → abre CosmeticPreviewModal
 *  - Botón "Ir a la tienda" si el inventario está vacío
 *  - Animaciones de entrada con Framer Motion
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Shield, Sparkles, Star, Zap, Layers, Wand2, ShoppingBag, Check } from "lucide-react";
import { CosmeticPreviewModal, type CosmeticItem } from "@/components/CosmeticPreviewModal";
import PageContainer from "@/components/PageContainer";
import { SectionBanner } from "@/components/SectionBanner";

// ─── Constantes ───────────────────────────────────────────────────────────────
const RARITY_CONFIG: Record<string, { label: string; color: string; glow: string; border: string }> = {
  common:    { label: "Común",      color: "text-gray-400",   glow: "",                                         border: "border-gray-700" },
  rare:      { label: "Raro",       color: "text-blue-400",   glow: "shadow-[0_0_16px_rgba(59,130,246,0.35)]", border: "border-blue-600" },
  epic:      { label: "Épico",      color: "text-purple-400", glow: "shadow-[0_0_16px_rgba(168,85,247,0.35)]", border: "border-purple-600" },
  legendary: { label: "Legendario", color: "text-yellow-400", glow: "shadow-[0_0_20px_rgba(234,179,8,0.5)]",  border: "border-yellow-500" },
  mythic:    { label: "Mítico",     color: "text-red-400",    glow: "shadow-[0_0_24px_rgba(220,38,38,0.6)]",  border: "border-red-500" },
};

const TYPE_FILTERS = [
  { value: "all",        label: "Todos",       icon: <Sparkles className="w-4 h-4" /> },
  { value: "frame",      label: "Marcos",      icon: <Shield className="w-4 h-4" /> },
  { value: "aura",       label: "Auras",       icon: <Sparkles className="w-4 h-4" /> },
  { value: "badge",      label: "Insignias",   icon: <Star className="w-4 h-4" /> },
  { value: "background", label: "Fondos",      icon: <Zap className="w-4 h-4" /> },
  { value: "decoration", label: "Decoraciones",icon: <Layers className="w-4 h-4" /> },
  { value: "effect",     label: "Efectos",     icon: <Wand2 className="w-4 h-4" /> },
];

// ─── Tarjeta de cosmético ─────────────────────────────────────────────────────
function CosmeticCard({
  cosmetic,
  isEquipped,
  onClick,
}: {
  cosmetic: CosmeticItem;
  isEquipped: boolean;
  onClick: () => void;
}) {
  const rarity = RARITY_CONFIG[cosmetic.rarity] ?? RARITY_CONFIG.common;
  const src = cosmetic.animationUrl || cosmetic.previewImage || cosmetic.frameImage;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden text-left transition-all ${rarity.glow} ${isEquipped ? "ring-2 ring-red-500" : ""}`}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${isEquipped ? "rgba(220,38,38,0.6)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      {/* Badge equipado */}
      {isEquipped && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
          style={{ background: "var(--accent-red)", color: "white" }}>
          <Check className="w-3 h-3" />
          Equipado
        </div>
      )}

      {/* Imagen / asset */}
      <div className="flex items-center justify-center p-4" style={{ minHeight: 120 }}>
        {src ? (
          cosmetic.animationType === "webm" ? (
            <video src={src} autoPlay loop muted playsInline className="w-20 h-20 object-contain" />
          ) : (
            <img src={src} alt={cosmetic.name} className="w-20 h-20 object-contain" />
          )
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <Sparkles className="w-8 h-8 text-muted-foreground opacity-30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pb-3">
        <p className="font-semibold text-sm text-white truncate">{cosmetic.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-xs font-mono ${rarity.color}`}>{rarity.label}</span>
          {cosmetic.isLimited && (
            <span className="text-xs font-mono text-orange-400">· Limitado</span>
          )}
        </div>
      </div>

      {/* Borde inferior de rareza */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{
          background: cosmetic.rarity === "mythic" ? "#dc2626"
            : cosmetic.rarity === "legendary" ? "#ca8a04"
            : cosmetic.rarity === "epic" ? "#7c3aed"
            : cosmetic.rarity === "rare" ? "#1d4ed8"
            : "transparent",
        }}
      />
    </motion.button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Inventory() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCosmetic, setSelectedCosmetic] = useState<CosmeticItem | null>(null);

  const { data: myCosmetics, refetch } = trpc.cosmetics.myCosmetics.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <ShoppingBag className="w-16 h-16 text-muted-foreground opacity-30" />
          <p className="text-lg font-semibold text-white">Inicia sesión para ver tu inventario</p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2.5 rounded-xl font-bold text-sm"
            style={{ background: "var(--accent-red)", color: "white" }}
          >
            Iniciar sesión
          </button>
        </div>
      </PageContainer>
    );
  }

  const items = (myCosmetics ?? []) as Array<{ cosmetic: CosmeticItem; isEquipped: boolean }>;

  const filtered = activeFilter === "all"
    ? items
    : items.filter((i) => i.cosmetic.type === activeFilter);

  const selectedIsEquipped = selectedCosmetic
    ? items.find((i) => i.cosmetic.id === selectedCosmetic.id)?.isEquipped ?? false
    : false;

  return (
    <PageContainer>
      <SectionBanner sectionKey="inventory" />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-orbitron font-bold text-2xl text-white">Mi Inventario</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {items.length} cosmético{items.length !== 1 ? "s" : ""} en tu colección
          </p>
        </div>

        {/* Filtros de tipo */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TYPE_FILTERS.map((f) => {
            const count = f.value === "all"
              ? items.length
              : items.filter((i) => i.cosmetic.type === f.value).length;
            if (f.value !== "all" && count === 0) return null;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: activeFilter === f.value ? "var(--accent-red)" : "var(--bg-card)",
                  color: activeFilter === f.value ? "white" : "var(--text-muted)",
                  border: `1px solid ${activeFilter === f.value ? "transparent" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {f.icon}
                {f.label}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Grid de cosméticos */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <ShoppingBag className="w-16 h-16 text-muted-foreground opacity-20" />
            <p className="text-lg font-semibold text-white">
              {activeFilter === "all" ? "Tu inventario está vacío" : `No tienes cosméticos de tipo "${TYPE_FILTERS.find(f => f.value === activeFilter)?.label}"`}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Visita la tienda para conseguir tu primer cosmético
            </p>
            <button
              onClick={() => navigate("/shop?tab=cosmetics")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm mt-2"
              style={{ background: "var(--accent-red)", color: "white" }}
            >
              <ShoppingBag className="w-4 h-4" />
              Ir a la tienda
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map(({ cosmetic, isEquipped }) => (
                <CosmeticCard
                  key={cosmetic.id}
                  cosmetic={cosmetic}
                  isEquipped={isEquipped}
                  onClick={() => setSelectedCosmetic(cosmetic)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modal de preview */}
      {selectedCosmetic && (
        <CosmeticPreviewModal
          cosmetic={selectedCosmetic}
          isOwned={true}
          isEquipped={selectedIsEquipped}
          onClose={() => setSelectedCosmetic(null)}
          onEquipped={() => {
            refetch();
            setSelectedCosmetic(null);
          }}
        />
      )}
    </PageContainer>
  );
}
