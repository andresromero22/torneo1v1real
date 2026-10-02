export type Round = "octavos" | "cuartos" | "semis" | "final";

export const ROUNDS: Round[] = ["octavos", "cuartos", "semis", "final"];

export const ROUND_LABELS: Record<Round, string> = {
  octavos: "Octavos de Final",
  cuartos: "Cuartos de Final",
  semis: "Semifinal",
  final: "Final",
};

export const MATCHES_PER_ROUND: Record<Round, number> = {
  octavos: 8,
  cuartos: 4,
  semis: 2,
  final: 1,
};

export type Slot = { round: Round; position: number };

/** The match (and player slot within it) that a winner of (round, position) advances into. */
export function nextSlot(round: Round, position: number): { slot: Slot; playerSlot: "player1Id" | "player2Id" } | null {
  const roundIndex = ROUNDS.indexOf(round);
  const nextRound = ROUNDS[roundIndex + 1];
  if (!nextRound) return null;

  return {
    slot: { round: nextRound, position: Math.floor(position / 2) },
    playerSlot: position % 2 === 0 ? "player1Id" : "player2Id",
  };
}

export function matchKey(round: Round, position: number): string {
  return `${round}-${position}`;
}

export function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Pairs a shuffled list of player ids into the 8 octavos matchups. */
export function pairOctavos(shuffledPlayerIds: number[]): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < shuffledPlayerIds.length; i += 2) {
    pairs.push([shuffledPlayerIds[i], shuffledPlayerIds[i + 1]]);
  }
  return pairs;
}
