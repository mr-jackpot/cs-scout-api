import { matchStatsCache, playerHistoryCache, playerSeasonsCache } from "./cache";

const FACEIT_API_BASE = "https://open.faceit.com/data/v4";

// Known organizer IDs
export const ORGANIZERS = {
  ESEA: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
} as const;

// All known player_stats keys available in /matches/{matchId}/stats responses.
// Note: keys marked with "?" may not appear in all matches depending on game mode/season.
export const MATCH_STAT_KEYS = {
  // Core
  RESULT: "Result",
  KILLS: "Kills",
  DEATHS: "Deaths",
  ASSISTS: "Assists",
  KD_RATIO: "K/D Ratio",
  KR_RATIO: "K/R Ratio",          // kills per round
  ADR: "ADR",
  DAMAGE: "Damage",               // total damage dealt
  HEADSHOTS: "Headshots",         // raw headshot count
  HEADSHOTS_PCT: "Headshots %",
  MVPS: "MVPs",
  // Multi-kills
  DOUBLE_KILLS: "Double Kills",
  TRIPLE_KILLS: "Triple Kills",
  QUADRO_KILLS: "Quadro Kills",
  PENTA_KILLS: "Penta Kills",
  // Opening / entry (? availability may vary)
  FIRST_KILLS: "First Kills",
  ENTRY_COUNT: "Entry Count",
  ENTRY_WINS: "Entry Wins",
  // Clutch (? availability may vary)
  CLUTCH_KILLS: "Clutch Kills",
  ONE_V_ONE_WINS: "1v1Wins",
  ONE_V_TWO_WINS: "1v2Wins",
  // Weapons
  SNIPER_KILLS: "Sniper Kills",
  // Utility
  UTILITY_DAMAGE: "Utility Damage",
  FLASH_SUCCESSES: "Flash Successes",
} as const;

// Pagination constants
const FACEIT_MAX_LIMIT = 100;
const DEFAULT_MAX_MATCHES = parseInt(process.env.FACEIT_MAX_MATCHES || "200", 10);

