import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Coins, ShoppingBag, Sparkles, Shield, Star, Zap, Check, Lock } from "lucide-react";
import { getLoginUrl } from "@/const";

const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-400 border-gray-600",
  rare: "text-blue-400 border-blue-500",
  epic: "text-purple-400 border-purple-500",
  legendary: "text-yellow-400 border-yellow-500",
};

const RARITY_GLOW: Record<string, string> = {
  common: "",
  rare: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
  epic: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
  legendary: "shadow-[0_0_20px_rgba(234,179,8,0.5)]",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Común",
  rare: "Raro",
  epic: "Épico",
  legendary: "Legendario",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  frame: <Shield className="w-4 h-4" />,
  aura: <Sparkles className="w-4 h-4" />,
  badge: <Star className="w-4 h-4" />,
  background: <Zap className="w-4 h-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  frame: "Marcos",
  aura: "Auras",
  badge: "Insignias",
  background: "Fondos",
};

// Placeholder avatar for preview
const AVATAR_PLACEHOLDER = "https://api.dicebear.com/7.x/bottts/svg?seed=rlc&backgroundColor=1a1a1a";

export default function CosmeticsShop() {
  const { user, isAuthenticated } = useAuth();
  const [activeType, setActiveType] = useState("all");
  const [activeCollection, setActiveCollection] = useState<string | undefined>();
  const [previewCosmetic, setPreviewCosmetic] = useState<number | null>(null);

  const { data: cosmetics = [], refetch } = trpc.cosmetics.list.useQuery({
    type: activeType === "all" ? undefined : activeType,
    collection: activeCollection,
  });

  const { data: myCosmetics = [], refetch: refetchOwned } = trpc.cosmetics.myCosmetics.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: me, refetch: refetchMe } = trpc.auth.me.useQuery();

  const buyMutation = trpc.cosmetics.buy.useMutation({
    onSuccess: (data) => {
      toast.success(`¡Cosmético adquirido! Nuevo balance: ${data.newBalance} RLC`, {
        style: { background: "#0a0a0a", border: "1px solid #ff0000", color: "#fff" },
      });
      refetch();
      refetchOwned();
      refetchMe();
    },
    onError: (err) => {
      toast.error(err.message, {
        style: { background: "#0a0a0a", border: "1px solid #ff0000", color: "#fff" },
      });
    },
  });

  const equipMutation = trpc.cosmetics.equip.useMutation({
    onSuccess: () => {
      toast.success("¡Cosmético equipado!", {
        style: { background: "#0a0a0a", border: "1px solid #ff0000", color: "#fff" },
      });
      refetchOwned();
    },
  });

  const ownedIds = new Set(myCosmetics.map((c) => c.cosmeticId));
  const equippedIds = new Set(myCosmetics.filter((c) => c.isEquipped).map((c) => c.cosmeticId));

  // Get unique collections
  const collections = Array.from(new Set(cosmetics.map((c) => c.collection).filter(Boolean)));

  const previewing = cosmetics.find((c) => c.id === previewCosmetic);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0000 50%, #0a0a0a 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #ff0000, transparent)" }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #ff4444, transparent)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-red-500" />
            <span className="text-red-500 font-mono text-sm tracking-widest uppercase">Red Level Circle</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-3" style={{ fontFamily: "Orbitron, monospace" }}>
            TIENDA DE <span className="text-red-500" style={{ textShadow: "0 0 20px #ff0000" }}>COSMÉTICOS</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Personaliza tu perfil con marcos, auras e insignias exclusivas. Compra con RLC Coins y destácate en la comunidad.
          </p>
          {isAuthenticated && me && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold font-mono">{(me as { rlcBalance?: number }).rlcBalance ?? 0} RLC</span>
              <span className="text-gray-500 text-sm">disponibles</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Type Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {["all", "frame", "aura", "badge", "background"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-sm transition-all ${
                activeType === type
                  ? "border-red-500 bg-red-500/10 text-red-400"
                  : "border-white/10 bg-white/5 text-gray-400 hover:border-red-500/50 hover:text-white"
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
            <span className="text-gray-500 text-sm font-mono self-center">Colecciones:</span>
            <button
              onClick={() => setActiveCollection(undefined)}
              className={`px-3 py-1 rounded text-xs font-mono border transition-all ${
                !activeCollection ? "border-red-500 text-red-400 bg-red-500/10" : "border-white/10 text-gray-500 hover:border-white/30"
              }`}
            >
              Todas
            </button>
            {collections.map((col) => (
              <button
                key={col}
                onClick={() => setActiveCollection(col === activeCollection ? undefined : col!)}
                className={`px-3 py-1 rounded text-xs font-mono border transition-all ${
                  activeCollection === col ? "border-red-500 text-red-400 bg-red-500/10" : "border-white/10 text-gray-500 hover:border-white/30"
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
            <p className="text-gray-500 font-mono text-lg">No hay cosméticos disponibles aún</p>
            <p className="text-gray-600 text-sm mt-2">Los administradores agregarán nuevos items pronto</p>
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
                  className={`relative rounded-xl border bg-zinc-900 overflow-hidden cursor-pointer transition-all hover:scale-105 ${rarityClass} ${glowClass} ${
                    previewCosmetic === cosmetic.id ? "ring-2 ring-red-500" : ""
                  }`}
                  onClick={() => setPreviewCosmetic(previewCosmetic === cosmetic.id ? null : cosmetic.id)}
                >
                  {/* Preview Image */}
                  <div className="relative aspect-square bg-zinc-800 flex items-center justify-center overflow-hidden">
                    {cosmetic.previewImage ? (
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
                      <span className="text-xs text-gray-500 font-mono">{TYPE_LABELS[cosmetic.type]}</span>
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
                            <span className="text-gray-500 text-xs self-center">+{cols.length - 4}</span>
                          )}
                        </div>
                      ) : null;
                    })()}

                    {/* Price & Action */}
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {cosmetic.originalPrice && cosmetic.originalPrice > cosmetic.price && (
                          <p className="text-gray-600 text-xs line-through font-mono">{cosmetic.originalPrice} RLC</p>
                        )}
                        <div className="flex items-center gap-1">
                          <Coins className="w-3 h-3 text-yellow-400" />
                          <span className="text-yellow-400 font-bold text-sm font-mono">{cosmetic.price}</span>
                        </div>
                      </div>

                      {owned ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); equipMutation.mutate({ cosmeticId: cosmetic.id }); }}
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
                          onClick={(e) => { e.stopPropagation(); buyMutation.mutate({ cosmeticId: cosmetic.id }); }}
                          disabled={buyMutation.isPending}
                          className="px-2 py-1 rounded text-xs font-mono font-bold bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-50"
                        >
                          Comprar
                        </button>
                      ) : (
                        <a href={getLoginUrl()} className="px-2 py-1 rounded text-xs font-mono font-bold bg-zinc-700 text-gray-400 hover:bg-zinc-600 transition-all flex items-center gap-1">
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
            <h2 className="text-2xl font-black mb-6 font-mono tracking-wide">
              MI <span className="text-red-500">COLECCIÓN</span>
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {myCosmetics.map((uc) => (
                <div
                  key={uc.id}
                  className={`relative rounded-lg border p-2 text-center transition-all ${
                    uc.isEquipped ? "border-green-500 bg-green-500/10" : "border-white/10 bg-zinc-900"
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-1 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                    {uc.previewImage ? (
                      <img src={uc.previewImage} alt={uc.name ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{uc.name}</p>
                  {uc.isEquipped && (
                    <span className="text-xs text-green-400 font-mono">✓ Activo</span>
                  )}
                  {!uc.isEquipped && (
                    <button
                      onClick={() => equipMutation.mutate({ cosmeticId: uc.cosmeticId })}
                      className="text-xs text-red-400 hover:text-red-300 font-mono mt-1"
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
    </div>
  );
}
