"use client";

import { useEffect, useMemo, useState } from "react";
import { CHAMPIONS } from "@/lib/champions";

const ROW_HEIGHT = 56;
const VISIBLE_ROWS = 3;
const LAPS = 6;
const VIEWPORT_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;

function randomChampion(): string {
  return CHAMPIONS[Math.floor(Math.random() * CHAMPIONS.length)];
}

/** A long strip that lands exactly on `target`, with a couple of filler rows
 * after it so the reel doesn't look truncated once it stops (those trailing
 * rows are purely decorative, never the result). */
function buildStrip(target: string): { strip: string[]; targetIndex: number } {
  const strip: string[] = [];
  for (let i = 0; i < LAPS; i++) strip.push(...CHAMPIONS);
  const targetIndex = strip.length;
  strip.push(target, randomChampion(), randomChampion());
  return { strip, targetIndex };
}

export default function ChampionRoulette({
  champion,
  rollId,
}: {
  champion: string | null;
  rollId: number;
}) {
  if (!champion) {
    return (
      <div
        style={{ height: VIEWPORT_HEIGHT }}
        className="flex items-center justify-center rounded-lg border border-amber-300/20 bg-purple-950/40 text-sm text-purple-300/50"
      >
        Sin campeón sorteado
      </div>
    );
  }

  return (
    <div
      style={{ height: VIEWPORT_HEIGHT }}
      className="relative overflow-hidden rounded-lg border border-amber-300/40 bg-purple-950/60 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
    >
      <Reel key={rollId} champion={champion} />
      <div
        style={{ height: ROW_HEIGHT, top: ROW_HEIGHT }}
        className="animate-pulse-glow pointer-events-none absolute inset-x-0 rounded-md border-2 border-amber-300/70"
      />
    </div>
  );
}

/** Remounted fresh (via `key={rollId}` on the parent) every time the admin
 * rolls, so its own "spun" state always starts false without needing to be
 * reset imperatively. */
function Reel({ champion }: { champion: string }) {
  const { strip, targetIndex } = useMemo(() => buildStrip(champion), [champion]);
  const [spun, setSpun] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setSpun(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const landedOffset = (targetIndex - 1) * ROW_HEIGHT;

  return (
    <div
      className="transition-transform ease-[cubic-bezier(0.1,0.7,0.1,1)]"
      style={{
        transform: `translateY(-${spun ? landedOffset : 0}px)`,
        transitionDuration: spun ? "4200ms" : "0ms",
      }}
    >
      {strip.map((name, i) => (
        <div
          key={i}
          style={{ height: ROW_HEIGHT }}
          className="flex items-center justify-center font-display text-lg text-amber-100"
        >
          {name}
        </div>
      ))}
    </div>
  );
}
