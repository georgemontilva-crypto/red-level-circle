/**
 * Roles competitivos, rangos y regiones por juego.
 * Fuente de verdad única para frontend y backend.
 * Los iconos son rutas a SVGs monocromos coloreables por CSS (fill="currentColor").
 */

export interface GameRoleData {
  value: string;
  label: string;
  /** Ruta al SVG en /public (ej: /role-top.svg) */
  svgPath: string | null;
  description?: string;
}

export interface GameRankData {
  value: string;
  label: string;
  /** Color hex para el badge del rango */
  color: string;
  /** Tier numérico para ordenar (1=más alto) */
  tier: number;
}

// ─── Roles por juego ──────────────────────────────────────────────────────────

export const GAME_ROLES: Record<string, GameRoleData[]> = {
  "league-of-legends": [
    { value: "top",     label: "Top",     svgPath: "/role-top.svg",     description: "Línea superior" },
    { value: "jungle",  label: "Jungla",  svgPath: "/role-jungle.svg",  description: "Jungla" },
    { value: "mid",     label: "Mid",     svgPath: "/role-mid.svg",     description: "Línea central" },
    { value: "adc",     label: "ADC",     svgPath: "/role-adc.svg",     description: "Carry de ataque" },
    { value: "support", label: "Support", svgPath: "/role-support.svg", description: "Soporte" },
  ],
  "valorant": [
    { value: "duelist",    label: "Duelista",    svgPath: "/role-adc.svg",     description: "Agentes de entrada" },
    { value: "initiator",  label: "Iniciador",   svgPath: "/role-mid.svg",     description: "Apertura de sitio" },
    { value: "controller", label: "Controlador", svgPath: "/role-jungle.svg",  description: "Control de mapa" },
    { value: "sentinel",   label: "Centinela",   svgPath: "/role-support.svg", description: "Defensa y flanco" },
    { value: "flex",       label: "Flex",        svgPath: "/role-top.svg",     description: "Cualquier rol" },
  ],
  "counter-strike": [
    { value: "entry",   label: "Entry",   svgPath: "/role-adc.svg",     description: "Entry Fragger" },
    { value: "awper",   label: "AWPer",   svgPath: "/role-mid.svg",     description: "Francotirador" },
    { value: "support", label: "Support", svgPath: "/role-support.svg", description: "Soporte" },
    { value: "lurker",  label: "Lurker",  svgPath: "/role-jungle.svg",  description: "Flanqueo" },
    { value: "igl",     label: "IGL",     svgPath: "/role-top.svg",     description: "In-Game Leader" },
  ],
  "dota-2": [
    { value: "carry",        label: "Carry",        svgPath: "/role-adc.svg",     description: "Carry" },
    { value: "mid",          label: "Mid",          svgPath: "/role-mid.svg",     description: "Línea central" },
    { value: "offlane",      label: "Offlane",      svgPath: "/role-top.svg",     description: "Línea difícil" },
    { value: "soft-support", label: "Soft Support", svgPath: "/role-jungle.svg",  description: "Soporte 4" },
    { value: "hard-support", label: "Hard Support", svgPath: "/role-support.svg", description: "Soporte 5" },
  ],
  "fortnite": [
    { value: "fragger",  label: "Fragger",  svgPath: "/role-adc.svg",     description: "Combate" },
    { value: "builder",  label: "Builder",  svgPath: "/role-top.svg",     description: "Construcción" },
    { value: "support",  label: "Support",  svgPath: "/role-support.svg", description: "Soporte" },
    { value: "igl",      label: "IGL",      svgPath: "/role-mid.svg",     description: "Líder" },
  ],
  "apex-legends": [
    { value: "fragger",  label: "Fragger",  svgPath: "/role-adc.svg",     description: "Combate" },
    { value: "support",  label: "Support",  svgPath: "/role-support.svg", description: "Soporte" },
    { value: "scout",    label: "Scout",    svgPath: "/role-jungle.svg",  description: "Exploración" },
    { value: "igl",      label: "IGL",      svgPath: "/role-mid.svg",     description: "Líder" },
  ],
  "overwatch": [
    { value: "tank",    label: "Tank",    svgPath: "/role-top.svg",     description: "Tanque" },
    { value: "damage",  label: "Damage",  svgPath: "/role-adc.svg",     description: "Daño" },
    { value: "support", label: "Support", svgPath: "/role-support.svg", description: "Soporte" },
    { value: "flex",    label: "Flex",    svgPath: "/role-mid.svg",     description: "Flex" },
  ],
  "rocket-league": [
    { value: "striker",    label: "Striker",    svgPath: "/role-adc.svg",     description: "Delantero" },
    { value: "midfielder", label: "Mediocampo", svgPath: "/role-mid.svg",     description: "Mediocampo" },
    { value: "goalkeeper", label: "Portero",    svgPath: "/role-support.svg", description: "Portero" },
    { value: "flex",       label: "Flex",       svgPath: "/role-top.svg",     description: "Flex" },
  ],
  "honor-of-kings": [
    { value: "top",     label: "Top",     svgPath: "/role-top.svg",     description: "Línea superior" },
    { value: "jungle",  label: "Jungla",  svgPath: "/role-jungle.svg",  description: "Jungla" },
    { value: "mid",     label: "Mid",     svgPath: "/role-mid.svg",     description: "Línea central" },
    { value: "adc",     label: "ADC",     svgPath: "/role-adc.svg",     description: "Carry" },
    { value: "support", label: "Support", svgPath: "/role-support.svg", description: "Soporte" },
  ],
  "mobile-legends": [
    { value: "exp-lane",  label: "EXP Lane",  svgPath: "/role-top.svg",     description: "Línea EXP" },
    { value: "jungler",   label: "Jungler",   svgPath: "/role-jungle.svg",  description: "Jungla" },
    { value: "mid",       label: "Mid",       svgPath: "/role-mid.svg",     description: "Línea central" },
    { value: "gold-lane", label: "Gold Lane", svgPath: "/role-adc.svg",     description: "Línea Gold" },
    { value: "roamer",    label: "Roamer",    svgPath: "/role-support.svg", description: "Roamer" },
  ],
};

