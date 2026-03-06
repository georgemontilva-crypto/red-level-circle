import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionBanner } from "@/components/SectionBanner";
import { toast } from "sonner";
import {
  Coins, ShoppingBag, Sparkles, Shield, Star, Zap, Check, Lock, X, AlertCircle, ShoppingCart, Layers, Wand2,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { CosmeticPreviewModal, type CosmeticItem } from "@/components/CosmeticPreviewModal";

const RARITY_COLORS: Record<string, string> = {
  common: "text-muted-foreground border-gray-600",
  rare: "text-blue-400 border-blue-500",
  epic: "text-purple-400 border-purple-500",
  legendary: "text-yellow-400 border-yellow-500",
  mythic: "text-red-400 border-red-500",
};
const RARITY_GLOW: Record<string, string> = {
  common: "",
  rare: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
  epic: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
  legendary: "shadow-[0_0_20px_rgba(234,179,8,0.5)]",
  mythic: "shadow-[0_0_28px_rgba(220,38,38,0.7)]",
};
const RARITY_LABELS: Record<string, string> = {
  common: "Común",
  rare: "Raro",
  epic: "Épico",
  legendary: "Legendario",
  mythic: "Mítico",
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  frame: <Shield className="w-4 h-4" />,
  aura: <Sparkles className="w-4 h-4" />,
  badge: <Star className="w-4 h-4" />,
  background: <Zap className="w-4 h-4" />,
  decoration: <Layers className="w-4 h-4" />,
  effect: <Wand2 className="w-4 h-4" />,
};
const TYPE_LABELS: Record<string, string> = {
  frame: "Marcos",
  aura: "Auras",
  badge: "Insignias",
  background: "Fondos",
  decoration: "Decoraciones",
  effect: "Efectos",
};

const AVATAR_PLACEHOLDER = "https://api.dicebear.com/7.x/bottts/svg?seed=rlc&backgroundColor=1a1a1a";

// ─── Purchase Confirmation Modal ──────────────────────────────────────────────
function PurchaseModal({
  cosmetic,
  userBalance,
  onConfirm,
  onClose,
  isPending,
  error,
}: {
  cosmetic: any;
  userBalance: number;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
  error: string | null;
}) {
  const canAfford = userBalance >= cosmetic.price;
  const rarityGlow = RARITY_GLOW[cosmetic.rarity] ?? "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-white/10"
        style={{
          animation: "modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header image */}
        <div className="relative h-44 bg-card overflow-hidden">
          {cosmetic.previewImage ? (
            <img src={cosmetic.previewImage} alt={cosmetic.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-24 h-24">
                <img src={AVATAR_PLACEHOLDER} alt="avatar" className="w-full h-full rounded-full" />
                {cosmetic.frameImage && (
                  <img
                    src={cosmetic.frameImage}
                    alt="frame"
                    className="absolute pointer-events-none"
                    style={{ width: "144px", height: "144px", top: "50%", left: "50%", transform: "translate(-50%, -50%)", objectFit: "contain", zIndex: 10 }}
                  />
                )}
              </div>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, var(--bg-card) 100%)" }} />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 hover:bg-background/80 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 -mt-2">
          {/* Insufficient funds error */}
          {!canAfford && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm font-rajdhani">Saldo insuficiente. Necesitas {cosmetic.price - userBalance} RLC más.</p>
            </div>
          )}
          {error && canAfford && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm font-rajdhani">{error}</p>
            </div>
          )}

          <p className="text-muted-foreground text-xs font-rajdhani uppercase tracking-widest mb-3">Detalles de la compra</p>

          {/* Item row */}
          <div className={`flex items-center gap-3 bg-card border border-white/10 rounded-xl p-3 mb-4 ${rarityGlow}`}>
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              {cosmetic.previewImage ? (
                <img src={cosmetic.previewImage} alt={cosmetic.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm font-rajdhani truncate">{cosmetic.name}</p>
              <p className={`text-xs font-mono ${RARITY_COLORS[cosmetic.rarity]?.split(" ")[0] ?? "text-muted-foreground"}`}>
                {RARITY_LABELS[cosmetic.rarity]} · {TYPE_LABELS[cosmetic.type]}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold font-mono text-sm">{cosmetic.price}</span>
            </div>
          </div>

          {/* Payment method — RLC Coins */}
          <p className="text-muted-foreground text-xs font-rajdhani uppercase tracking-widest mb-2">Paga con</p>
          <div className="flex items-center gap-3 bg-card border border-white/10 rounded-xl px-4 py-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center flex-shrink-0">
              <Coins className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-rajdhani font-semibold">RLC Coins</p>
              <p className={`text-xs font-mono ${canAfford ? "text-green-400" : "text-red-400"}`}>
                Saldo disponible: {userBalance} RLC
              </p>
            </div>
            {canAfford && (
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            )}
          </div>

          <p className="text-muted-foreground text-xs font-rajdhani mb-4 leading-relaxed">
            Al hacer clic en "Comprar", el cosmético quedará disponible de inmediato en tu galería de perfil. Esta compra no es reembolsable.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/10 text-muted-foreground hover:bg-white/5 font-orbitron text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!canAfford || isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2" />Procesando...</>
              ) : (
                <><ShoppingCart className="w-3.5 h-3.5 mr-1.5" />Comprar</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CosmeticsShop() {
  const { user, isAuthenticated } = useAuth();
  const [activeType, setActiveType] = useState("all");
  const [activeCollection, setActiveCollection] = useState<string | undefined>();
  const [confirmCosmetic, setConfirmCosmetic] = useState<any | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [previewCosmetic, setPreviewCosmetic] = useState<CosmeticItem | null>(null);
  const [, navigate] = useLocation();

  const { data: cosmetics = [], refetch } = trpc.cosmetics.list.useQuery(
    { type: activeType === "all" ? undefined : activeType, collection: activeCollection },
    { staleTime: 0 }
  );
  const { data: myCosmetics = [], refetch: refetchOwned } = trpc.cosmetics.myCosmetics.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: me, refetch: refetchMe } = trpc.auth.me.useQuery();

  const buyMutation = trpc.cosmetics.buy.useMutation({
    onSuccess: (data) => {
      toast.success(`¡Cosmético adquirido! Ve a tu perfil para equiparlo.`, {
        style: { background: "var(--bg-main)", border: "1px solid #22c55e", color: "var(--text-primary)" },
      });
      setConfirmCosmetic(null);
      setBuyError(null);
      refetch();
      refetchOwned();
      refetchMe();
      // Redirect to user profile cosmetics tab
      if (user?.id) {
        navigate(`/profile/${user.id}?tab=cosmetics`);
      }
    },
    onError: (err) => {
      setBuyError(err.message);
    },
  });

  const equipMutation = trpc.cosmetics.equip.useMutation({
    onSuccess: () => {
      toast.success("¡Cosmético equipado! Visible en tu perfil.", {
        style: { background: "var(--bg-main)", border: "1px solid var(--accent-red)", color: "var(--text-primary)" },
      });
      refetchOwned();
      refetchMe();
    },
  });

  type MyCosmetic = NonNullable<typeof myCosmetics>[number];
  const ownedIds = new Set(myCosmetics.map((c: MyCosmetic) => c.cosmeticId));
  const equippedIds = new Set(myCosmetics.filter((c: MyCosmetic) => c.isEquipped).map((c: MyCosmetic) => c.cosmeticId));
  const collections = Array.from(new Set(cosmetics.map((c) => c.collection).filter((c): c is string => !!c))) as string[];
  const userBalance = (me as any)?.rlcBalance ?? 0;

  const handleBuyClick = (cosmetic: any) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    setBuyError(null);
    setConfirmCosmetic(cosmetic);
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Section Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <SectionBanner hidden sectionKey="cosmetics" height="h-48 sm:h-64 lg:h-72" />
      </div>
      {/* Purchase confirmation modal */}
      {confirmCosmetic && (
        <PurchaseModal
          cosmetic={confirmCosmetic}
          userBalance={userBalance}
          onConfirm={() => buyMutation.mutate({ cosmeticId: confirmCosmetic.id })}
          onClose={() => { setConfirmCosmetic(null); setBuyError(null); }}
          isPending={buyMutation.isPending}
          error={buyError}
        />
      )}



      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Type Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {["all", "frame", "aura", "badge", "background", "decoration", "effect"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-sm transition-all ${
                activeType === type
                  ? "border-red-500 bg-red-500/10 text-red-400"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:border-red-500/50 hover:text-white"
              }`}
            >
              {type !== "all" && TYPE_ICONS[type]}
              {type === "all" ? "Todos" : TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Collections */}
        {collections.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="text-muted-foreground text-sm font-mono self-center">Colecciones:</span>
            <button
              onClick={() => setActiveCollection(undefined)}
              className={`px-3 py-1 rounded text-xs font-mono border transition-all ${
                !activeCollection ? "border-red-500 text-red-400 bg-red-500/10" : "border-white/10 text-muted-foreground hover:border-white/30"
              }`}
            >
              Todas
            </button>
            {collections.map((col: string) => (
              <button
                key={col}
                onClick={() => setActiveCollection(col === activeCollection ? undefined : col)}
                className={`px-3 py-1 rounded text-xs font-mono border transition-all ${
                  activeCollection === col ? "border-red-500 text-red-400 bg-red-500/10" : "border-white/10 text-muted-foreground hover:border-white/30"
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {cosmetics.length === 0 ? (
          <div className="text-center py-24">
            <Sparkles className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-mono text-lg">No hay cosméticos disponibles aún</p>
            <p className="text-muted-foreground text-sm mt-2">Los administradores agregarán nuevos items pronto</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {cosmetics.map((cosmetic) => {
              const owned = ownedIds.has(cosmetic.id);
              const equipped = equippedIds.has(cosmetic.id);
              const rarityClass = RARITY_COLORS[cosmetic.rarity] ?? RARITY_COLORS.common;
              const glowClass = RARITY_GLOW[cosmetic.rarity] ?? "";
              const discount = cosmetic.originalPrice && cosmetic.originalPrice > cosmetic.price
                ? Math.round((1 - cosmetic.price / cosmetic.originalPrice) * 100)
                : null;

              return (
                <div
                  key={cosmetic.id}
                  className={`relative rounded-xl border bg-card overflow-hidden transition-all hover:scale-[1.03] hover:-translate-y-0.5 cursor-pointer ${rarityClass} ${glowClass}`}
                  onClick={() => setPreviewCosmetic(cosmetic as unknown as CosmeticItem)}
                >
                  {/* Preview Image */}
                  <div className="relative aspect-square bg-secondary flex items-center justify-center overflow-hidden">
                    {(cosmetic as any).animationType === "webm" && (cosmetic as any).animationUrl ? (
                      <video src={(cosmetic as any).animationUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : cosmetic.previewImage ? (
                      <img src={cosmetic.previewImage} alt={cosmetic.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="relative w-24 h-24">
                        <img src={AVATAR_PLACEHOLDER} alt="avatar" className="w-full h-full rounded-full" />
                        {cosmetic.frameImage && (
                          <img src={cosmetic.frameImage} alt="frame" className="absolute inset-0 w-full h-full" />
                        )}
                        {!cosmetic.frameImage && (
                          <div className="absolute inset-0 rounded-full border-4 border-current opacity-60" />
                        )}
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {cosmetic.isLimited && (
                        <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded font-mono">LIMITADO</span>
                      )}
                      {discount && (
                        <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded font-mono">-{discount}%</span>
                      )}
                    </div>

                    {owned && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {TYPE_ICONS[cosmetic.type]}
                      <span className="text-xs text-muted-foreground font-mono">{TYPE_LABELS[cosmetic.type]}</span>
                    </div>
                    <p className="font-bold text-sm text-white leading-tight mb-1">{cosmetic.name}</p>
                    <Badge variant="outline" className={`text-xs ${rarityClass} mb-2`}>
                      {RARITY_LABELS[cosmetic.rarity]}
                    </Badge>

                    {/* Color swatches */}
                    {(() => {
                      const cols = Array.isArray(cosmetic.colors) ? (cosmetic.colors as unknown[]).filter((c): c is string => typeof c === 'string') : [];
                      return cols.length > 0 ? (
                        <div className="flex gap-1 mb-2">
                          {cols.slice(0, 4).map((color, i) => (
                            <div key={i} className="w-4 h-4 rounded-full border border-white/20" style={{ background: color }} />
                          ))}
                          {cols.length > 4 && (
                            <span className="text-muted-foreground text-xs self-center">+{cols.length - 4}</span>
                          )}
                        </div>
                      ) : null;
                    })()}

                    {/* Price & Action */}
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {cosmetic.originalPrice && cosmetic.originalPrice > cosmetic.price && (
                          <p className="text-muted-foreground text-xs line-through font-mono">{cosmetic.originalPrice} RLC</p>
                        )}
                        <div className="flex items-center gap-1">
                          <Coins className="w-3 h-3 text-yellow-400" />
                          <span className="text-yellow-400 font-bold text-sm font-mono">{cosmetic.price}</span>
                        </div>
                      </div>

                      {owned ? (
                        <button
                          onClick={() => equipMutation.mutate({ cosmeticId: cosmetic.id })}
                          className={`px-2 py-1 rounded text-xs font-mono font-bold transition-all ${
                            equipped
                              ? "bg-green-500/20 text-green-400 border border-green-500/50"
                              : "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                          }`}
                        >
                          {equipped ? "Equipado" : "Equipar"}
                        </button>
                      ) : isAuthenticated ? (
                        <button
                          onClick={() => handleBuyClick(cosmetic)}
                          className="px-2 py-1 rounded text-xs font-mono font-bold bg-red-500 hover:bg-red-600 text-white transition-all"
                        >
                          Comprar
                        </button>
                      ) : (
                        <a href={getLoginUrl()} className="px-2 py-1 rounded text-xs font-mono font-bold bg-muted text-muted-foreground hover:bg-zinc-600 transition-all flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Login
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My Collection */}
        {isAuthenticated && myCosmetics.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black mb-2 font-mono tracking-wide">
              MI <span className="text-red-500">COLECCIÓN</span>
            </h2>
            <p className="text-muted-foreground text-sm font-rajdhani mb-6">Los cosméticos equipados se muestran sobre tu foto de perfil en toda la plataforma.</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {myCosmetics.map((uc) => (
                <div
                  key={uc.id}
                  className={`relative rounded-lg border p-2 text-center transition-all ${
                    uc.isEquipped ? "border-green-500 bg-green-500/10" : "border-white/10 bg-card"
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-1 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {(uc as any).previewImage ? (
                      <img src={(uc as any).previewImage} alt={(uc as any).name ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{(uc as any).name}</p>
                  {uc.isEquipped ? (
                    <span className="text-xs text-green-400 font-mono flex items-center gap-0.5"><Check size={11} /> Equipado</span>
                  ) : (
                    <button
                      onClick={() => equipMutation.mutate({ cosmeticId: uc.cosmeticId })}
                      disabled={equipMutation.isPending}
                      className="text-xs text-red-400 hover:text-red-300 font-mono mt-1 disabled:opacity-50"
                    >
                      Equipar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewCosmetic && (
        <CosmeticPreviewModal
          cosmetic={previewCosmetic}
          isOwned={ownedIds.has(previewCosmetic.id)}
          isEquipped={equippedIds.has(previewCosmetic.id)}
          onClose={() => setPreviewCosmetic(null)}
          onEquipped={() => {
            refetchOwned();
            refetchMe();
            setPreviewCosmetic(null);
          }}
          onPurchased={() => {
            setPreviewCosmetic(null);
            handleBuyClick(previewCosmetic);
          }}
        />
      )}
    </div>
  );
}
