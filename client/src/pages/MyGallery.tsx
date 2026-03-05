import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Sparkles, Shield, Star, Zap, Image, Tag,
  CheckCircle2, Circle, ChevronRight, ShoppingBag,
  LayoutGrid, Layers,
} from "lucide-react";

// ── Mapas de rareza ──────────────────────────────────────────────────────────
const RARITY_LABEL: Record<string, string> = {
  common: "Común",
  rare: "Raro",
  epic: "Épico",
  legendary: "Legendario",
  mythic: "Mítico",
};
const RARITY_COLOR: Record<string, string> = {
  common: "text-gray-400 border-gray-500",
  rare: "text-blue-400 border-blue-500",
  epic: "text-purple-400 border-purple-500",
  legendary: "text-yellow-400 border-yellow-500",
  mythic: "text-red-400 border-red-500",
};

// ── Icono por tipo ───────────────────────────────────────────────────────────
const TYPE_ICON: Record<string, React.ReactNode> = {
  frame:      <Shield className="w-3.5 h-3.5" />,
  aura:       <Sparkles className="w-3.5 h-3.5" />,
  badge:      <Star className="w-3.5 h-3.5" />,
  background: <Image className="w-3.5 h-3.5" />,
  decoration: <Tag className="w-3.5 h-3.5" />,
  effect:     <Zap className="w-3.5 h-3.5" />,
};
const TYPE_LABEL: Record<string, string> = {
  frame:      "Marco",
  aura:       "Aura",
  badge:      "Insignia",
  background: "Fondo",
  decoration: "Decoración",
  effect:     "Efecto",
};

// ── Tipos de filtro ──────────────────────────────────────────────────────────
const TYPE_FILTERS = [
  { value: "all",        label: "Todos",       icon: <LayoutGrid className="w-4 h-4" /> },
  { value: "frame",      label: "Marcos",      icon: <Shield className="w-4 h-4" /> },
  { value: "aura",       label: "Auras",       icon: <Sparkles className="w-4 h-4" /> },
  { value: "badge",      label: "Insignias",   icon: <Star className="w-4 h-4" /> },
  { value: "background", label: "Fondos",      icon: <Image className="w-4 h-4" /> },
  { value: "decoration", label: "Decoraciones",icon: <Tag className="w-4 h-4" /> },
  { value: "effect",     label: "Efectos",     icon: <Zap className="w-4 h-4" /> },
];

