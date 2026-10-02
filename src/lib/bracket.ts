import { sql, ensureSchema } from "./db";
import { CHAMPIONS } from "./champions";
import {
  MATCHES_PER_ROUND,
  ROUNDS,
  type Round,
  nextSlot,
  pairOctavos,
  shuffled,
} from "./bracketShape";
import { PLAYERS } from "./players-data";

export type WinCondition = "primera_sangre" | "minions" | "torre";

export type MatchRow = {
  id: number;
  round: Round;
  position: number;
  player1Id: number | null;
  player2Id: number | null;
  winnerId: number | null;
  champion: string | null;
  durationSeconds: number | null;
  winCondition: WinCondition | null;
};

export type MatchResultInput = {
  durationSeconds: number;
  winCondition: WinCondition;
};

type DbMatchRow = {
  id: number;
  round: Round;
  position: number;
  player1_id: number | null;
  player2_id: number | null;
  winner_id: number | null;
  champion: string | null;
  duration_seconds: number | null;
  win_condition: WinCondition | null;
};

function mapRow(row: DbMatchRow): MatchRow {
  return {
    id: row.id,
    round: row.round,
    position: row.position,
    player1Id: row.player1_id,
    player2Id: row.player2_id,
    winnerId: row.winner_id,
    champion: row.champion,
    durationSeconds: row.duration_seconds,
    winCondition: row.win_condition,
  };
}

export async function getBracket(): Promise<MatchRow[]> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM matches`) as DbMatchRow[];
  return rows
    .map(mapRow)
    .sort((a, b) => ROUNDS.indexOf(a.round) - ROUNDS.indexOf(b.round) || a.position - b.position);
}

/** Wipes the bracket, predictions and lock flag without generating a new
 * pairing — leaves the tournament empty, ready for a fresh "Generar Bracket". */
export async function clearTournament(): Promise<void> {
  await ensureSchema();

  await sql`TRUNCATE matches`;
  await sql`TRUNCATE pickems_predictions`;
  await sql`UPDATE tournament_settings SET pickems_locked = false WHERE id = 1`;
}

/** Resets the tournament and returns the freshly drawn octavos pairs (as
 * player id tuples, in position order) so the admin UI can reveal them one
 * by one before showing the full bracket. */
export async function resetTournament(): Promise<[number, number][]> {
  await clearTournament();

  const shuffledIds = shuffled(PLAYERS.map((p) => p.id));
  const pairs = pairOctavos(shuffledIds);

  for (let position = 0; position < pairs.length; position++) {
    const [player1Id, player2Id] = pairs[position];
    await sql`
      INSERT INTO matches (round, position, player1_id, player2_id)
      VALUES ('octavos', ${position}, ${player1Id}, ${player2Id})
    `;
  }

  for (const round of ROUNDS.slice(1)) {
    for (let position = 0; position < MATCHES_PER_ROUND[round]; position++) {
      await sql`
        INSERT INTO matches (round, position)
        VALUES (${round}, ${position})
      `;
    }
  }

  return pairs;
}

async function getMatchByRoundPosition(round: Round, position: number): Promise<MatchRow | null> {
  const rows = (await sql`
    SELECT * FROM matches WHERE round = ${round} AND position = ${position}
  `) as DbMatchRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function setMatchWinner(
  matchId: number,
  winnerId: number | null,
  result?: MatchResultInput
): Promise<void> {
  await ensureSchema();

  const rows = (await sql`SELECT * FROM matches WHERE id = ${matchId}`) as DbMatchRow[];
  const match = rows[0] ? mapRow(rows[0]) : null;
  if (!match) throw new Error("Enfrentamiento no encontrado");

  if (winnerId !== null && winnerId !== match.player1Id && winnerId !== match.player2Id) {
    throw new Error("El ganador debe ser uno de los dos jugadores del enfrentamiento");
  }

  if (winnerId !== null && (!result || !Number.isFinite(result.durationSeconds) || result.durationSeconds <= 0)) {
    throw new Error("Falta la duración de la partida");
  }

  const advance = nextSlot(match.round, match.position);

  if (advance) {
    const nextMatch = await getMatchByRoundPosition(advance.slot.round, advance.slot.position);
    if (nextMatch && nextMatch.winnerId !== null) {
      throw new Error(
        "Primero deshaz el resultado del siguiente enfrentamiento antes de cambiar este"
      );
    }
  }

  await sql`
    UPDATE matches SET
      winner_id = ${winnerId},
      duration_seconds = ${winnerId !== null ? result!.durationSeconds : null},
      win_condition = ${winnerId !== null ? result!.winCondition : null}
    WHERE id = ${matchId}
  `;

  if (advance) {
    if (advance.playerSlot === "player1Id") {
      await sql`
        UPDATE matches SET player1_id = ${winnerId}
        WHERE round = ${advance.slot.round} AND position = ${advance.slot.position}
      `;
    } else {
      await sql`
        UPDATE matches SET player2_id = ${winnerId}
        WHERE round = ${advance.slot.round} AND position = ${advance.slot.position}
      `;
    }
  }
}

export async function rerollChampion(matchId: number): Promise<string> {
  await ensureSchema();
  const champion = CHAMPIONS[Math.floor(Math.random() * CHAMPIONS.length)];
  await sql`UPDATE matches SET champion = ${champion} WHERE id = ${matchId}`;
  return champion;
}
