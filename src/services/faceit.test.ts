import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  searchPlayers,
  getPlayerEseaSeasons,
  getPlayerStatsForCompetition,
  getPlayerMatchesForCompetition,
  ORGANIZERS,
} from "./faceit";
import { matchStatsCache, playerHistoryCache, playerSeasonsCache } from "./cache";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Set up env
beforeEach(() => {
  process.env.FACEIT_API_KEY = "test-api-key";
  mockFetch.mockReset();
  matchStatsCache.flushAll();
  playerHistoryCache.flushAll();
  playerSeasonsCache.flushAll();
});

afterEach(() => {
  delete process.env.FACEIT_API_KEY;
});

describe("searchPlayers", () => {
  it("should search for players by nickname", async () => {
    const mockResponse = {
      items: [
        {
          player_id: "123",
          nickname: "TestPlayer",
          avatar: "https://example.com/avatar.jpg",
          country: "US",
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await searchPlayers("TestPlayer");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://open.faceit.com/data/v4/search/players?nickname=TestPlayer&game=cs2&offset=0&limit=10",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer test-api-key",
          Accept: "application/json",
        },
      })
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].nickname).toBe("TestPlayer");
  });

  it("should throw error when API key is missing", async () => {
    delete process.env.FACEIT_API_KEY;

    await expect(searchPlayers("TestPlayer")).rejects.toThrow(
        "FACEIT_API_KEY environment variable is not set. Please set FACEIT_API_KEY in your environment (for example, in a .env file)."
    );
  });

  it("should throw error on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    });

    await expect(searchPlayers("TestPlayer")).rejects.toThrow(
      "FACEIT API error (401): Unauthorized"
    );
  });
});

describe("getPlayerEseaSeasons", () => {
  it("should return only ESEA championship competitions", async () => {
    const mockHistory = {
      items: [
        {
          match_id: "match-1",
          competition_id: "esea-comp-1",
          competition_name: "ESEA S55 Open",
          competition_type: "championship",
          organizer_id: ORGANIZERS.ESEA,
          finished_at: 1700000000,
        },
        {
          match_id: "match-2",
          competition_id: "esea-comp-1",
          competition_name: "ESEA S55 Open",
          competition_type: "championship",
          organizer_id: ORGANIZERS.ESEA,
          finished_at: 1700000001,
        },
        {
          match_id: "match-3",
          competition_id: "matchmaking-1",
          competition_name: "Europe 5v5 Queue",
          competition_type: "matchmaking",
          organizer_id: "other-org",
          finished_at: 1700000002,
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHistory),
    });

    const result = await getPlayerEseaSeasons("player-123");

    expect(result).toHaveLength(1);
    expect(result[0].competition_name).toBe("ESEA S55 Open");
    expect(result[0].match_count).toBe(2);
  });

  it("should return empty array when no ESEA matches", async () => {
    const mockHistory = {
      items: [
        {
          match_id: "match-1",
          competition_id: "matchmaking-1",
          competition_name: "Europe 5v5 Queue",
          competition_type: "matchmaking",
          organizer_id: "other-org",
          finished_at: 1700000000,
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHistory),
    });

    const result = await getPlayerEseaSeasons("player-123");

    expect(result).toHaveLength(0);
  });
});

