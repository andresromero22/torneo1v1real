import Link from "next/link";
import { getBracket } from "@/lib/bracket";
import { computeLeaderboard } from "@/lib/scoring";
import { PLAYERS, type PlayerData } from "@/lib/players-data";
import { matchKey } from "@/lib/bracketShape";
import BracketTree, { FinalMatchup, PlayerRow, type TreeSlot } from "@/components/BracketTree";

export const dynamic = "force-dynamic";

function toLite(p: PlayerData | undefined) {
  return p ? { id: p.id, name: p.name, photoUrl: p.photoUrl } : null;
}

export default async function ResultadosPage() {
  const [matches, leaderboard] = await Promise.all([getBracket(), computeLeaderboard()]);
  const playersById = new Map(PLAYERS.map((p) => [p.id, p]));

  const slots: TreeSlot[] = matches.map((m) => ({
    round: m.round,
    position: m.position,
    player1: m.player1Id ? toLite(playersById.get(m.player1Id)) : null,
    player2: m.player2Id ? toLite(playersById.get(m.player2Id)) : null,
    winnerId: m.winnerId,
  }));

  const championByKey = new Map(matches.map((m) => [matchKey(m.round, m.position), m.champion]));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0718] px-4 py-10 sm:px-8">
      <div aria-hidden className="stars absolute inset-0 opacity-80" />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-[#1b1038] via-[#0b0718] to-[#0b0718]"
      />

      <Link
        href="/"
        className="fixed left-4 top-4 z-40 rounded-full border border-amber-300/30 bg-purple-950/60 px-4 py-2 text-xs font-semibold tracking-widest text-amber-200/80 backdrop-blur transition hover:bg-purple-900/60 sm:left-6 sm:top-6"
      >
        ← Inicio
      </Link>

      <div className="relative z-10 flex flex-col gap-10">
        <header className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 text-center">
          <span className="font-display text-xs tracking-[0.4em] text-amber-300/70 sm:text-sm">
            ⋆｡‧˚ʚ ZODIAC REALM ɞ˚‧｡⋆
          </span>
          <h1 className="font-display text-4xl text-transparent bg-clip-text bg-linear-to-b from-amber-100 via-amber-300 to-amber-500 sm:text-5xl">
            RESULTADOS
          </h1>
        </header>

        {matches.length === 0 ? (
          <p className="mx-auto w-full max-w-6xl rounded-2xl border border-amber-300/20 bg-purple-950/40 p-6 text-center text-purple-200">
            El bracket todavía no se ha generado.
          </p>
        ) : (
          <BracketTree
            slots={slots}
            renderMatch={(slot) => {
              const champion = championByKey.get(matchKey(slot.round, slot.position));
              return (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-300/15 bg-purple-950/30 p-3">
                  <PlayerRow player={slot.player1} isWinner={slot.winnerId === slot.player1?.id} disabled />
                  <PlayerRow player={slot.player2} isWinner={slot.winnerId === slot.player2?.id} disabled />
                  {champion && <p className="text-center text-xs text-amber-200/70">🎲 {champion}</p>}
                </div>
              );
            }}
            renderFinal={(slot) => {
              const champion = championByKey.get(matchKey(slot.round, slot.position));
              return (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-300/20 bg-purple-950/30 p-4">
                  <FinalMatchup slot={slot} />
                  {champion && <p className="text-center text-xs text-amber-200/70">🎲 {champion}</p>}
                </div>
              );
            }}
          />
        )}

        <section className="mx-auto w-full max-w-6xl rounded-2xl border border-amber-300/20 bg-purple-950/30 p-6">
          <h2 className="font-display text-xl text-amber-200">⋆ Tabla de Pickems ⋆</h2>
          <p className="mt-1 text-sm text-purple-300/60">10 puntos por cada acierto.</p>

          {leaderboard.length === 0 ? (
            <p className="mt-4 text-center text-purple-300/60">Todavía no hay predicciones.</p>
          ) : (
            <ol className="mt-4 flex flex-col gap-2">
              {leaderboard.map((entry, i) => (
                <li
                  key={entry.playerId}
                  className="flex items-center gap-3 rounded-lg border border-amber-300/10 bg-purple-950/40 px-4 py-2"
                >
                  <span className="font-display w-6 text-center text-amber-300">{i + 1}</span>
                  {entry.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  )}
                  <span className="flex-1 text-purple-50">{entry.playerName}</span>
                  <span className="font-display text-amber-200">{entry.score} pts</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
