import { neon } from "@neondatabase/serverless";
import { PLAYERS } from "./players-data";

export const sql = neon(process.env.DATABASE_URL!);

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = initSchema().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS players (
      id         SMALLINT PRIMARY KEY,
      name       TEXT NOT NULL,
      photo_url  TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS matches (
      id          SERIAL PRIMARY KEY,
      round       TEXT NOT NULL CHECK (round IN ('octavos','cuartos','semis','final')),
      position    SMALLINT NOT NULL,
      player1_id  SMALLINT REFERENCES players(id),
      player2_id  SMALLINT REFERENCES players(id),
      winner_id   SMALLINT REFERENCES players(id),
      champion    TEXT,
      UNIQUE (round, position)
    )
  `;

  // Added after the initial schema: how long the match took and how it was
  // won, so the bonus-question answers can be derived automatically instead
  // of the admin typing them in by hand.
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS duration_seconds SMALLINT`;
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS win_condition TEXT CHECK (win_condition IN ('primera_sangre','minions','torre'))`;

  await sql`
    CREATE TABLE IF NOT EXISTS pickems_predictions (
      player_id              SMALLINT PRIMARY KEY REFERENCES players(id),
      bracket                JSONB NOT NULL DEFAULT '{}',
      bonus_fastest_id       SMALLINT REFERENCES players(id),
      bonus_slowest_id       SMALLINT REFERENCES players(id),
      bonus_first_bloods_id  SMALLINT REFERENCES players(id),
      bonus_tower_count      SMALLINT,
      bonus_minions_count    SMALLINT,
      updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Bonus-question "truth" used to live in its own table, manually filled in
  // by the admin. It's now derived straight from matches.duration_seconds /
  // win_condition (see lib/scoring.ts), so the old table is no longer needed.
  await sql`DROP TABLE IF EXISTS bonus_answers`;

  await sql`
    CREATE TABLE IF NOT EXISTS tournament_settings (
      id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      pickems_locked  BOOLEAN NOT NULL DEFAULT false
    )
  `;

  await sql`INSERT INTO tournament_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;

  for (const player of PLAYERS) {
    await sql`
      INSERT INTO players (id, name, photo_url)
      VALUES (${player.id}, ${player.name}, ${player.photoUrl})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, photo_url = EXCLUDED.photo_url
    `;
  }
}

export type TournamentSettings = { pickemsLocked: boolean };

export async function getTournamentSettings(): Promise<TournamentSettings> {
  await ensureSchema();
  const rows = (await sql`SELECT pickems_locked FROM tournament_settings WHERE id = 1`) as {
    pickems_locked: boolean;
  }[];
  return { pickemsLocked: rows[0]?.pickems_locked ?? false };
}