// API helpers
const getApiKey = (): string => {
  const apiKey = process.env.FACEIT_API_KEY;
  if (!apiKey) {
    throw new Error("FACEIT_API_KEY environment variable is not set. Please set FACEIT_API_KEY in your environment (for example, in a .env file).");
  }
  return apiKey;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const FACEIT_RETRY_MAX_ATTEMPTS = 3;
const FACEIT_RETRY_BASE_DELAY_MS = 1000;

const faceitFetch = async <T>(endpoint: string, attempt = 1): Promise<T> => {
  const response = await fetch(`${FACEIT_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: "application/json",
    },
  });

  if (response.status === 429) {
    if (attempt >= FACEIT_RETRY_MAX_ATTEMPTS) {
      const error = await response.text();
      throw new Error(`FACEIT API error (429): Rate limit exceeded after ${attempt} attempts: ${error}`);
    }
    const retryAfterHeader = response.headers.get("Retry-After");
    const delayMs = retryAfterHeader
      ? parseInt(retryAfterHeader, 10) * 1000
      : FACEIT_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
    await sleep(delayMs);
    return faceitFetch<T>(endpoint, attempt + 1);
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`FACEIT API error (${response.status}): ${error}`);
  }

  return response.json() as Promise<T>;
};

// Types
interface MatchHistoryItem {
  match_id: string;
  competition_id: string;
  competition_name: string;
  competition_type: string;
  organizer_id: string;
  finished_at: number;
  // Optional fields present in live API responses
  game_id?: string;
  region?: string;
  started_at?: number;
  status?: string;
  faceit_url?: string;
  results?: {
    score: { faction1: number; faction2: number };
    winner: string;
  };
}

interface MatchHistoryResponse {
  items: MatchHistoryItem[];
}

interface PlayerMatchStats {
  player_id: string;
  player_stats: Record<string, string>;
}

interface MatchStatsResponse {
  rounds: Array<{
    round_stats?: {
      Map: string;
      Score: string;
      Winner: string;
      Rounds: string;
      Region: string;
    };
    teams: Array<{
      team_id: string;
      premade: boolean;
      team_stats?: {
        Team: string;
        TeamWin: string;
        FinalScore: string;
        FirstHalfScore: string;
        SecondHalfScore: string;
        Overtimescore: string;
        TeamHeadshots: string;
      };
      players: PlayerMatchStats[];
    }>;
  }>;
}

export interface FaceitPlayer {
  player_id: string;
  nickname: string;
  avatar: string;
  country: string;
  cover_image: string;
  platforms: Record<string, string>;
  games: Record<string, {
    region: string;
    game_player_id: string;
    skill_level: number;
    faceit_elo: number;
    game_player_name: string;
    skill_level_label: string;
    game_profile_id: string;
  }>;
  settings: {
    language: string;
  };
  friends_ids: string[];
  new_steam_id: string;
  steam_id_64: string;
  steam_nickname: string;
  memberships: string[];
  faceit_url: string;
  membership_type: string;
  cover_featured_image: string;
  verified: boolean;
  activated_at: string;
}

export interface CompetitionInfo {
  competition_id: string;
  competition_name: string;
  competition_type: string;
  organizer_id: string;
  match_count: number;
}

export interface PlayerMapStats {
  map: string;
  matches_played: number;
  wins: number;
  win_rate: number;
  kills: number;
  deaths: number;
  assists: number;
  kd_ratio: number;
  adr: number;
  headshot_pct: number;
}

export interface PlayerMatchResult {
  match_id: string;
  map: string;
  started_at: number;
  finished_at: number;
  result: "win" | "loss" | "unknown";
  score: string;
  kills: number;
  deaths: number;
  assists: number;
  kd_ratio: number;
  adr: number;
  headshot_pct: number;
  mvps: number;
}

export interface PlayerSeasonStats {
  player_id: string;
  competition_id: string;
  competition_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  // Kills & damage
  kills: number;
  deaths: number;
  assists: number;
  kd_ratio: number;
  kr_ratio: number;
  adr: number;
  damage: number;
  headshots: number;
  headshot_pct: number;
  mvps: number;
  // Multi-kills
  multi_kills: {
    doubles: number;
    triples: number;
    quads: number;
    aces: number;
  };
  // Opening / entry
  first_kills: number;
  entry_count: number;
  entry_wins: number;
  entry_success_rate: number;
  // Clutch
  clutch_kills: number;
  one_v_one_wins: number;
  one_v_two_wins: number;
  // Weapons & utility
  sniper_kills: number;
  utility_damage: number;
  flash_successes: number;
  // Per-map breakdown
  maps: Record<string, PlayerMapStats>;
}

// Internal API calls
const getPlayerHistoryPaginated = async (
  playerId: string,
  game: string,
  maxMatches: number = DEFAULT_MAX_MATCHES
): Promise<MatchHistoryResponse> => {
  const cacheKey = `history:${playerId}:${game}:${maxMatches}`;
  const cached = playerHistoryCache.get<MatchHistoryResponse>(cacheKey);
  if (cached !== undefined) return cached;

  const allItems: MatchHistoryItem[] = [];
  let offset = 0;

  while (allItems.length < maxMatches) {
    const limit = Math.min(FACEIT_MAX_LIMIT, maxMatches - allItems.length);

    const params = new URLSearchParams({
      game,
      offset: offset.toString(),
      limit: limit.toString(),
    });

    const response = await faceitFetch<MatchHistoryResponse>(
      `/players/${playerId}/history?${params}`
    );

    allItems.push(...response.items);

    // Stop if we've exhausted available data
    if (response.items.length < limit) {
      break;
    }

    offset += limit;
  }

  const result = { items: allItems };
  playerHistoryCache.set(cacheKey, result);
  return result;
};

const getMatchStats = async (matchId: string): Promise<MatchStatsResponse> => {
  const cacheKey = `match:${matchId}`;
  const cached = matchStatsCache.get<MatchStatsResponse>(cacheKey);
  if (cached !== undefined) return cached;
  const result = await faceitFetch<MatchStatsResponse>(`/matches/${matchId}/stats`);
  matchStatsCache.set(cacheKey, result);
  return result;
};

// Public API
export const getPlayerById = async (playerId: string): Promise<FaceitPlayer> => {
  return faceitFetch<FaceitPlayer>(`/players/${playerId}`);
};

export const searchPlayers = async (
  nickname: string,
  game = "cs2",
  limit = 10
): Promise<{
  items: Array<{ player_id: string; nickname: string; avatar: string; country: string }>;
}> => {
  const params = new URLSearchParams({
    nickname,
    game,
    offset: "0",
    limit: limit.toString(),
  });
  return faceitFetch(`/search/players?${params}`);
};

export const getPlayerEseaSeasons = async (
  playerId: string,
  game = "cs2"
): Promise<CompetitionInfo[]> => {
  const cacheKey = `seasons:${playerId}:${game}`;
  const cached = playerSeasonsCache.get<CompetitionInfo[]>(cacheKey);
  if (cached !== undefined) return cached;

  const history = await getPlayerHistoryPaginated(playerId, game);
  const competitions = new Map<string, CompetitionInfo>();

  for (const match of history.items) {
    if (
      match.organizer_id !== ORGANIZERS.ESEA ||
      match.competition_type !== "championship"
    ) {
      continue;
    }

    if (competitions.has(match.competition_id)) {
      competitions.get(match.competition_id)!.match_count++;
    } else {
      competitions.set(match.competition_id, {
        competition_id: match.competition_id,
        competition_name: match.competition_name,
        competition_type: match.competition_type,
        organizer_id: match.organizer_id,
        match_count: 1,
      });
    }
  }

  const result = Array.from(competitions.values());
  playerSeasonsCache.set(cacheKey, result);
  return result;
};

export const getPlayerStatsForCompetition = async (
  playerId: string,
  competitionId: string,
  game = "cs2"
): Promise<PlayerSeasonStats> => {
  const history = await getPlayerHistoryPaginated(playerId, game);

  const competitionMatches = history.items.filter(
    (match) => match.competition_id === competitionId
  );

  const emptyStats: PlayerSeasonStats = {
    player_id: playerId,
    competition_id: competitionId,
    competition_name: "",
    matches_played: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    kd_ratio: 0,
    kr_ratio: 0,
    adr: 0,
    damage: 0,
    headshots: 0,
    headshot_pct: 0,
    mvps: 0,
    multi_kills: { doubles: 0, triples: 0, quads: 0, aces: 0 },
    first_kills: 0,
    entry_count: 0,
    entry_wins: 0,
    entry_success_rate: 0,
    clutch_kills: 0,
    one_v_one_wins: 0,
    one_v_two_wins: 0,
    sniper_kills: 0,
    utility_damage: 0,
    flash_successes: 0,
    maps: {},
  };

  if (competitionMatches.length === 0) {
    return emptyStats;
  }

  const competitionName = competitionMatches[0].competition_name;

  const matchResults = await Promise.all(
    competitionMatches.map(async (match) => {
      try {
        const stats = await getMatchStats(match.match_id);
        const round = stats.rounds[0];
        if (!round) return null;

        const map = round.round_stats?.Map ?? "unknown";

        for (const team of round.teams) {
          const player = team.players.find((p) => p.player_id === playerId);
          if (player) {
            return {
              won: player.player_stats[MATCH_STAT_KEYS.RESULT] === "1",
              map,
              stats: player.player_stats,
            };
          }
        }
        return null;
      } catch {
        return null;
      }
    })
  );

  const validMatches = matchResults.filter(
    (m): m is NonNullable<typeof m> => m !== null
  );

  const sum = (key: string): number =>
    validMatches.reduce((acc, m) => acc + parseFloat(m.stats[key] || "0"), 0);

  const avg = (key: string): number => {
    const values = validMatches.map((m) => parseFloat(m.stats[key] || "0"));
    return values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) /
          100
      : 0;
  };

  const wins = validMatches.filter((m) => m.won).length;
  const losses = validMatches.length - wins;
  const totalKills = sum(MATCH_STAT_KEYS.KILLS);
  const totalHeadshots = sum(MATCH_STAT_KEYS.HEADSHOTS);
  const entryCount = sum(MATCH_STAT_KEYS.ENTRY_COUNT);
  const entryWins = sum(MATCH_STAT_KEYS.ENTRY_WINS);

  // Derive headshot % from raw totals where available; fall back to averaged per-match %
  const headshotPct =
    totalKills > 0 && totalHeadshots > 0
      ? Math.round((totalHeadshots / totalKills) * 100 * 100) / 100
      : avg(MATCH_STAT_KEYS.HEADSHOTS_PCT);

  // Build per-map breakdown
  const mapGroups = new Map<string, typeof validMatches>();
  for (const match of validMatches) {
    if (!mapGroups.has(match.map)) {
      mapGroups.set(match.map, []);
    }
    mapGroups.get(match.map)!.push(match);
  }

  const maps: Record<string, PlayerMapStats> = {};
  for (const [map, mapMatches] of mapGroups) {
    const mapWins = mapMatches.filter((m) => m.won).length;
    const mapSum = (key: string): number =>
      mapMatches.reduce((acc, m) => acc + parseFloat(m.stats[key] || "0"), 0);
    const mapAvg = (key: string): number => {
      const values = mapMatches.map((m) => parseFloat(m.stats[key] || "0"));
      return values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
        : 0;
    };
    const mapKills = mapSum(MATCH_STAT_KEYS.KILLS);
    const mapHeadshots = mapSum(MATCH_STAT_KEYS.HEADSHOTS);
    maps[map] = {
      map,
      matches_played: mapMatches.length,
      wins: mapWins,
      win_rate: Math.round((mapWins / mapMatches.length) * 100),
      kills: mapKills,
      deaths: mapSum(MATCH_STAT_KEYS.DEATHS),
      assists: mapSum(MATCH_STAT_KEYS.ASSISTS),
      kd_ratio: mapAvg(MATCH_STAT_KEYS.KD_RATIO),
      adr: mapAvg(MATCH_STAT_KEYS.ADR),
      headshot_pct:
        mapKills > 0 && mapHeadshots > 0
          ? Math.round((mapHeadshots / mapKills) * 100 * 100) / 100
          : mapAvg(MATCH_STAT_KEYS.HEADSHOTS_PCT),
    };
  }

  return {
    player_id: playerId,
    competition_id: competitionId,
    competition_name: competitionName,
    matches_played: validMatches.length,
    wins,
    losses,
    win_rate:
      validMatches.length > 0
        ? Math.round((wins / validMatches.length) * 100)
        : 0,
    kills: totalKills,
    deaths: sum(MATCH_STAT_KEYS.DEATHS),
    assists: sum(MATCH_STAT_KEYS.ASSISTS),
    kd_ratio: avg(MATCH_STAT_KEYS.KD_RATIO),
    kr_ratio: avg(MATCH_STAT_KEYS.KR_RATIO),
    adr: avg(MATCH_STAT_KEYS.ADR),
    damage: sum(MATCH_STAT_KEYS.DAMAGE),
    headshots: totalHeadshots,
    headshot_pct: headshotPct,
    mvps: sum(MATCH_STAT_KEYS.MVPS),
    multi_kills: {
      doubles: sum(MATCH_STAT_KEYS.DOUBLE_KILLS),
      triples: sum(MATCH_STAT_KEYS.TRIPLE_KILLS),
      quads: sum(MATCH_STAT_KEYS.QUADRO_KILLS),
      aces: sum(MATCH_STAT_KEYS.PENTA_KILLS),
    },
    first_kills: sum(MATCH_STAT_KEYS.FIRST_KILLS),
    entry_count: entryCount,
    entry_wins: entryWins,
    entry_success_rate:
      entryCount > 0 ? Math.round((entryWins / entryCount) * 100) : 0,
    clutch_kills: sum(MATCH_STAT_KEYS.CLUTCH_KILLS),
    one_v_one_wins: sum(MATCH_STAT_KEYS.ONE_V_ONE_WINS),
    one_v_two_wins: sum(MATCH_STAT_KEYS.ONE_V_TWO_WINS),
    sniper_kills: sum(MATCH_STAT_KEYS.SNIPER_KILLS),
    utility_damage: sum(MATCH_STAT_KEYS.UTILITY_DAMAGE),
    flash_successes: sum(MATCH_STAT_KEYS.FLASH_SUCCESSES),
    maps,
  };
};

export const getPlayerMatchesForCompetition = async (
  playerId: string,
  competitionId: string,
  game = "cs2"
): Promise<PlayerMatchResult[]> => {
  const history = await getPlayerHistoryPaginated(playerId, game);

  const competitionMatches = history.items.filter(
    (match) => match.competition_id === competitionId
  );

  const matchResults = await Promise.all(
    competitionMatches.map(async (match) => {
      try {
        const stats = await getMatchStats(match.match_id);
        const round = stats.rounds[0];
        if (!round) return null;

        const map = round.round_stats?.Map ?? "unknown";
        const score = round.round_stats?.Score ?? "";

        for (const team of round.teams) {
          const player = team.players.find((p) => p.player_id === playerId);
          if (player) {
            const resultValue = player.player_stats[MATCH_STAT_KEYS.RESULT];
            const kills = parseFloat(player.player_stats[MATCH_STAT_KEYS.KILLS] || "0");
            const headshots = parseFloat(player.player_stats[MATCH_STAT_KEYS.HEADSHOTS] || "0");
            const headshotPct =
              kills > 0 && headshots > 0
                ? Math.round((headshots / kills) * 100 * 100) / 100
                : parseFloat(player.player_stats[MATCH_STAT_KEYS.HEADSHOTS_PCT] || "0");
            return {
              match_id: match.match_id,
              map,
              started_at: match.started_at ?? 0,
              finished_at: match.finished_at,
              result: (resultValue === "1" ? "win" : resultValue === "0" ? "loss" : "unknown") as PlayerMatchResult["result"],
              score,
              kills,
              deaths: parseFloat(player.player_stats[MATCH_STAT_KEYS.DEATHS] || "0"),
              assists: parseFloat(player.player_stats[MATCH_STAT_KEYS.ASSISTS] || "0"),
              kd_ratio: parseFloat(player.player_stats[MATCH_STAT_KEYS.KD_RATIO] || "0"),
              adr: parseFloat(player.player_stats[MATCH_STAT_KEYS.ADR] || "0"),
              headshot_pct: headshotPct,
              mvps: parseFloat(player.player_stats[MATCH_STAT_KEYS.MVPS] || "0"),
            };
          }
        }
        return null;
      } catch {
        return null;
      }
    })
  );

  return matchResults
    .filter((m): m is PlayerMatchResult => m !== null)
    .sort((a, b) => b.finished_at - a.finished_at);
};
