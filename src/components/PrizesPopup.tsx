"use client";

import { useEffect, useState } from "react";

const MAIN_PRIZES = [
  { place: "🥇 1er Puesto", prize: "Skin Legendaria de 1850 RP" },
  { place: "🥈 2do Puesto", prize: "Skin Épica de 1350 RP" },
  { place: "🥉 3er Puesto", prize: "Cajita de 750 RP" },
];

const CONSOLATION_PRIZES = [
  { place: "Mejor puntaje en Pickems", prize: "Skin Épica de 1350 RP" },
  { place: "2do mejor puntaje en Pickems", prize: "Cajita de 750 RP" },
  { place: "3er mejor puntaje en Pickems", prize: "Cajita de 450 RP" },
];

export default function PrizesPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="animate-pulse-glow fixed left-4 top-4 z-40 flex items-center gap-2 rounded-full bg-linear-to-r from-amber-400 to-yellow-300 px-4 py-2 text-xs font-bold tracking-widest text-purple-950 transition hover:scale-105 sm:left-6 sm:top-6"
      >
        PREMIOS
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="prizes-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl border border-amber-300/40 bg-linear-to-b from-[#1a1033] to-[#100a24] p-8 shadow-[0_0_90px_rgba(212,175,55,0.25)] sm:p-12"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute right-5 top-5 text-2xl text-amber-200/60 transition hover:text-amber-200"
            >
              ✕
            </button>

            <h2
              id="prizes-title"
              className="font-display text-3xl tracking-wide text-transparent bg-clip-text bg-linear-to-r from-amber-200 via-yellow-300 to-amber-200 sm:text-4xl"
            >
              🏆 Premios 🏆
            </h2>

            <ul className="mt-6 space-y-4 text-lg text-purple-50 sm:text-xl">
              {MAIN_PRIZES.map((p) => (
                <li key={p.place} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-display text-amber-200">{p.place}</span>
                  <span className="text-right text-base text-purple-100 sm:text-lg">{p.prize}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-amber-300/20 pt-6">
              <h3 className="font-display text-lg tracking-wide text-amber-300 sm:text-xl">
                ⋆ Premios de consolación ⋆
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-purple-100/90 sm:text-base">
                {CONSOLATION_PRIZES.map((p) => (
                  <li key={p.place} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span>{p.place}</span>
                    <span className="text-right text-amber-200/90">{p.prize}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 border-t border-amber-300/20 pt-6">
              <h3 className="font-display text-lg tracking-wide text-amber-300 sm:text-xl">
                ⋆ Premio random ⋆
              </h3>
              <p className="mt-3 text-sm text-purple-100/90 sm:text-base">
                Ruleta aleatoria entre todos los participantes:{" "}
                <span className="text-amber-200/90">3 cajitas de 450 RP</span>
              </p>
            </div>

            <p className="mt-8 text-center text-s text-purple-300/60 sm:text-sm">
              ✦ Patrocina <span className="font-semibold text-amber-200">KEI</span> — para revivir el
              server en decadencia ✦
            </p>
          </div>
        </div>
      )}
    </>
  );
}