/** Roles genéricos para juegos sin lista específica */
export const DEFAULT_ROLES: GameRoleData[] = [
  { value: "fragger",    label: "Fragger",     svgPath: "/role-adc.svg",     description: "Combate" },
  { value: "support",    label: "Support",     svgPath: "/role-support.svg", description: "Soporte" },
  { value: "igl",        label: "IGL",         svgPath: "/role-mid.svg",     description: "Líder" },
  { value: "flex",       label: "Flex",        svgPath: "/role-top.svg",     description: "Flex" },
];

export function getRolesForGame(gameSlug?: string | null): GameRoleData[] {
  if (!gameSlug) return DEFAULT_ROLES;
  return GAME_ROLES[gameSlug] ?? DEFAULT_ROLES;
}

// ─── Rangos / ELO por juego ───────────────────────────────────────────────────

export const GAME_RANKS: Record<string, GameRankData[]> = {
  "league-of-legends": [
    { value: "challenger",  label: "Challenger",  color: "#e8d48b", tier: 1 },
    { value: "grandmaster", label: "Grandmaster", color: "#e8d48b", tier: 2 },
    { value: "master",      label: "Master",      color: "#9b59b6", tier: 3 },
    { value: "diamond",     label: "Diamond",     color: "#5dade2", tier: 4 },
    { value: "emerald",     label: "Emerald",     color: "#2ecc71", tier: 5 },
    { value: "platinum",    label: "Platinum",    color: "#1abc9c", tier: 6 },
    { value: "gold",        label: "Gold",        color: "#f39c12", tier: 7 },
    { value: "silver",      label: "Silver",      color: "#95a5a6", tier: 8 },
    { value: "bronze",      label: "Bronze",      color: "#cd6133", tier: 9 },
    { value: "iron",        label: "Iron",        color: "#7f8c8d", tier: 10 },
    { value: "unranked",    label: "Sin rango",   color: "#555555", tier: 11 },
  ],
  "valorant": [
    { value: "radiant",   label: "Radiant",   color: "#fffde7", tier: 1 },
    { value: "immortal",  label: "Immortal",  color: "#e74c3c", tier: 2 },
    { value: "ascendant", label: "Ascendant", color: "#2ecc71", tier: 3 },
    { value: "diamond",   label: "Diamond",   color: "#5dade2", tier: 4 },
    { value: "platinum",  label: "Platinum",  color: "#1abc9c", tier: 5 },
    { value: "gold",      label: "Gold",      color: "#f39c12", tier: 6 },
    { value: "silver",    label: "Silver",    color: "#95a5a6", tier: 7 },
    { value: "bronze",    label: "Bronze",    color: "#cd6133", tier: 8 },
    { value: "iron",      label: "Iron",      color: "#7f8c8d", tier: 9 },
    { value: "unranked",  label: "Sin rango", color: "#555555", tier: 10 },
  ],
  "counter-strike": [
    { value: "global-elite",    label: "Global Elite",    color: "#e8d48b", tier: 1 },
    { value: "supreme",         label: "Supreme",         color: "#9b59b6", tier: 2 },
    { value: "legendary-eagle", label: "Legendary Eagle", color: "#5dade2", tier: 3 },
    { value: "distinguished",   label: "Distinguished",   color: "#2ecc71", tier: 4 },
    { value: "double-ak",       label: "Double AK",       color: "#f39c12", tier: 5 },
    { value: "master-guardian", label: "Master Guardian", color: "#1abc9c", tier: 6 },
    { value: "guardian",        label: "Guardian",        color: "#95a5a6", tier: 7 },
    { value: "gold-nova",       label: "Gold Nova",       color: "#cd6133", tier: 8 },
    { value: "silver",          label: "Silver",          color: "#7f8c8d", tier: 9 },
    { value: "unranked",        label: "Sin rango",       color: "#555555", tier: 10 },
  ],
  "dota-2": [
    { value: "immortal",  label: "Immortal",  color: "#e8d48b", tier: 1 },
    { value: "divine",    label: "Divine",    color: "#9b59b6", tier: 2 },
    { value: "ancient",   label: "Ancient",   color: "#5dade2", tier: 3 },
    { value: "legend",    label: "Legend",    color: "#2ecc71", tier: 4 },
    { value: "archon",    label: "Archon",    color: "#f39c12", tier: 5 },
    { value: "crusader",  label: "Crusader",  color: "#1abc9c", tier: 6 },
    { value: "guardian",  label: "Guardian",  color: "#95a5a6", tier: 7 },
    { value: "herald",    label: "Herald",    color: "#cd6133", tier: 8 },
    { value: "unranked",  label: "Sin rango", color: "#555555", tier: 9 },
  ],
  "apex-legends": [
    { value: "predator",  label: "Predator",  color: "#e8d48b", tier: 1 },
    { value: "master",    label: "Master",    color: "#9b59b6", tier: 2 },
    { value: "diamond",   label: "Diamond",   color: "#5dade2", tier: 3 },
    { value: "platinum",  label: "Platinum",  color: "#1abc9c", tier: 4 },
    { value: "gold",      label: "Gold",      color: "#f39c12", tier: 5 },
    { value: "silver",    label: "Silver",    color: "#95a5a6", tier: 6 },
    { value: "bronze",    label: "Bronze",    color: "#cd6133", tier: 7 },
    { value: "rookie",    label: "Rookie",    color: "#7f8c8d", tier: 8 },
    { value: "unranked",  label: "Sin rango", color: "#555555", tier: 9 },
  ],
  "overwatch": [
    { value: "champion",    label: "Champion",    color: "#e8d48b", tier: 1 },
    { value: "grandmaster", label: "Grandmaster", color: "#9b59b6", tier: 2 },
    { value: "master",      label: "Master",      color: "#5dade2", tier: 3 },
    { value: "diamond",     label: "Diamond",     color: "#1abc9c", tier: 4 },
    { value: "platinum",    label: "Platinum",    color: "#f39c12", tier: 5 },
    { value: "gold",        label: "Gold",        color: "#95a5a6", tier: 6 },
    { value: "silver",      label: "Silver",      color: "#cd6133", tier: 7 },
    { value: "bronze",      label: "Bronze",      color: "#7f8c8d", tier: 8 },
    { value: "unranked",    label: "Sin rango",   color: "#555555", tier: 9 },
  ],
  "rocket-league": [
    { value: "ssl",         label: "Supersonic Legend", color: "#e8d48b", tier: 1 },
    { value: "grand-champ", label: "Grand Champion",    color: "#9b59b6", tier: 2 },
    { value: "champion",    label: "Champion",          color: "#5dade2", tier: 3 },
    { value: "diamond",     label: "Diamond",           color: "#1abc9c", tier: 4 },
    { value: "platinum",    label: "Platinum",          color: "#f39c12", tier: 5 },
    { value: "gold",        label: "Gold",              color: "#95a5a6", tier: 6 },
    { value: "silver",      label: "Silver",            color: "#cd6133", tier: 7 },
    { value: "bronze",      label: "Bronze",            color: "#7f8c8d", tier: 8 },
    { value: "unranked",    label: "Sin rango",         color: "#555555", tier: 9 },
  ],
};

