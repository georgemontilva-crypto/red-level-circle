/**
 * riotApi.ts
 *
 * Servicio para interactuar con la API de Riot Games.
 * Soporta League of Legends y Valorant.
 *
 * Documentación: https://developer.riotgames.com/apis
 */

const RIOT_API_KEY = process.env.RIOT_API_KEY ?? "";

// ─── Routing ──────────────────────────────────────────────────────────────────

/** Regional routing values (for account-v1 and match-v5) */
const REGIONAL_ROUTES: Record<string, string> = {
  na1: "americas",
  la1: "americas",
  la2: "americas",
  br1: "americas",
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
  ph2: "sea",
  sg2: "sea",
  th2: "sea",
  tw2: "sea",
  vn2: "sea",
};

export const REGION_LABELS: Record<string, string> = {
  la1: "LAN",
  la2: "LAS",
  na1: "NA",
  br1: "BR",
  euw1: "EUW",
  eun1: "EUNE",
  kr: "KR",
  jp1: "JP",
  oc1: "OCE",
  tr1: "TR",
  ru: "RU",
};

function getRegionalRoute(region: string): string {
  return REGIONAL_ROUTES[region.toLowerCase()] ?? "americas";
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function riotFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Riot API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface SummonerData {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface LeagueEntry {
  leagueId: string;
  summonerId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
  miniSeries?: {
    losses: number;
    progress: string;
    target: number;
    wins: number;
  };
}

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  summonerId: string;
}

export interface MatchInfo {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    gameType: string;
    participants: MatchParticipant[];
  };
}

export interface MatchParticipant {
  puuid: string;
  summonerName: string;
  championName: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  totalDamageDealtToChampions: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  teamPosition: string;
  individualPosition: string;
}

// ─── Account API (account-v1) ─────────────────────────────────────────────────

/**
 * Busca una cuenta de Riot por gameName y tagLine.
 * Usa el routing regional basado en la región del jugador.
 */
export async function getRiotAccountByRiotId(
  gameName: string,
  tagLine: string,
  region: string = "la1"
): Promise<RiotAccount> {
  const route = getRegionalRoute(region);
  const encodedName = encodeURIComponent(gameName);
  const encodedTag = encodeURIComponent(tagLine);
  return riotFetch<RiotAccount>(
    `https://${route}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`
  );
}

/**
 * Obtiene una cuenta de Riot por PUUID.
 */
export async function getRiotAccountByPuuid(
  puuid: string,
  region: string = "la1"
): Promise<RiotAccount> {
  const route = getRegionalRoute(region);
  return riotFetch<RiotAccount>(
    `https://${route}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`
  );
}

// ─── Summoner API (summoner-v4) ───────────────────────────────────────────────

/**
 * Obtiene datos del invocador por PUUID.
 */
export async function getSummonerByPuuid(
  puuid: string,
  region: string = "la1"
): Promise<SummonerData> {
  return riotFetch<SummonerData>(
    `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`
  );
}

// ─── League API (league-v4) ───────────────────────────────────────────────────

/**
 * Obtiene las entradas de liga (ranked) de un invocador.
 */
export async function getLeagueEntriesBySummonerId(
  summonerId: string,
  region: string = "la1"
): Promise<LeagueEntry[]> {
  return riotFetch<LeagueEntry[]>(
    `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`
  );
}

// ─── Champion Mastery API (champion-mastery-v4) ───────────────────────────────

/**
 * Obtiene el top N de campeones con más maestría.
 */
export async function getTopChampionMasteries(
  puuid: string,
  region: string = "la1",
  count: number = 5
): Promise<ChampionMastery[]> {
  return riotFetch<ChampionMastery[]>(
    `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`
  );
}

// ─── Match API (match-v5) ─────────────────────────────────────────────────────

/**
 * Obtiene los IDs de las últimas partidas de un jugador.
 */
export async function getMatchIds(
  puuid: string,
  region: string = "la1",
  count: number = 10,
  queueId?: number
): Promise<string[]> {
  const route = getRegionalRoute(region);
  const queueParam = queueId ? `&queue=${queueId}` : "";
  return riotFetch<string[]>(
    `https://${route}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}${queueParam}`
  );
}

/**
 * Obtiene los detalles de una partida por ID.
 */
