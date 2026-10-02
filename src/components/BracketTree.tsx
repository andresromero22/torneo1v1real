import { ReactNode } from "react";
import { ROUNDS, matchKey, type Round } from "@/lib/bracketShape";

export type PlayerLite = {
  id: number;
  name: string;
  photoUrl: string;
};

export type TreeSlot = {
  round: Round;
  position: number;
  player1: PlayerLite | null;
  player2: PlayerLite | null;
  winnerId: number | null;
};

const CONNECTOR_WIDTH = 20;
const PAIR_GAP = 10;
// Fallback for narrow screens: below this the tree scrolls horizontally
// instead of squeezing every card unreadably thin.
const MIN_TREE_WIDTH = 1080;

// Relative width of each column — octavos/cuartos/semis stay equal width,
// and the final gets noticeably more so its two face-off circles have room
// to breathe instead of crowding "VS".
const COLUMN_WEIGHT: Record<Round, number> = {
  octavos: 1,
  cuartos: 1,
  semis: 1,
  final: 1.7,
};

const CUMULATIVE_WEIGHT: number[] = (() => {
  let sum = 0;
  return ROUNDS.map((round) => (sum += COLUMN_WEIGHT[round]));
})();

type BracketNode = {
  slot: TreeSlot;
  children: [BracketNode, BracketNode] | null;
};

function buildNode(slotsByKey: Map<string, TreeSlot>, round: Round, position: number): BracketNode {
  const slot = slotsByKey.get(matchKey(round, position))!;
  const roundIndex = ROUNDS.indexOf(round);
  if (roundIndex === 0) return { slot, children: null };

  const prevRound = ROUNDS[roundIndex - 1];
  return {
    slot,
    children: [
      buildNode(slotsByKey, prevRound, position * 2),
      buildNode(slotsByKey, prevRound, position * 2 + 1),
    ],
  };
}

export default function BracketTree({
  slots,
  renderMatch,
  renderFinal,
}: {
  slots: TreeSlot[];
  renderMatch: (slot: TreeSlot) => ReactNode;
  /** Special-cased visual for the final (e.g. big face-off circles) — falls back to renderMatch if omitted. */
  renderFinal?: (slot: TreeSlot) => ReactNode;
}) {
  const slotsByKey = new Map(slots.map((s) => [matchKey(s.round, s.position), s]));
  const finalSlot = slotsByKey.get(matchKey("final", 0));
  if (!finalSlot) return null;

  const root = buildNode(slotsByKey, "final", 0);
  const [leftHalf, rightHalf] = root.children ?? [null, null];

  return (
    <div className="mx-auto w-full max-w-350 overflow-x-auto pb-4">
      <div className="flex items-stretch" style={{ minWidth: MIN_TREE_WIDTH }}>
        {leftHalf && <BracketNodeView node={leftHalf} renderMatch={renderMatch} />}
        <Connector />
        <div
          className="flex min-w-0 flex-col justify-center"
          style={{ flex: `${COLUMN_WEIGHT.final} 1 0%` }}
        >
          {(renderFinal ?? renderMatch)(root.slot)}
        </div>
        <Connector mirrored />
        {rightHalf && <BracketNodeView node={rightHalf} renderMatch={renderMatch} mirrored />}
      </div>
    </div>
  );
}

function BracketNodeView({
  node,
  renderMatch,
  mirrored = false,
}: {
  node: BracketNode;
  renderMatch: (slot: TreeSlot) => ReactNode;
  mirrored?: boolean;
}) {
  const roundIndex = ROUNDS.indexOf(node.slot.round);

  if (!node.children) {
    return (
      <div className="min-w-0" style={{ flex: `${COLUMN_WEIGHT[node.slot.round]} 1 0%` }}>
        {renderMatch(node.slot)}
      </div>
    );
  }

  const childrenWeight = CUMULATIVE_WEIGHT[roundIndex - 1];
  const ownWeight = COLUMN_WEIGHT[node.slot.round];
  const totalWeight = CUMULATIVE_WEIGHT[roundIndex];

  const childrenColumn = (
    <div
      className="flex min-w-0 flex-col justify-around"
      style={{ flex: `${childrenWeight} 1 0%`, gap: PAIR_GAP }}
    >
      <BracketNodeView node={node.children[0]} renderMatch={renderMatch} mirrored={mirrored} />
      <BracketNodeView node={node.children[1]} renderMatch={renderMatch} mirrored={mirrored} />
    </div>
  );
  const matchBox = (
    <div className="flex min-w-0 flex-col justify-center" style={{ flex: `${ownWeight} 1 0%` }}>
      {renderMatch(node.slot)}
    </div>
  );

  return (
    <div className="flex min-w-0" style={{ flex: `${totalWeight} 1 0%` }}>
      {mirrored ? (
        <>
          {matchBox}
          <Connector mirrored />
          {childrenColumn}
        </>
      ) : (
        <>
          {childrenColumn}
          <Connector />
          {matchBox}
        </>
      )}
    </div>
  );
}

