"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ChampionRoulette from "@/components/ChampionRoulette";
import { adminRerollChampion } from "@/app/admin/actions";

export default function ChampionRoulettePopup({
  matchId,
  champion,
  onClose,
}: {
  matchId: number;
  champion: string | null;
  onClose: () => void;
}) {
  const [rollId, setRollId] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleRoll() {
    startTransition(async () => {
      await adminRerollChampion(matchId);
      setRollId((r) => r + 1);
      router.refresh();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-amber-300/30 bg-linear-to-b from-[#1a1033] to-[#100a24] p-6 shadow-[0_0_80px_rgba(212,175,55,0.2)]"
      >
        <h3 className="text-center font-display text-xl tracking-wide text-amber-200">
          ⋆ Ruleta de Campeón ⋆
        </h3>

        <div className="mt-4">
          <ChampionRoulette champion={champion} rollId={rollId} />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-amber-300/30 py-2 text-sm font-semibold text-amber-200/80 transition hover:bg-purple-900/40"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleRoll}
            className="flex-1 rounded-full bg-linear-to-r from-amber-400 to-amber-200 py-2 text-sm font-bold text-purple-950 transition hover:scale-105 disabled:opacity-50"
          >
            {champion ? "Volver a girar" : "Girar"}
          </button>
        </div>
      </div>
    </div>
  );
}
