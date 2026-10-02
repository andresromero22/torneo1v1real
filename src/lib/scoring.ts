import { sql, ensureSchema } from "./db";
import { getBracket, type MatchRow } from "./bracket";
import { matchKey } from "./bracketShape";
import { PLAYERS } from "./players-data";

export type LeaderboardEntry = {
  playerId: number;
  playerName: string;
  photoUrl: string;
  score: number;
};

export type BonusStats = {
  fastestId: number | null;
  slowestId: number | null;
  firstBloodsId: number | null;
  towerCount: number;
  minionsCount: number;
};

type DbPredictionRow = {
  player_id: number;
  bracket: Record<string, number>;
  bonus_fastest_id: number | null;
  bonus_slowest_id: number | null;
  bonus_first_bloods_id: number | null;
  bonus_tower_count: number | null;
  bonus_minions_count: number | null;
};

const POINTS_PER_CORRECT = 10;

/** Derives the bonus-question "truth" straight from recorded match results
 * (duration + win condition) instead of requiring the admin to type it in
 * separately — the fastest/slowest kill are the loser of the shortest/
 * longest match, first-bloods is whoever won the most matches that way. */
export function deriveBonusStats(matches: MatchRow[]): BonusStats {
  const decided = matches.filter(
    (m) => m.winnerId !== null && m.durationSeconds !== null && m.winCondition !== null
  );

  let fastestId: number | null = null;
  let slowestId: number | null = null;
  let minDuration = Infinity;
  let maxDuration = -Infinity;
  let towerCount = 0;
  let minionsCount = 0;
  const firstBloodCounts = new Map<number, number>();

  for (const m of decided) {
    const loserId = m.winnerId === m.player1Id ? m.player2Id : m.player1Id;

    if (m.durationSeconds! < minDuration) {
      minDuration = m.durationSeconds!;
      fastestId = loserId;
    }
    if (m.durationSeconds! > maxDuration) {
      maxDuration = m.durationSeconds!;
      slowestId = loserId;
    }

    if (m.winCondition === "torre") towerCount++;
    if (m.winCondition === "minions") minionsCount++;
    if (m.winCondition === "primera_sangre") {
      firstBloodCounts.set(m.winnerId!, (firstBloodCounts.get(m.winnerId!) ?? 0) + 1);
    }
  }

  let firstBloodsId: number | null = null;
  let maxFirstBloods = 0;
  for (const [id, count] of firstBloodCounts) {
    if (count > maxFirstBloods) {
      maxFirstBloods = count;
      firstBloodsId = id;
    }
  }

  return { fastestId, slowestId, firstBloodsId, towerCount, minionsCount };
}

export async function computeLeaderboard(): Promise<LeaderboardEntry[]> {
  await ensureSchema();

  const [matches, predictionRows] = await Promise.all([
    getBracket(),
    sql`SELECT * FROM pickems_predictions`,
  ]);

  const rows = predictionRows as unknown as DbPredictionRow[];
  const bonusStats = deriveBonusStats(matches);
  const matchByKey = new Map(matches.map((m) => [matchKey(m.round, m.position), m]));
  const playersById = new Map(PLAYERS.map((p) => [p.id, p]));

  return rows
    .map((row) => {
      let score = 0;

      for (const [key, pickedId] of Object.entries(row.bracket ?? {})) {
        const match = matchByKey.get(key);
        if (match && match.winnerId !== null && match.winnerId === pickedId) {
          score += POINTS_PER_CORRECT;
        }
      }

      if (bonusStats.fastestId !== null && row.bonus_fastest_id === bonusStats.fastestId) {
        score += POINTS_PER_CORRECT;
      }
      if (bonusStats.slowestId !== null && row.bonus_slowest_id === bonusStats.slowestId) {
        score += POINTS_PER_CORRECT;
      }
      if (bonusStats.firstBloodsId !== null && row.bonus_first_bloods_id === bonusStats.firstBloodsId) {
        score += POINTS_PER_CORRECT;
      }
      if (row.bonus_tower_count === bonusStats.towerCount) {
        score += POINTS_PER_CORRECT;
      }
      if (row.bonus_minions_count === bonusStats.minionsCount) {
        score += POINTS_PER_CORRECT;
      }

      const player = playersById.get(row.player_id);
      return {
        playerId: row.player_id,
        playerName: player?.name ?? `Jugador ${row.player_id}`,
        photoUrl: player?.photoUrl ?? "",
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}
