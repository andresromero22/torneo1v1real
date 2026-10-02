"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BracketTree, {
  FinalMatchup,
  PlayerRow,
  type PlayerLite,
  type TreeSlot,
} from "@/components/BracketTree";
import { MATCHES_PER_ROUND, ROUNDS, matchKey, nextSlot, type Round } from "@/lib/bracketShape";
import type { MatchRow } from "@/lib/bracket";
import type { PlayerData } from "@/lib/players-data";
import { getPrediction, upsertPrediction } from "./actions";

const AUTOSAVE_DELAY_MS = 10000;

type BonusState = {
  fastestId: number | null;
  slowestId: number | null;
  firstBloodsId: number | null;
  towerCount: number | null;
  minionsCount: number | null;
};

const EMPTY_BONUS: BonusState = {
  fastestId: null,
  slowestId: null,
  firstBloodsId: null,
  towerCount: null,
  minionsCount: null,
};

function toLite(p: PlayerData | undefined): PlayerLite | null {
  return p ? { id: p.id, name: p.name, photoUrl: p.photoUrl } : null;
}

function buildPredictedSlots(
  octavos: MatchRow[],
  picks: Record<string, number>,
  playersById: Map<number, PlayerData>
): TreeSlot[] {
  const slotsByKey = new Map<string, TreeSlot>();

  for (const round of ROUNDS) {
    for (let position = 0; position < MATCHES_PER_ROUND[round]; position++) {
      slotsByKey.set(matchKey(round, position), { round, position, player1: null, player2: null, winnerId: null });
    }
  }

  for (const m of octavos) {
    const slot = slotsByKey.get(matchKey("octavos", m.position))!;
    slot.player1 = m.player1Id ? toLite(playersById.get(m.player1Id)) : null;
    slot.player2 = m.player2Id ? toLite(playersById.get(m.player2Id)) : null;
  }

  for (const round of ROUNDS) {
    for (let position = 0; position < MATCHES_PER_ROUND[round]; position++) {
      const key = matchKey(round, position);
      const slot = slotsByKey.get(key)!;
      const pickedId = picks[key];
      slot.winnerId =
        pickedId !== undefined && (pickedId === slot.player1?.id || pickedId === slot.player2?.id)
          ? pickedId
          : null;

      if (slot.winnerId !== null) {
        const advance = nextSlot(round, position);
        if (advance) {
          const nextSlotObj = slotsByKey.get(matchKey(advance.slot.round, advance.slot.position))!;
          const player = toLite(playersById.get(slot.winnerId));
          if (advance.playerSlot === "player1Id") nextSlotObj.player1 = player;
          else nextSlotObj.player2 = player;
        }
      }
    }
  }

  return Array.from(slotsByKey.values());
}

function extractPicks(slots: TreeSlot[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const s of slots) {
    if (s.winnerId !== null) result[matchKey(s.round, s.position)] = s.winnerId;
  }
  return result;
}

