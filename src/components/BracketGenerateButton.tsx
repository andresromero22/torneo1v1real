"use client";

import { useMemo, useState, useTransition } from "react";
import { adminResetTournament } from "@/app/admin/actions";
import { PLAYERS, type PlayerData } from "@/lib/players-data";

const SUSPENSE_MS = 5500;

export default function BracketGenerateButton({ hasExistingBracket }: { hasExistingBracket: boolean }) {
  const [showSuspense, setShowSuspense] = useState(false);
  const [revealPairs, setRevealPairs] = useState<[number, number][] | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (hasExistingBracket) {
      const confirmed = window.confirm(
        "¿Seguro? Esto borra el bracket actual, los resultados y todas las predicciones de Pickems."
      );
      if (!confirmed) return;
    }

    setShowSuspense(true);
    const minDuration = new Promise<void>((resolve) => setTimeout(resolve, SUSPENSE_MS));

    startTransition(async () => {
      const [pairs] = await Promise.all([adminResetTournament(), minDuration]);
      setShowSuspense(false);
      setRevealIndex(0);
      setRevealPairs(pairs);
    });
  };

  function handleNext() {
    if (!revealPairs) return;
    if (revealIndex < revealPairs.length - 1) {
      setRevealIndex((i) => i + 1);
    } else {
      setRevealPairs(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-full bg-linear-to-r from-amber-400 to-amber-200 px-6 py-2.5 text-sm font-bold tracking-wide text-purple-950 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition hover:scale-105 disabled:opacity-60"
      >
        {hasExistingBracket ? "Reiniciar Bracket" : "Generar Bracket"}
      </button>

      {showSuspense && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black/90 backdrop-blur-sm">
          <div className="stars absolute inset-0 opacity-60" aria-hidden />
          <div className="relative flex max-w-2xl flex-wrap justify-center gap-4 px-8">
            {PLAYERS.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.photoUrl}
                alt=""
                className="animate-shuffle-pulse h-14 w-14 rounded-full object-cover shadow-[0_0_20px_rgba(212,175,55,0.3)] sm:h-16 sm:w-16"
                style={{ animationDelay: `${i * 70}ms` }}
              />
            ))}
          </div>
          <p className="relative font-display text-xl tracking-[0.3em] text-amber-200 sm:text-2xl">
            ⋆ Sorteando el destino ⋆
          </p>
        </div>
      )}

      {revealPairs && (
        <RevealOverlay
          pairs={revealPairs}
          index={revealIndex}
          onNext={handleNext}
          onSkip={() => setRevealPairs(null)}
        />
      )}
    </>
  );
}

function RevealOverlay({
  pairs,
  index,
  onNext,
  onSkip,
}: {
  pairs: [number, number][];
  index: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const playersById = new Map(PLAYERS.map((p) => [p.id, p]));
  const [id1, id2] = pairs[index];
  const player1 = playersById.get(id1);
  const player2 = playersById.get(id2);
  const isLast = index === pairs.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/95 px-4 backdrop-blur-sm">
      <div className="stars absolute inset-0 opacity-50" aria-hidden />

      <span className="relative text-sm text-purple-300/60">
        Enfrentamiento {index + 1} de {pairs.length}
      </span>

      <div key={index} className="animate-reveal-pop relative">
        <TarotCard player1={player1} player2={player2} />
      </div>

      <button
        type="button"
        onClick={onNext}
        className="relative mt-2 rounded-full bg-linear-to-r from-amber-400 to-amber-200 px-10 py-3 text-base font-bold tracking-wide text-purple-950 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition hover:scale-105"
      >
        {isLast ? "⋆ Ver Bracket ⋆" : "Siguiente →"}
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="fixed bottom-4 right-4 text-xs text-purple-400/30 transition hover:text-purple-300/60"
      >
        Saltar
      </button>
    </div>
  );
}

// Arcane-looking inscription instead of literal zodiac glyphs (those render as
// tofu boxes in this font and look fake) — a random mix of Greek letters and
// mystical dots/stars, all guaranteed to render cleanly in the display font.
const GLYPH_POOL = ["✦", "⋆", "✧", "⟡", "Λ", "Ψ", "Ω", "Σ", "Δ", "Φ", "Ξ", "Θ"];

function randomGlyphLine(count = 9): string {
  return Array.from({ length: count }, () => GLYPH_POOL[Math.floor(Math.random() * GLYPH_POOL.length)]).join(
    " "
  );
}

function TarotCard({
  player1,
  player2,
}: {
  player1: PlayerData | undefined;
  player2: PlayerData | undefined;
}) {
  const glyphLine = useMemo(() => randomGlyphLine(), []);

  return (
    <div className="relative flex w-88 flex-col items-center gap-6 rounded-[2.5rem] border-2 border-amber-300/50 bg-linear-to-b from-[#2a1b4d] via-[#1a1033] to-[#100a24] px-8 py-8 shadow-[0_0_70px_rgba(212,175,55,0.35)] sm:w-160 sm:gap-9 sm:px-14 sm:py-10">
      <div className="pointer-events-none absolute inset-2 rounded-4xl border border-amber-300/20" />
      <span className="absolute left-6 top-6 text-lg text-amber-300/40">✦</span>
      <span className="absolute right-6 top-6 text-lg text-amber-300/40">✦</span>
      <span className="absolute bottom-6 left-6 text-lg text-amber-300/40">✦</span>
      <span className="absolute bottom-6 right-6 text-lg text-amber-300/40">✦</span>

      <div className="relative flex flex-col items-center gap-2">
        <span className="font-display text-sm tracking-[0.3em] text-amber-300/50">{glyphLine}</span>
        <span className="font-display text-sm tracking-[0.35em] text-amber-300/80 sm:text-base">
          ⋆ OCTAVOS DE FINAL ⋆
        </span>
      </div>

      <div className="relative flex w-full flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
        <TarotAvatar player={player1} />
        <span className="font-display text-2xl text-amber-200/70 sm:text-4xl">VS</span>
        <TarotAvatar player={player2} />
      </div>
    </div>
  );
}

function TarotAvatar({ player }: { player: PlayerData | undefined }) {
  return (
    <div className="relative flex flex-1 flex-col items-center gap-3">
      <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-amber-300/50 shadow-[0_0_30px_rgba(212,175,55,0.35)] sm:h-40 sm:w-40">
        {player ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-purple-950/60 text-3xl text-purple-400">
            ?
          </div>
        )}
      </div>
      <span className="font-display text-lg text-amber-100 sm:text-2xl">
        {player ? player.name : "?"}
      </span>
    </div>
  );
}
