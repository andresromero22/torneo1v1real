"use client";

import { useEffect, useState } from "react";

const RULES = [
  "Logre la Primera Sangre",
  "Llegue a los 100 minions",
  "Rompa la primera torre",
];

export default function RulesPopup() {
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
        className="fixed right-4 top-4 z-40 flex items-center gap-2 rounded-full border border-amber-300/40 bg-purple-950/80 px-4 py-2 text-xs font-semibold tracking-widest text-amber-200 shadow-[0_0_20px_rgba(212,175,55,0.25)] backdrop-blur transition hover:bg-purple-900/90 sm:right-6 sm:top-6"
      >
        ✦ REGLAS
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rules-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl border border-amber-300/30 bg-linear-to-b from-[#1a1033] to-[#100a24] p-8 shadow-[0_0_80px_rgba(212,175,55,0.18)] sm:p-12"
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
              id="rules-title"
              className="font-display text-3xl tracking-wide text-amber-200 sm:text-4xl"
            >
              ⋆ Reglas del 1v1 ⋆
            </h2>
            <p className="mt-3 text-base text-purple-200/70 sm:text-lg">
              Gana la partida quien primero logre una de estas condiciones:
            </p>

            <ol className="mt-6 space-y-5 text-lg text-purple-50 sm:text-xl">
              {RULES.map((rule, i) => (
                <li key={rule} className="flex gap-4">
                  <span className="font-display text-amber-300">{i + 1}.</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>

            <p className="mt-6 text-sm text-purple-300/60 sm:text-base">
              Lo primero que ocurra decide la victoria.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