export default function PickemsClient({
  players,
  octavos,
  locked,
  bracketExists,
}: {
  players: PlayerData[];
  octavos: MatchRow[];
  locked: boolean;
  bracketExists: boolean;
}) {
  const playersById = new Map(players.map((p) => [p.id, p]));

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [bonus, setBonus] = useState<BonusState>(EMPTY_BONUS);
  const [loadedForId, setLoadedForId] = useState<number | null>(null);
  const loaded = loadedForId === selectedId;
  const [saveState, setSaveState] = useState<"idle" | "pending" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutosave = useRef(false);

  useEffect(() => {
    if (selectedId === null) return;
    skipNextAutosave.current = true;
    getPrediction(selectedId).then((data) => {
      setPicks(data.bracket);
      setBonus({
        fastestId: data.bonusFastestId,
        slowestId: data.bonusSlowestId,
        firstBloodsId: data.bonusFirstBloodsId,
        towerCount: data.bonusTowerCount,
        minionsCount: data.bonusMinionsCount,
      });
      setSaveState("idle");
      setLoadedForId(selectedId);
    });
  }, [selectedId]);

  useEffect(() => {
    if (!loaded || selectedId === null || locked) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }

    setSaveState("pending");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      upsertPrediction(selectedId, {
        bracket: picks,
        bonusFastestId: bonus.fastestId,
        bonusSlowestId: bonus.slowestId,
        bonusFirstBloodsId: bonus.firstBloodsId,
        bonusTowerCount: bonus.towerCount,
        bonusMinionsCount: bonus.minionsCount,
      }).then(() => setSaveState("saved"));
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [picks, bonus, loaded, selectedId, locked]);

  const slots = buildPredictedSlots(octavos, picks, playersById);

  function handlePick(round: Round, position: number, playerId: number) {
    const updated = { ...picks, [matchKey(round, position)]: playerId };
    const newSlots = buildPredictedSlots(octavos, updated, playersById);
    setPicks(extractPicks(newSlots));
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0718] px-4 py-10 sm:px-8">
      <div aria-hidden className="stars absolute inset-0 opacity-80" />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-[#1b1038] via-[#0b0718] to-[#0b0718]"
      />

      <Link
        href="/"
        className="fixed left-4 top-4 z-40 rounded-full border border-amber-300/30 bg-purple-950/60 px-4 py-2 text-xs font-semibold tracking-widest text-amber-200/80 backdrop-blur transition hover:bg-purple-900/60 sm:left-6 sm:top-6"
      >
        ← Inicio
      </Link>

      <div className="relative z-10 flex flex-col gap-8">
        <header className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 text-center">
          <span className="font-display text-xs tracking-[0.4em] text-amber-300/70 sm:text-sm">
            ⋆｡‧˚ʚ ZODIAC REALM ɞ˚‧｡⋆
          </span>
          <h1 className="font-display text-4xl text-transparent bg-clip-text bg-linear-to-b from-amber-100 via-amber-300 to-amber-500 sm:text-5xl">
            PICKEMS
          </h1>
        </header>

        {!bracketExists ? (
          <p className="mx-auto w-full max-w-6xl rounded-2xl border border-amber-300/20 bg-purple-950/40 p-6 text-center text-purple-200">
            El bracket todavía no se ha generado. Vuelve más tarde.
          </p>
        ) : (
          <>
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2">
              <label className="text-sm text-purple-200">¿Quién eres?</label>
              <select
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
                className="rounded-lg border border-amber-300/30 bg-purple-950/60 px-4 py-2 text-purple-50"
              >
                <option value="">Selecciona tu nombre</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {selectedId !== null && (
                <span className="h-4 text-xs text-purple-300/60">
                  {locked
                    ? "🔒 Los Pickems están cerrados"
                    : saveState === "pending"
                      ? "Guardando..."
                      : saveState === "saved"
                        ? "Guardado ✓"
                        : ""}
                </span>
              )}
            </div>

            {selectedId !== null && loaded && (
              <>
                <BracketTree
                  slots={slots}
                  renderMatch={(slot) => {
                    const bothSet = Boolean(slot.player1 && slot.player2);
                    return (
                      <div className="flex flex-col gap-2 rounded-xl border border-amber-300/15 bg-purple-950/30 p-3">
                        <PlayerRow
                          player={slot.player1}
                          isWinner={slot.winnerId === slot.player1?.id}
                          disabled={locked}
                          onClick={
                            bothSet
                              ? () => handlePick(slot.round, slot.position, slot.player1!.id)
                              : undefined
                          }
                        />
                        <PlayerRow
                          player={slot.player2}
                          isWinner={slot.winnerId === slot.player2?.id}
                          disabled={locked}
                          onClick={
                            bothSet
                              ? () => handlePick(slot.round, slot.position, slot.player2!.id)
                              : undefined
                          }
                        />
                      </div>
                    );
                  }}
                  renderFinal={(slot) => (
                    <div className="rounded-xl border border-amber-300/20 bg-purple-950/30 p-4">
                      <FinalMatchup
                        slot={slot}
                        disabled={locked}
                        onPick={(playerId) => handlePick(slot.round, slot.position, playerId)}
                      />
                    </div>
                  )}
                />

                <div className="mx-auto w-full max-w-6xl">
                  <BonusQuestions players={players} value={bonus} onChange={setBonus} disabled={locked} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BonusQuestions({
  players,
  value,
  onChange,
  disabled,
}: {
  players: PlayerData[];
  value: BonusState;
  onChange: (v: BonusState) => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-purple-950/30 p-6">
      <h2 className="font-display text-xl text-amber-200">⋆ Preguntas bonus ⋆</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <PlayerSelect
          label="¿A quién van a matar más rápido?"
          players={players}
          value={value.fastestId}
          disabled={disabled}
          onChange={(v) => onChange({ ...value, fastestId: v })}
        />
        <PlayerSelect
          label="¿A quién van a matar más lento?"
          players={players}
          value={value.slowestId}
          disabled={disabled}
          onChange={(v) => onChange({ ...value, slowestId: v })}
        />
        <PlayerSelect
          label="¿Quién va a tener más primeras sangres?"
          players={players}
          value={value.firstBloodsId}
          disabled={disabled}
          onChange={(v) => onChange({ ...value, firstBloodsId: v })}
        />
        <div />
        <NumberInput
          label="¿Cuántas partidas se van a ganar por torre?"
          value={value.towerCount}
          disabled={disabled}
          onChange={(v) => onChange({ ...value, towerCount: v })}
        />
        <NumberInput
          label="¿Cuántas partidas se van a ganar por minions?"
          value={value.minionsCount}
          disabled={disabled}
          onChange={(v) => onChange({ ...value, minionsCount: v })}
        />
      </div>
    </div>
  );
}

function PlayerSelect({
  label,
  players,
  value,
  onChange,
  disabled,
}: {
  label: string;
  players: PlayerData[];
  value: number | null;
  onChange: (v: number | null) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-purple-200">
      {label}
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="rounded-lg border border-amber-300/30 bg-purple-950/60 px-3 py-2 text-purple-50 disabled:opacity-50"
      >
        <option value="">Sin elegir</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-purple-200">
      {label}
      <input
        type="number"
        min={0}
        max={15}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="rounded-lg border border-amber-300/30 bg-purple-950/60 px-3 py-2 text-purple-50 disabled:opacity-50"
      />
    </label>
  );
}
