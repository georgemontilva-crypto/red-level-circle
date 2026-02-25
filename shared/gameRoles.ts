/**
 * Roles competitivos por juego y regiones competitivas.
 * Fuente de verdad única para frontend y backend.
 */

export interface GameRoleData {
  value: string;
  label: string;
  icon?: string; // emoji o código de ícono
}

export const GAME_ROLES: Record<string, GameRoleData[]> = {
  "league-of-legends": [
    { value: "top",     label: "Top",     icon: "🛡️" },
    { value: "jungle",  label: "Jungla",  icon: "🌿" },
    { value: "mid",     label: "Mid",     icon: "⚡" },
    { value: "adc",     label: "ADC",     icon: "🏹" },
    { value: "support", label: "Support", icon: "💊" },
  ],
  "valorant": [
    { value: "duelist",    label: "Duelista",   icon: "⚔️" },
    { value: "initiator",  label: "Iniciador",  icon: "🔍" },
    { value: "controller", label: "Controlador",icon: "🌀" },
    { value: "sentinel",   label: "Centinela",  icon: "🔒" },
    { value: "flex",       label: "Flex",       icon: "🔄" },
  ],
  "counter-strike": [
    { value: "entry",    label: "Entry Fragger", icon: "💥" },
    { value: "awper",    label: "AWPer",         icon: "🎯" },
    { value: "support",  label: "Support",       icon: "💊" },
    { value: "lurker",   label: "Lurker",        icon: "👻" },
    { value: "igl",      label: "IGL",           icon: "📡" },
  ],
  "dota-2": [
    { value: "carry",       label: "Carry",       icon: "⚔️" },
    { value: "mid",         label: "Mid",         icon: "⚡" },
    { value: "offlane",     label: "Offlane",     icon: "🛡️" },
    { value: "soft-support",label: "Soft Support",icon: "🌿" },
    { value: "hard-support",label: "Hard Support",icon: "💊" },
  ],
  "fortnite": [
    { value: "fragger",  label: "Fragger",  icon: "💥" },
    { value: "builder",  label: "Builder",  icon: "🏗️" },
    { value: "support",  label: "Support",  icon: "💊" },
    { value: "igl",      label: "IGL",      icon: "📡" },
  ],
  "apex-legends": [
    { value: "fragger",   label: "Fragger",   icon: "💥" },
    { value: "support",   label: "Support",   icon: "💊" },
    { value: "scout",     label: "Scout",     icon: "🔍" },
    { value: "igl",       label: "IGL",       icon: "📡" },
  ],
  "overwatch": [
    { value: "tank",    label: "Tank",    icon: "🛡️" },
    { value: "damage",  label: "Damage",  icon: "💥" },
    { value: "support", label: "Support", icon: "💊" },
    { value: "flex",    label: "Flex",    icon: "🔄" },
  ],
  "rocket-league": [
    { value: "striker",     label: "Striker",     icon: "⚽" },
    { value: "midfielder",  label: "Mediocampo",  icon: "🔄" },
    { value: "goalkeeper",  label: "Portero",     icon: "🥅" },
    { value: "flex",        label: "Flex",        icon: "🔄" },
  ],
  "honor-of-kings": [
    { value: "top",     label: "Top",     icon: "🛡️" },
    { value: "jungle",  label: "Jungla",  icon: "🌿" },
    { value: "mid",     label: "Mid",     icon: "⚡" },
    { value: "adc",     label: "ADC",     icon: "🏹" },
    { value: "support", label: "Support", icon: "💊" },
  ],
  "mobile-legends": [
    { value: "exp-lane", label: "EXP Lane",  icon: "🛡️" },
    { value: "jungler",  label: "Jungler",   icon: "🌿" },
    { value: "mid",      label: "Mid",       icon: "⚡" },
    { value: "gold-lane",label: "Gold Lane", icon: "🏹" },
    { value: "roamer",   label: "Roamer",    icon: "💊" },
  ],
};

/** Roles genéricos para juegos sin lista específica */
export const DEFAULT_ROLES: GameRoleData[] = [
  { value: "fragger",  label: "Fragger",  icon: "💥" },
  { value: "support",  label: "Support",  icon: "💊" },
  { value: "igl",      label: "IGL",      icon: "📡" },
  { value: "flex",     label: "Flex",     icon: "🔄" },
];

export function getRolesForGame(gameSlug?: string | null): GameRoleData[] {
  if (!gameSlug) return DEFAULT_ROLES;
  return GAME_ROLES[gameSlug] ?? DEFAULT_ROLES;
}

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
