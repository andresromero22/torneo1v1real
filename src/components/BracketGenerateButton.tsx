"use client";

import { useState, useTransition } from "react";
import { adminResetTournament } from "@/app/admin/actions";
import { PLAYERS } from "@/lib/players-data";

const SUSPENSE_MS = 3200;

export default function BracketGenerateButton({ hasExistingBracket }: { hasExistingBracket: boolean }) {
  const [showSuspense, setShowSuspense] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (hasExistingBracket) {
      const confirmed = window.confirm(
        "¿Seguro? Esto borra el bracket actual, los resultados y todas las predicciones de Pickems."
      );
      if (!confirmed) return;
    }

    setShowSuspense(true);
    const minDuration = new Promise((resolve) => setTimeout(resolve, SUSPENSE_MS));

    startTransition(async () => {
      await Promise.all([adminResetTournament(), minDuration]);
      setShowSuspense(false);
    });
  };

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
    </>
  );
}
