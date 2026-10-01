import Link from "next/link";

export default function ResultadosPage() {
  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-[#0b0718]">
      <div aria-hidden className="stars absolute inset-0 opacity-80" />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-[#1b1038] via-[#0b0718] to-[#0b0718]"
      />

      <main className="relative z-10 flex flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="font-display text-xs tracking-[0.4em] text-amber-300/70 sm:text-sm">
          ⋆｡‧˚ʚ ZODIAC REALM ɞ˚‧｡⋆
        </span>
        <h1 className="font-display text-3xl font-bold text-transparent bg-clip-text bg-linear-to-b from-amber-100 via-amber-300 to-amber-500 sm:text-5xl">
          RESULTADOS
        </h1>
        <p className="max-w-md text-sm text-purple-200/70 sm:text-base">
          Los resultados del torneo se publicarán aquí a partir del viernes 9 de octubre.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full border border-amber-300/40 bg-purple-950/50 px-6 py-2 text-sm font-semibold tracking-wide text-amber-100 backdrop-blur transition hover:bg-purple-900/60"
        >
          ← Volver al inicio
        </Link>
      </main>
    </div>
  );
}