export async function getMatchById(
  matchId: string,
  region: string = "la1"
): Promise<MatchInfo> {
  const route = getRegionalRoute(region);
  return riotFetch<MatchInfo>(
    `https://${route}.api.riotgames.com/lol/match/v5/matches/${matchId}`
  );
}

// ─── Composite: Full Player Profile ──────────────────────────────────────────

export interface RiotPlayerProfile {
  account: RiotAccount;
  summoner: SummonerData;
  rankedSolo: LeagueEntry | null;
  rankedFlex: LeagueEntry | null;
  topChampions: ChampionMastery[];
  recentMatches: ProcessedMatch[];
  profileIconUrl: string;
}

export interface ProcessedMatch {
  matchId: string;
  championName: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  gameMode: string;
  gameDuration: number;
  gameCreation: number;
  cs: number;
  damage: number;
  teamPosition: string;
  items: number[];
}

/**
 * Obtiene el perfil completo de un jugador de LoL.
 * Incluye rango, campeones y partidas recientes.
 */
export async function getFullLolProfile(
  puuid: string,
  summonerId: string,
  region: string = "la1"
): Promise<Omit<RiotPlayerProfile, "account">> {
  const [summoner, leagueEntries, topChampions, matchIds] = await Promise.all([
    getSummonerByPuuid(puuid, region),
    getLeagueEntriesBySummonerId(summonerId, region),
    getTopChampionMasteries(puuid, region, 5),
    getMatchIds(puuid, region, 5),
  ]);

  const rankedSolo =
    leagueEntries.find((e) => e.queueType === "RANKED_SOLO_5x5") ?? null;
  const rankedFlex =
    leagueEntries.find((e) => e.queueType === "RANKED_FLEX_SR") ?? null;

  // Fetch recent matches (limit to 5, handle errors gracefully)
  const matchDetails = await Promise.allSettled(
    matchIds.slice(0, 5).map((id) => getMatchById(id, region))
  );

  const recentMatches: ProcessedMatch[] = matchDetails
    .filter((r): r is PromiseFulfilledResult<MatchInfo> => r.status === "fulfilled")
    .map((r) => {
      const match = r.value;
      const participant = match.info.participants.find((p) => p.puuid === puuid);
      if (!participant) return null;
      return {
        matchId: match.metadata.matchId,
        championName: participant.championName,
        championId: participant.championId,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        win: participant.win,
        gameMode: match.info.gameMode,
        gameDuration: match.info.gameDuration,
        gameCreation: match.info.gameCreation,
        cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
        damage: participant.totalDamageDealtToChampions,
        teamPosition: participant.teamPosition || participant.individualPosition,
        items: [
          participant.item0,
          participant.item1,
          participant.item2,
          participant.item3,
          participant.item4,
          participant.item5,
          participant.item6,
        ],
      } as ProcessedMatch;
    })
    .filter((m): m is ProcessedMatch => m !== null);

  const profileIconUrl = `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${summoner.profileIconId}.png`;

  return {
    summoner,
    rankedSolo,
    rankedFlex,
    topChampions,
    recentMatches,
    profileIconUrl,
  };
}

// ─── Tier helpers ─────────────────────────────────────────────────────────────

export const TIER_ORDER = [
  "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
  "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER",
];

export const TIER_COLORS: Record<string, string> = {
  IRON: "#8B8B8B",
  BRONZE: "#CD7F32",
  SILVER: "#C0C0C0",
  GOLD: "#FFD700",
  PLATINUM: "#00B4D8",
  EMERALD: "#50C878",
  DIAMOND: "#B9F2FF",
  MASTER: "#9B59B6",
  GRANDMASTER: "#E74C3C",
  CHALLENGER: "#F1C40F",
};

export function formatRank(entry: LeagueEntry | null): string {
  if (!entry) return "Sin clasificar";
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(entry.tier)) {
    return `${entry.tier} ${entry.leaguePoints} LP`;
  }
  return `${entry.tier} ${entry.rank} — ${entry.leaguePoints} LP`;
}

export function getWinRate(entry: LeagueEntry | null): number {
  if (!entry) return 0;
  const total = entry.wins + entry.losses;
  if (total === 0) return 0;
  return Math.round((entry.wins / total) * 100);
}