describe("getPlayerStatsForCompetition", () => {
  it("should aggregate stats from multiple matches", async () => {
    const mockHistory = {
      items: [
        {
          match_id: "match-1",
          competition_id: "comp-1",
          competition_name: "ESEA S55",
          competition_type: "championship",
          organizer_id: ORGANIZERS.ESEA,
          finished_at: 1700000000,
        },
        {
          match_id: "match-2",
          competition_id: "comp-1",
          competition_name: "ESEA S55",
          competition_type: "championship",
          organizer_id: ORGANIZERS.ESEA,
          finished_at: 1700000001,
        },
      ],
    };

    const mockMatchStats1 = {
      rounds: [
        {
          round_stats: { Map: "de_mirage", Score: "16 / 10", Winner: "team1", Rounds: "26", Region: "EU" },
          teams: [
            {
              players: [
                {
                  player_id: "player-123",
                  player_stats: {
                    Result: "1",
                    Kills: "20",
                    Deaths: "10",
                    Assists: "5",
                    "K/D Ratio": "2.0",
                    "K/R Ratio": "0.77",
                    ADR: "100",
                    Damage: "2600",
                    Headshots: "10",
                    "Headshots %": "50",
                    MVPs: "3",
                    "Double Kills": "4",
                    "Triple Kills": "2",
                    "Quadro Kills": "1",
                    "Penta Kills": "0",
                    "First Kills": "2",
                    "Entry Count": "3",
                    "Entry Wins": "2",
                    "Clutch Kills": "4",
                    "1v1Wins": "2",
                    "1v2Wins": "1",
                    "Sniper Kills": "3",
                    "Utility Damage": "50",
                    "Flash Successes": "4",
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const mockMatchStats2 = {
      rounds: [
        {
          round_stats: { Map: "de_inferno", Score: "14 / 16", Winner: "team2", Rounds: "30", Region: "EU" },
          teams: [
            {
              players: [
                {
                  player_id: "player-123",
                  player_stats: {
                    Result: "0",
                    Kills: "15",
                    Deaths: "15",
                    Assists: "3",
                    "K/D Ratio": "1.0",
                    "K/R Ratio": "0.5",
                    ADR: "80",
                    Damage: "2400",
                    Headshots: "5",
                    "Headshots %": "33",
                    MVPs: "1",
                    "Double Kills": "2",
                    "Triple Kills": "1",
                    "Quadro Kills": "0",
                    "Penta Kills": "0",
                    "First Kills": "1",
                    "Entry Count": "2",
                    "Entry Wins": "1",
                    "Clutch Kills": "2",
                    "1v1Wins": "1",
                    "1v2Wins": "0",
                    "Sniper Kills": "1",
                    "Utility Damage": "30",
                    "Flash Successes": "2",
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMatchStats1),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMatchStats2),
      });

    const result = await getPlayerStatsForCompetition("player-123", "comp-1");

    expect(result.matches_played).toBe(2);
    expect(result.wins).toBe(1);
    expect(result.losses).toBe(1);
    expect(result.win_rate).toBe(50);
    expect(result.kills).toBe(35);
    expect(result.deaths).toBe(25);
    expect(result.assists).toBe(8);
    expect(result.kd_ratio).toBe(1.5);
    expect(result.kr_ratio).toBe(0.64);
    expect(result.adr).toBe(90);
    expect(result.damage).toBe(5000);
    // headshot_pct derived from totals: 15 headshots / 35 kills = 42.86%
    expect(result.headshots).toBe(15);
    expect(result.headshot_pct).toBe(42.86);
    expect(result.multi_kills.doubles).toBe(6);
    expect(result.multi_kills.triples).toBe(3);
    expect(result.multi_kills.quads).toBe(1);
    expect(result.multi_kills.aces).toBe(0);
    expect(result.first_kills).toBe(3);
    expect(result.entry_count).toBe(5);
    expect(result.entry_wins).toBe(3);
    expect(result.entry_success_rate).toBe(60);
    expect(result.clutch_kills).toBe(6);
    expect(result.one_v_one_wins).toBe(3);
    expect(result.one_v_two_wins).toBe(1);
    expect(result.sniper_kills).toBe(4);
    expect(result.utility_damage).toBe(80);
    expect(result.flash_successes).toBe(6);
    // per-map breakdown
    expect(Object.keys(result.maps)).toHaveLength(2);
    expect(result.maps["de_mirage"].matches_played).toBe(1);
    expect(result.maps["de_mirage"].wins).toBe(1);
    expect(result.maps["de_inferno"].matches_played).toBe(1);
    expect(result.maps["de_inferno"].wins).toBe(0);
  });

  it("should return empty stats when no matches found", async () => {
    const mockHistory = { items: [] };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHistory),
    });

    const result = await getPlayerStatsForCompetition("player-123", "comp-1");

    expect(result.matches_played).toBe(0);
    expect(result.wins).toBe(0);
    expect(result.kills).toBe(0);
    expect(result.kr_ratio).toBe(0);
    expect(result.damage).toBe(0);
    expect(result.entry_count).toBe(0);
    expect(result.entry_success_rate).toBe(0);
    expect(result.maps).toEqual({});
  });

  it("should handle match stats fetch failures gracefully", async () => {
    const mockHistory = {
      items: [
        {
          match_id: "match-1",
          competition_id: "comp-1",
          competition_name: "ESEA S55",
          competition_type: "championship",
          organizer_id: ORGANIZERS.ESEA,
          finished_at: 1700000000,
        },
      ],
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not found"),
      });

    const result = await getPlayerStatsForCompetition("player-123", "comp-1");

    // Should not throw, just return 0 matches
    expect(result.matches_played).toBe(0);
  });
});

describe("getPlayerMatchesForCompetition", () => {
  it("should return match results sorted newest first", async () => {
    const mockHistory = {
      items: [
        {
          match_id: "match-1",
          competition_id: "comp-1",
          competition_name: "ESEA S55",
          competition_type: "championship",
          organizer_id: ORGANIZERS.ESEA,
          started_at: 1700000000,
          finished_at: 1700003600,
        },
        {
          match_id: "match-2",
          competition_id: "comp-1",
          competition_name: "ESEA S55",
          competition_type: "championship",
          organizer_id: ORGANIZERS.ESEA,
          started_at: 1700100000,
          finished_at: 1700103600,
        },
      ],
    };

    const mockStats1 = {
      rounds: [{
        round_stats: { Map: "de_mirage", Score: "16 / 10", Winner: "team1", Rounds: "26", Region: "EU" },
        teams: [{
          players: [{
            player_id: "player-123",
            player_stats: {
              Result: "1", Kills: "22", Deaths: "14", Assists: "7",
              "K/D Ratio": "1.57", ADR: "91.3", Headshots: "12",
              "Headshots %": "54.55", MVPs: "3",
            },
          }],
        }],
      }],
    };

    const mockStats2 = {
      rounds: [{
        round_stats: { Map: "de_inferno", Score: "12 / 16", Winner: "team2", Rounds: "28", Region: "EU" },
        teams: [{
          players: [{
            player_id: "player-123",
            player_stats: {
              Result: "0", Kills: "15", Deaths: "18", Assists: "4",
              "K/D Ratio": "0.83", ADR: "72.1", Headshots: "6",
              "Headshots %": "40", MVPs: "1",
            },
          }],
        }],
      }],
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockHistory) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStats1) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStats2) });

    const result = await getPlayerMatchesForCompetition("player-123", "comp-1");

    // Sorted newest first (match-2 has higher finished_at)
    expect(result).toHaveLength(2);
    expect(result[0].match_id).toBe("match-2");
    expect(result[0].map).toBe("de_inferno");
    expect(result[0].result).toBe("loss");
    expect(result[1].match_id).toBe("match-1");
    expect(result[1].result).toBe("win");
    expect(result[1].score).toBe("16 / 10");
    // headshot_pct derived from raw totals: 12 / 22 = 54.55%
    expect(result[1].headshot_pct).toBe(54.55);
  });

  it("should return empty array when no matches for competition", async () => {
    const mockHistory = {
      items: [
        {
          match_id: "match-1",
          competition_id: "other-comp",
          competition_name: "Other",
          competition_type: "championship",
          organizer_id: ORGANIZERS.ESEA,
          finished_at: 1700000000,
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockHistory) });

    const result = await getPlayerMatchesForCompetition("player-123", "comp-1");
    expect(result).toHaveLength(0);
  });

  it("should use 'unknown' result when Result stat is missing", async () => {
    const mockHistory = {
      items: [{
        match_id: "match-1",
        competition_id: "comp-1",
        competition_name: "ESEA S55",
        competition_type: "championship",
        organizer_id: ORGANIZERS.ESEA,
        finished_at: 1700000000,
      }],
    };
    const mockStats = {
      rounds: [{
        round_stats: { Map: "de_nuke", Score: "", Winner: "", Rounds: "0", Region: "EU" },
        teams: [{ players: [{ player_id: "player-123", player_stats: {} }] }],
      }],
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockHistory) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStats) });

    const result = await getPlayerMatchesForCompetition("player-123", "comp-1");
    expect(result[0].result).toBe("unknown");
  });

  it("should silently skip matches where stats fetch fails", async () => {
    const mockHistory = {
      items: [
        {
          match_id: "match-1",
          competition_id: "comp-1",
          competition_name: "ESEA S55",
          competition_type: "championship",
          organizer_id: ORGANIZERS.ESEA,
          finished_at: 1700000000,
        },
        {
          match_id: "match-2",
          competition_id: "comp-1",
          competition_name: "ESEA S55",
          competition_type: "championship",
          organizer_id: ORGANIZERS.ESEA,
          finished_at: 1700100000,
        },
      ],
    };
    const mockStats = {
      rounds: [{
        round_stats: { Map: "de_mirage", Score: "16 / 10", Winner: "team1", Rounds: "26", Region: "EU" },
        teams: [{ players: [{ player_id: "player-123", player_stats: { Result: "1", Kills: "20", Deaths: "10", Assists: "5", "K/D Ratio": "2.0", ADR: "100", "Headshots %": "50", MVPs: "3" } }] }],
      }],
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockHistory) })
      .mockResolvedValueOnce({ ok: false, status: 404, text: () => Promise.resolve("Not found") })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStats) });

    const result = await getPlayerMatchesForCompetition("player-123", "comp-1");
    expect(result).toHaveLength(1);
  });
});

describe("faceitFetch retry on 429", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("should retry on 429 and succeed on second attempt", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: { get: () => null },
        text: () => Promise.resolve("Too Many Requests"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

    const promise = searchPlayers("TestPlayer");
    await vi.runAllTimersAsync();
    await promise;

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should throw after max attempts on persistent 429", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => null },
      text: () => Promise.resolve("Too Many Requests"),
    });

    // Attach the rejection handler before advancing timers to avoid unhandled rejection warnings
    const assertion = expect(searchPlayers("TestPlayer")).rejects.toThrow("Rate limit exceeded after 3 attempts");
    await vi.runAllTimersAsync();
    await assertion;

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