/** Rangos genéricos para juegos sin lista específica */
export const DEFAULT_RANKS: GameRankData[] = [
  { value: "pro",         label: "Pro",          color: "#e8d48b", tier: 1 },
  { value: "semi-pro",    label: "Semi-Pro",     color: "#9b59b6", tier: 2 },
  { value: "advanced",    label: "Avanzado",     color: "#5dade2", tier: 3 },
  { value: "intermediate",label: "Intermedio",   color: "#2ecc71", tier: 4 },
  { value: "beginner",    label: "Principiante", color: "#95a5a6", tier: 5 },
  { value: "unranked",    label: "Sin rango",    color: "#555555", tier: 6 },
];

export function getRanksForGame(gameSlug?: string | null): GameRankData[] {
  if (!gameSlug) return DEFAULT_RANKS;
  return GAME_RANKS[gameSlug] ?? DEFAULT_RANKS;
}

// ─── Regiones competitivas ────────────────────────────────────────────────────

export const COMPETITIVE_REGIONS = [
  { value: "LAN",  label: "LAN — Latinoamérica Norte" },
  { value: "LAS",  label: "LAS — Latinoamérica Sur" },
  { value: "NA",   label: "NA — Norteamérica" },
  { value: "EU",   label: "EU — Europa" },
  { value: "BR",   label: "BR — Brasil" },
  { value: "KR",   label: "KR — Corea" },
  { value: "APAC", label: "APAC — Asia Pacífico" },
  { value: "EUNE", label: "EUNE — Europa del Norte y Este" },
  { value: "OCE",  label: "OCE — Oceanía" },
  { value: "TR",   label: "TR — Turquía" },
  { value: "RU",   label: "RU — Rusia" },
  { value: "JP",   label: "JP — Japón" },
];
