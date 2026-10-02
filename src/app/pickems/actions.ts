"use server";

import { sql, ensureSchema, getTournamentSettings } from "@/lib/db";

export type PredictionData = {
  bracket: Record<string, number>;
  bonusFastestId: number | null;
  bonusSlowestId: number | null;
  bonusFirstBloodsId: number | null;
  bonusTowerCount: number | null;
  bonusMinionsCount: number | null;
};

const EMPTY_PREDICTION: PredictionData = {
  bracket: {},
  bonusFastestId: null,
  bonusSlowestId: null,
  bonusFirstBloodsId: null,
  bonusTowerCount: null,
  bonusMinionsCount: null,
};

type DbPredictionRow = {
  bracket: Record<string, number>;
  bonus_fastest_id: number | null;
  bonus_slowest_id: number | null;
  bonus_first_bloods_id: number | null;
  bonus_tower_count: number | null;
  bonus_minions_count: number | null;
};

export async function getPrediction(playerId: number): Promise<PredictionData> {
  await ensureSchema();
  const rows = (await sql`
    SELECT bracket, bonus_fastest_id, bonus_slowest_id, bonus_first_bloods_id, bonus_tower_count, bonus_minions_count
    FROM pickems_predictions WHERE player_id = ${playerId}
  `) as DbPredictionRow[];

  const row = rows[0];
  if (!row) return EMPTY_PREDICTION;

  return {
    bracket: row.bracket ?? {},
    bonusFastestId: row.bonus_fastest_id,
    bonusSlowestId: row.bonus_slowest_id,
    bonusFirstBloodsId: row.bonus_first_bloods_id,
    bonusTowerCount: row.bonus_tower_count,
    bonusMinionsCount: row.bonus_minions_count,
  };
}

export async function upsertPrediction(
  playerId: number,
  data: PredictionData
): Promise<{ ok: boolean; error?: string }> {
  await ensureSchema();

  const settings = await getTournamentSettings();
  if (settings.pickemsLocked) {
    return { ok: false, error: "Los Pickems están bloqueados, ya no se pueden editar predicciones" };
  }

  await sql`
    INSERT INTO pickems_predictions (
      player_id, bracket, bonus_fastest_id, bonus_slowest_id, bonus_first_bloods_id,
      bonus_tower_count, bonus_minions_count, updated_at
    )
    VALUES (
      ${playerId}, ${JSON.stringify(data.bracket)}, ${data.bonusFastestId}, ${data.bonusSlowestId},
      ${data.bonusFirstBloodsId}, ${data.bonusTowerCount}, ${data.bonusMinionsCount}, now()
    )
    ON CONFLICT (player_id) DO UPDATE SET
      bracket = EXCLUDED.bracket,
      bonus_fastest_id = EXCLUDED.bonus_fastest_id,
      bonus_slowest_id = EXCLUDED.bonus_slowest_id,
      bonus_first_bloods_id = EXCLUDED.bonus_first_bloods_id,
      bonus_tower_count = EXCLUDED.bonus_tower_count,
      bonus_minions_count = EXCLUDED.bonus_minions_count,
      updated_at = now()
  `;

  return { ok: true };
}
