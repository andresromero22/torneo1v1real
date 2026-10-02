import Link from "next/link";
import PhotoCarousel from "@/components/PhotoCarousel";
import RulesPopup from "@/components/RulesPopup";
import PrizesPopup from "@/components/PrizesPopup";
import { getPlayerPhotos } from "@/lib/players";

export default async function Home() {
  const playerPhotos = await getPlayerPhotos();

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-[#0b0718]">
      <div
        aria-hidden
        className="stars absolute inset-0 opacity-80"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-[#1b1038] via-[#0b0718] to-[#0b0718]"
      />

      <PhotoCarousel photos={playerPhotos} />

      <div
        aria-hidden
        className="absolute inset-0 bg-[#0b0718]/40"
      />

      <RulesPopup />
      <PrizesPopup />

      <Link
        href="/admin"
        aria-label="Admin"
        className="fixed bottom-4 left-4 z-40 text-xs text-purple-400/25 transition hover:text-purple-300/60"
      >
        ⚙
      </Link>

      <main className="relative z-10 flex flex-col items-center gap-6 px-6 py-24 text-center">
        <span className="font-display text-xs tracking-[0.4em] text-amber-300/70 sm:text-sm">
          ⋆｡‧˚ʚ ZODIAC REALM ɞ˚‧｡⋆
        </span>

        <h1 className="font-display text-4xl font-bold leading-tight text-transparent bg-clip-text bg-linear-to-b from-amber-100 via-amber-300 to-amber-500 drop-shadow-[0_0_35px_rgba(212,175,55,0.35)] sm:text-6xl md:text-7xl">
          TORNEO 1 VS 1 REAL
        </h1>

        <div className="mt-2 flex flex-col items-center gap-1 rounded-2xl border border-amber-300/20 bg-purple-950/40 px-6 py-3 backdrop-blur">
          <span className="text-sm font-semibold tracking-wide text-amber-200 sm:text-base">
            Viernes 9 de Octubre
          </span>
          <span className="text-xs text-purple-200/70 sm:text-sm">
            7:00 PM – 12:00 AM &middot; Hora Colombia
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/pickems"
            className="rounded-full bg-linear-to-r from-amber-400 to-amber-200 px-8 py-3 text-sm font-bold tracking-wide text-purple-950 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition hover:scale-105"
          >
            PICKEMS
          </Link>
          <Link
            href="/resultados"
            className="rounded-full border border-amber-300/40 bg-purple-950/50 px-8 py-3 text-sm font-bold tracking-wide text-amber-100 backdrop-blur transition hover:scale-105 hover:bg-purple-900/60"
          >
            RESULTADOS
          </Link>
        </div>
      </main>
    </div>
  );
}