function Connector({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <div style={{ width: CONNECTOR_WIDTH }} className="relative shrink-0">
      {mirrored ? (
        <>
          <div
            className="absolute border-y-2 border-l-2 border-amber-400/40"
            style={{ right: 0, width: "50%", top: "25%", height: "50%" }}
          />
          <div
            className="absolute bg-amber-400/40"
            style={{ right: "50%", width: "50%", top: "calc(50% - 1px)", height: 2 }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute border-y-2 border-r-2 border-amber-400/40"
            style={{ left: 0, width: "50%", top: "25%", height: "50%" }}
          />
          <div
            className="absolute bg-amber-400/40"
            style={{ left: "50%", width: "50%", top: "calc(50% - 1px)", height: 2 }}
          />
        </>
      )}
    </div>
  );
}

export function PlayerRow({
  player,
  isWinner,
  onClick,
  disabled,
}: {
  player: PlayerLite | null;
  isWinner: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const interactive = Boolean(onClick) && !disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
        isWinner
          ? "border-amber-300/60 bg-amber-400/10 text-amber-100"
          : "border-purple-300/10 bg-purple-950/40 text-purple-200"
      } ${interactive ? "cursor-pointer hover:border-amber-300/50 hover:bg-amber-400/10" : ""} ${
        !player ? "opacity-40" : ""
      }`}
    >
      {player ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={player.photoUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="h-7 w-7 shrink-0 rounded-full bg-purple-900/60" />
      )}
      <span className="truncate text-sm">{player ? player.name : "Por definir"}</span>
    </button>
  );
}

/** Big face-off circles for the final — more dramatic than the usual list card. */
export function FinalMatchup({
  slot,
  onPick,
  disabled,
}: {
  slot: TreeSlot;
  onPick?: (playerId: number) => void;
  disabled?: boolean;
}) {
  const bothSet = Boolean(slot.player1 && slot.player2);
  const canPick = Boolean(onPick) && bothSet && !disabled;

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="font-display text-xs tracking-[0.3em] text-amber-300/70">⋆ LA FINAL ⋆</span>
      <div className="flex items-center gap-5 sm:gap-8">
        <FinalAvatar
          player={slot.player1}
          isWinner={slot.winnerId !== null && slot.winnerId === slot.player1?.id}
          onClick={canPick ? () => onPick!(slot.player1!.id) : undefined}
        />
        <span className="font-display text-lg text-amber-200/70 sm:text-xl">VS</span>
        <FinalAvatar
          player={slot.player2}
          isWinner={slot.winnerId !== null && slot.winnerId === slot.player2?.id}
          onClick={canPick ? () => onPick!(slot.player2!.id) : undefined}
        />
      </div>
    </div>
  );
}

function FinalAvatar({
  player,
  isWinner,
  onClick,
}: {
  player: PlayerLite | null;
  isWinner: boolean;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`flex flex-col items-center gap-2 ${interactive ? "cursor-pointer transition hover:scale-105" : ""}`}
    >
      <div
        className={`h-16 w-16 overflow-hidden rounded-full border-4 sm:h-20 sm:w-20 ${
          isWinner
            ? "border-amber-300 shadow-[0_0_30px_rgba(212,175,55,0.65)]"
            : "border-purple-300/25 bg-purple-950/60"
        }`}
      >
        {player ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-purple-400">?</div>
        )}
      </div>
      <span
        className={`max-w-[5.5rem] truncate text-xs ${isWinner ? "font-semibold text-amber-200" : "text-purple-200"}`}
      >
        {player ? player.name : "Por definir"}
      </span>
    </button>
  );
}