export default function MyGallery() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeType, setActiveType] = useState("all");
  const [equipping, setEquipping] = useState<number | null>(null);

  const { data: myCosmetics = [], refetch } = trpc.cosmetics.myCosmetics.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 0,
  });

  const equipMutation = trpc.cosmetics.equip.useMutation({
    onMutate: (vars) => setEquipping(vars.cosmeticId),
    onSettled: () => { setEquipping(null); refetch(); },
  });
  const unequipMutation = trpc.cosmetics.unequip.useMutation({
    onSettled: () => refetch(),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/40" />
        <h2 className="text-xl font-bold text-white">Inicia sesión para ver tu galería</h2>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-2.5 rounded-xl font-semibold text-white"
          style={{ background: "var(--accent-red)" }}
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  // Filtrar por tipo
  const filtered = activeType === "all"
    ? myCosmetics
    : myCosmetics.filter(c => c.type === activeType);

  // Agrupar por colección
  const grouped: Record<string, typeof filtered> = {};
  for (const c of filtered) {
    const key = c.collection ?? "Sin colección";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  }
  const collections = Object.entries(grouped).sort(([a], [b]) =>
    a === "Sin colección" ? 1 : b === "Sin colección" ? -1 : a.localeCompare(b)
  );

  const equippedIds = new Set(myCosmetics.filter(c => c.isEquipped).map(c => c.cosmeticId));

  function handleEquipToggle(c: typeof myCosmetics[0]) {
    if (c.isEquipped) {
      unequipMutation.mutate({ type: c.type as any });
    } else {
      equipMutation.mutate({ cosmeticId: c.cosmeticId! });
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {user && (
          <UserAvatar
            avatar={(user as any).avatar ?? null}
            name={(user as any).nickname ?? (user as any).name ?? null}
            size={56}
            containerSize={56}
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Galería</h1>
          <p className="text-sm text-muted-foreground">
            {myCosmetics.length} cosmético{myCosmetics.length !== 1 ? "s" : ""} en tu colección
          </p>
        </div>
      </div>

      {/* Filtros de tipo */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveType(f.value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: activeType === f.value ? "var(--accent-red)" : "var(--bg-card)",
              color: activeType === f.value ? "#fff" : "var(--text-secondary)",
              border: activeType === f.value ? "1px solid var(--accent-red)" : "1px solid var(--border-subtle)",
            }}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* Estado vacío */}
      {myCosmetics.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Layers className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-white">Tu galería está vacía</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Visita la tienda y compra cosméticos para personalizar tu perfil.
          </p>
          <button
            onClick={() => navigate("/shop?tab=cosmetics")}
            className="px-6 py-2.5 rounded-xl font-semibold text-white mt-2"
            style={{ background: "var(--accent-red)" }}
          >
            Ir a la tienda
          </button>
        </div>
      )}

      {filtered.length === 0 && myCosmetics.length > 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Layers className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No tienes cosméticos de este tipo.</p>
        </div>
      )}

      {/* Colecciones */}
      {collections.map(([collectionName, items]) => (
        <div key={collectionName} className="space-y-3">
          {/* Título de colección */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-xs font-bold tracking-widest uppercase text-white/80">
              {collectionName}
            </span>
            <span className="text-xs text-muted-foreground">({items.length})</span>
            <div className="flex-1 h-px bg-white/10 ml-1" />
          </div>

          {/* Grid de tarjetas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map(c => {
              const isEquipped = c.isEquipped;
              const isLoading = equipping === c.cosmeticId;
              const rarityClass = RARITY_COLOR[c.rarity ?? "common"] ?? "text-gray-400 border-gray-500";

              return (
                <div
                  key={c.id}
                  className="relative rounded-2xl overflow-hidden flex flex-col cursor-pointer group transition-all duration-200"
                  style={{
                    background: "var(--bg-card)",
                    border: isEquipped
                      ? "1.5px solid var(--accent-red)"
                      : "1.5px solid var(--border-subtle)",
                    boxShadow: isEquipped ? "0 0 16px rgba(220,38,38,0.25)" : "none",
                  }}
                  onClick={() => handleEquipToggle(c)}
                >
                  {/* Imagen */}
                  <div className="relative aspect-square bg-black/30 overflow-hidden">
                    {(c.previewImage || c.frameImage) ? (
                      <img
                        src={c.previewImage ?? c.frameImage ?? ""}
                        alt={c.name ?? ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        {TYPE_ICON[c.type ?? "frame"]}
                      </div>
                    )}

                    {/* Badge equipado */}
                    {isEquipped && (
                      <div className="absolute top-2 right-2 bg-red-600 rounded-full p-0.5">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Overlay hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded-full">
                        {isEquipped ? "Desequipar" : "Equipar"}
                      </span>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5 space-y-1">
                    {/* Tipo */}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      {TYPE_ICON[c.type ?? "frame"]}
                      <span className="text-[10px] uppercase tracking-wide">
                        {TYPE_LABEL[c.type ?? "frame"]}
                      </span>
                    </div>
                    {/* Nombre */}
                    <p className="text-xs font-semibold text-white leading-tight line-clamp-2">
                      {c.name}
                    </p>
                    {/* Rareza */}
                    {c.rarity && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${rarityClass}`}>
                        {RARITY_LABEL[c.rarity] ?? c.rarity}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* CTA ir a tienda */}
      {myCosmetics.length > 0 && (
        <div
          className="flex items-center justify-between p-4 rounded-2xl cursor-pointer group transition-all"
          style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-subtle)" }}
          onClick={() => navigate("/shop?tab=cosmetics")}
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-white">Descubrir más cosméticos</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
        </div>
      )}
    </div>
  );
}
