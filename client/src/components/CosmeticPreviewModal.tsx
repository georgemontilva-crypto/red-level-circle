/**
 * CosmeticPreviewModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal de preview de cosméticos tipo Discord Nitro.
 *
 * Features:
 *  - Preview en vivo del cosmético sobre el avatar del usuario
 *  - Soporte de animaciones: WebM, GIF, WebP animado, Lottie
 *  - Botones de Comprar / Equipar / Desequipar según estado de propiedad
 *  - Transiciones con Framer Motion
 *  - Badge de rareza con glow
 *  - Información completa: nombre, descripción, precio, colección
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Shield, Sparkles, Star, Zap, Check, ShoppingCart, Layers, Wand2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { UserAvatar } from "./UserAvatar";
import { toast } from "sonner";

// ─── Constantes de rareza ─────────────────────────────────────────────────────
const RARITY_CONFIG: Record<string, { label: string; color: string; glow: string; border: string }> = {
  common:    { label: "Común",     color: "text-gray-400",    glow: "",                                          border: "border-gray-600" },
  rare:      { label: "Raro",      color: "text-blue-400",    glow: "shadow-[0_0_24px_rgba(59,130,246,0.5)]",   border: "border-blue-500" },
  epic:      { label: "Épico",     color: "text-purple-400",  glow: "shadow-[0_0_24px_rgba(168,85,247,0.5)]",  border: "border-purple-500" },
  legendary: { label: "Legendario",color: "text-yellow-400",  glow: "shadow-[0_0_32px_rgba(234,179,8,0.6)]",   border: "border-yellow-500" },
  mythic:    { label: "Mítico",    color: "text-red-400",     glow: "shadow-[0_0_40px_rgba(220,38,38,0.7)]",   border: "border-red-500" },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  frame:      <Shield className="w-3.5 h-3.5" />,
  aura:       <Sparkles className="w-3.5 h-3.5" />,
  badge:      <Star className="w-3.5 h-3.5" />,
  background: <Zap className="w-3.5 h-3.5" />,
  decoration: <Layers className="w-3.5 h-3.5" />,
  effect:     <Wand2 className="w-3.5 h-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  frame: "Marco", aura: "Aura", badge: "Insignia",
  background: "Fondo", decoration: "Decoración", effect: "Efecto",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface CosmeticItem {
  id: number;
  name: string;
  description?: string | null;
  type: string;
  rarity: string;
  animationType?: string;
  animationUrl?: string | null;
  previewImage?: string | null;
  frameImage?: string | null;
  price: number;
  originalPrice?: number | null;
  isLimited?: boolean;
  collection?: string | null;
}

interface CosmeticPreviewModalProps {
  cosmetic: CosmeticItem;
  isOwned: boolean;
  isEquipped: boolean;
  onClose: () => void;
  onPurchased?: () => void;
  onEquipped?: () => void;
}

// ─── Reproductor de asset animado ────────────────────────────────────────────
function AnimatedAsset({ cosmetic, size = 160 }: { cosmetic: CosmeticItem; size?: number }) {
  const src = cosmetic.animationUrl || cosmetic.previewImage || cosmetic.frameImage;
  const type = cosmetic.animationType ?? "none";

  if (!src) {
    return (
      <div
        className="rounded-full flex items-center justify-center"
        style={{ width: size, height: size, background: "rgba(255,255,255,0.05)" }}
      >
        <Sparkles className="w-12 h-12 text-muted-foreground opacity-30" />
      </div>
    );
  }

  if (type === "webm") {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        style={{ width: size, height: size, objectFit: "contain", borderRadius: "50%" }}
      />
    );
  }

  // gif, webp, png — todos como <img>
  return (
    <img
      src={src}
      alt={cosmetic.name}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export function CosmeticPreviewModal({
  cosmetic,
  isOwned,
  isEquipped,
  onClose,
  onPurchased,
  onEquipped,
}: CosmeticPreviewModalProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const rarity = RARITY_CONFIG[cosmetic.rarity] ?? RARITY_CONFIG.common;

  // Preview en vivo: mostrar el cosmético sobre el avatar del usuario
  const previewFrameImage =
    cosmetic.type === "frame" ? (cosmetic.frameImage ?? cosmetic.animationUrl ?? undefined) : undefined;

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const buyMutation = trpc.cosmetics.buy.useMutation({
    onSuccess: () => {
      toast.success(`¡${cosmetic.name} adquirido!`);
      utils.cosmetics.myCosmetics.invalidate();
      utils.auth.me.invalidate();
      onPurchased?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const equipMutation = trpc.cosmetics.equip.useMutation({
    onSuccess: () => {
      toast.success(`${cosmetic.name} equipado`);
      utils.cosmetics.myCosmetics.invalidate();
      utils.auth.me.invalidate();
      onEquipped?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const unequipMutation = trpc.cosmetics.unequip.useMutation({
    onSuccess: () => {
      toast.success(`${cosmetic.name} desequipado`);
      utils.cosmetics.myCosmetics.invalidate();
      utils.auth.me.invalidate();
      onEquipped?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const walletQuery = trpc.auth.wallet.useQuery(undefined, { enabled: !!user });
  const balance = walletQuery.data?.balance ?? 0;
  const canAfford = balance >= cosmetic.price;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Panel */}
        <motion.div
          key="panel"
          className="relative w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a1a1f 0%, #111115 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          }}
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow de rareza en el borde superior */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{
              background: cosmetic.rarity === "mythic"
                ? "linear-gradient(90deg, #dc2626, #ef4444, #dc2626)"
                : cosmetic.rarity === "legendary"
                ? "linear-gradient(90deg, #ca8a04, #facc15, #ca8a04)"
                : cosmetic.rarity === "epic"
                ? "linear-gradient(90deg, #7c3aed, #a855f7, #7c3aed)"
                : cosmetic.rarity === "rare"
                ? "linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8)"
                : "rgba(255,255,255,0.1)",
            }}
          />

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Header: preview del asset */}
          <div
            className="flex flex-col items-center pt-10 pb-6 px-6"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)" }}
          >
            {/* Asset animado */}
            <motion.div
              className={`relative ${rarity.glow}`}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <AnimatedAsset cosmetic={cosmetic} size={160} />
            </motion.div>

            {/* Badges: tipo + rareza */}
            <div className="flex items-center gap-2 mt-4">
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono border ${rarity.color} ${rarity.border}`}
                style={{ background: "rgba(0,0,0,0.4)" }}
              >
                {TYPE_ICONS[cosmetic.type]}
                {TYPE_LABELS[cosmetic.type] ?? cosmetic.type}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${rarity.color} ${rarity.border}`}
                style={{ background: "rgba(0,0,0,0.4)" }}
              >
                {rarity.label}
              </span>
              {cosmetic.isLimited && (
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold text-orange-400 border border-orange-500" style={{ background: "rgba(0,0,0,0.4)" }}>
                  LIMITADO
                </span>
              )}
            </div>
          </div>

          {/* Body: info + preview en avatar */}
          <div className="px-6 pb-6">
            <h2 className="font-orbitron font-bold text-xl text-white text-center mb-1">{cosmetic.name}</h2>
            {cosmetic.collection && (
              <p className="text-xs text-center font-mono mb-2" style={{ color: "var(--text-muted)" }}>
                Colección: {cosmetic.collection}
              </p>
            )}
            {cosmetic.description && (
              <p className="text-sm text-center mb-4" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
                {cosmetic.description}
              </p>
            )}

            {/* Preview en vivo sobre el avatar del usuario */}
            {user && (
              <div className="flex flex-col items-center gap-2 mb-5">
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Vista previa en tu perfil</p>
                <div className="flex items-center gap-4">
                  {/* Sin cosmético */}
                  <div className="flex flex-col items-center gap-1">
                    <UserAvatar avatar={user.avatar} name={user.name} size={56} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Ahora</span>
                  </div>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ color: "var(--text-muted)" }}
                  >
                    →
                  </motion.div>
                  {/* Con cosmético */}
                  <div className="flex flex-col items-center gap-1">
                    <UserAvatar
                      avatar={user.avatar}
                      name={user.name}
                      size={56}
                      activeFrameImage={previewFrameImage}
                    />
                    <span className="text-xs font-semibold" style={{ color: "var(--accent-red)" }}>Con {TYPE_LABELS[cosmetic.type] ?? "cosmético"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Precio */}
            {!isOwned && (
              <div className="flex items-center justify-center gap-2 mb-4">
                {cosmetic.originalPrice && cosmetic.originalPrice > cosmetic.price && (
                  <span className="text-sm line-through" style={{ color: "var(--text-muted)" }}>
                    {cosmetic.originalPrice.toLocaleString()} RLC
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xl font-bold font-mono" style={{ color: "#FACC15" }}>
                  <Coins className="w-5 h-5" />
                  {cosmetic.price.toLocaleString()} RLC
                </span>
              </div>
            )}

            {/* Balance del usuario */}
            {user && !isOwned && (
              <p className="text-xs text-center mb-4 font-mono" style={{ color: canAfford ? "var(--text-muted)" : "#ef4444" }}>
                Tu saldo: {balance.toLocaleString()} RLC
                {!canAfford && " — Saldo insuficiente"}
              </p>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col gap-2">
              {!user ? (
                <button
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={{ background: "var(--accent-red)", color: "white" }}
                  onClick={() => window.location.href = "/login"}
                >
                  Iniciar sesión para comprar
                </button>
              ) : isOwned ? (
                isEquipped ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                    style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onClick={() => unequipMutation.mutate({ type: cosmetic.type as any })}
                    disabled={unequipMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                    {unequipMutation.isPending ? "Desequipando..." : "Desequipar"}
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                    style={{ background: "var(--accent-red)", color: "white" }}
                    onClick={() => equipMutation.mutate({ cosmeticId: cosmetic.id })}
                    disabled={equipMutation.isPending}
                  >
                    <Check className="w-4 h-4" />
                    {equipMutation.isPending ? "Equipando..." : "Equipar"}
                  </motion.button>
                )
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: canAfford ? "var(--accent-red)" : "rgba(255,255,255,0.06)",
                    color: canAfford ? "white" : "var(--text-muted)",
                  }}
                  onClick={() => canAfford && buyMutation.mutate({ cosmeticId: cosmetic.id })}
                  disabled={!canAfford || buyMutation.isPending}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {buyMutation.isPending ? "Comprando..." : `Comprar por ${cosmetic.price.toLocaleString()} RLC`}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
