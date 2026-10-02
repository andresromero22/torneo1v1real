"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BracketTree, { FinalMatchup, PlayerRow, type TreeSlot } from "@/components/BracketTree";
import BracketGenerateButton from "@/components/BracketGenerateButton";
import ChampionRoulettePopup from "@/components/ChampionRoulettePopup";
import { matchKey, nextSlot } from "@/lib/bracketShape";
import type { MatchRow, WinCondition } from "@/lib/bracket";
import type { PlayerData } from "@/lib/players-data";
import type { BonusStats } from "@/lib/scoring";
import {
  adminSetMatchWinner,
  adminRepeatMatch,
  adminTogglePickemsLock,
  adminClearTournament,
  logout,
} from "./actions";

const WIN_CONDITION_LABELS: Record<WinCondition, string> = {
  primera_sangre: "🩸 Primera sangre",
  minions: "⚔️ 100 minions",
  torre: "🏰 Primera torre",
};

export default function AdminDashboard({
  matches,
  players,
  locked,
  bonusStats,
}: {
  matches: MatchRow[];
  players: PlayerData[];
  locked: boolean;
  bonusStats: BonusStats;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingResult, setPendingResult] = useState<{ matchId: number; winnerId: number } | null>(null);
  const [rouletteMatchId, setRouletteMatchId] = useState<number | null>(null);

  const playersById = new Map(players.map((p) => [p.id, p]));
  const matchByKey = new Map(matches.map((m) => [matchKey(m.round, m.position), m]));
  const matchById = new Map(matches.map((m) => [m.id, m]));

  const slots: TreeSlot[] = matches.map((m) => ({
    round: m.round,
    position: m.position,
    player1: m.player1Id ? toLite(playersById.get(m.player1Id)) : null,
    player2: m.player2Id ? toLite(playersById.get(m.player2Id)) : null,
    winnerId: m.winnerId,
  }));

  function canEdit(match: MatchRow): boolean {
    const advance = nextSlot(match.round, match.position);
    if (!advance) return true;
    const next = matchByKey.get(matchKey(advance.slot.round, advance.slot.position));
    return !next || next.winnerId === null;
  }

  function handleConfirmResult(durationSeconds: number, winCondition: WinCondition) {
    if (!pendingResult) return;
    const { matchId, winnerId } = pendingResult;
    setPendingResult(null);
    startTransition(async () => {
      const result = await adminSetMatchWinner(matchId, winnerId, { durationSeconds, winCondition });
      if (!result.ok) alert(result.error);
      router.refresh();
    });
  }

  function handleUndo(matchId: number) {
    startTransition(async () => {
      const result = await adminSetMatchWinner(matchId, null);
      if (!result.ok) alert(result.error);
      router.refresh();
    });
  }

  function handleRepeat(matchId: number) {
    startTransition(async () => {
      const result = await adminRepeatMatch(matchId);
      if (!result.ok) alert(result.error);
      router.refresh();
    });
  }

  function handleClear() {
    const confirmed = window.confirm(
      "¿Seguro? Esto borra el bracket actual y todas las predicciones de Pickems, sin generar uno nuevo."
    );
    if (!confirmed) return;
    startTransition(async () => {
      await adminClearTournament();
      router.refresh();
    });
  }

  function handleToggleLock() {
    startTransition(async () => {
      await adminTogglePickemsLock(!locked);
      router.refresh();
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.refresh();
    });
  }

  const hasExistingBracket = matches.length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0718] px-4 py-10 sm:px-8">
      <div aria-hidden className="stars absolute inset-0 opacity-60" />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-[#1b1038] via-[#0b0718] to-[#0b0718]"
      />

      <div className="relative z-10 flex flex-col gap-8">
        <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="rounded-full border border-amber-300/30 px-4 py-2 text-xs font-semibold tracking-widest text-amber-200/80 transition hover:bg-purple-900/40"
            >
              ← Inicio
            </Link>
            <h1 className="font-display text-3xl text-transparent bg-clip-text bg-linear-to-b from-amber-100 via-amber-300 to-amber-500">
              Panel de Admin
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LockToggle locked={locked} onToggle={handleToggleLock} disabled={isPending} />
            <BracketGenerateButton hasExistingBracket={hasExistingBracket} />
            {hasExistingBracket && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-semibold tracking-widest text-red-300/80 transition hover:bg-red-950/40 disabled:opacity-40"
              >
                Borrar todo
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-amber-300/30 px-4 py-2 text-xs font-semibold tracking-widest text-amber-200/80 transition hover:bg-purple-900/40"
            >
              Salir
            </button>
          </div>
        </header>

        {!hasExistingBracket ? (
          <p className="mx-auto w-full max-w-6xl rounded-2xl border border-amber-300/20 bg-purple-950/40 p-6 text-center text-purple-200">
            Todavía no hay bracket generado. Dale a &ldquo;Generar Bracket&rdquo; para sortear a
            los 16 jugadores.
          </p>
        ) : (
          <BracketTree
            slots={slots}
            renderMatch={(slot) => {
              const match = matchByKey.get(matchKey(slot.round, slot.position))!;
              const editable = canEdit(match);
              const bothPlayersSet = Boolean(slot.player1 && slot.player2);

              return (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-300/15 bg-purple-950/30 p-3">
                  <PlayerRow
                    player={slot.player1}
                    isWinner={slot.winnerId === slot.player1?.id}
                    disabled={isPending || !editable}
                    onClick={
                      bothPlayersSet
                        ? () => setPendingResult({ matchId: match.id, winnerId: slot.player1!.id })
                        : undefined
                    }
                  />
                  <PlayerRow
                    player={slot.player2}
                    isWinner={slot.winnerId === slot.player2?.id}
                    disabled={isPending || !editable}
                    onClick={
                      bothPlayersSet
                        ? () => setPendingResult({ matchId: match.id, winnerId: slot.player2!.id })
                        : undefined
                    }
                  />

                  <MatchControls
                    match={match}
                    editable={editable}
                    bothPlayersSet={bothPlayersSet}
                    isPending={isPending}
                    winnerId={slot.winnerId}
                    onRoulette={() => setRouletteMatchId(match.id)}
                    onUndo={() => handleUndo(match.id)}
                    onRepeat={() => handleRepeat(match.id)}
                  />
                </div>
              );
            }}
            renderFinal={(slot) => {
              const match = matchByKey.get(matchKey(slot.round, slot.position))!;
              const editable = canEdit(match);
              const bothPlayersSet = Boolean(slot.player1 && slot.player2);

              return (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-300/20 bg-purple-950/30 p-4">
                  <FinalMatchup
                    slot={slot}
                    disabled={isPending || !editable}
                    onPick={(winnerId) => setPendingResult({ matchId: match.id, winnerId })}
                  />
                  <div className="w-full max-w-55">
                    <MatchControls
                      match={match}
                      editable={editable}
                      bothPlayersSet={bothPlayersSet}
                      isPending={isPending}
                      winnerId={slot.winnerId}
                      onRoulette={() => setRouletteMatchId(match.id)}
                      onUndo={() => handleUndo(match.id)}
                      onRepeat={() => handleRepeat(match.id)}
                    />
                  </div>
                </div>
              );
            }}
          />
        )}

        <div className="mx-auto w-full max-w-6xl">
          <BonusStatsPanel players={players} stats={bonusStats} />
        </div>
      </div>

      {pendingResult && (
        <ResultModal onCancel={() => setPendingResult(null)} onConfirm={handleConfirmResult} />
      )}

      {rouletteMatchId !== null && (
        <ChampionRoulettePopup
          matchId={rouletteMatchId}
          champion={matchById.get(rouletteMatchId)?.champion ?? null}
          onClose={() => setRouletteMatchId(null)}
        />
      )}
    </div>
  );
}

function MatchControls({
  match,
  editable,
  bothPlayersSet,
  isPending,
  winnerId,
  onRoulette,
  onUndo,
  onRepeat,
}: {
  match: MatchRow;
  editable: boolean;
  bothPlayersSet: boolean;
  isPending: boolean;
  winnerId: number | null;
  onRoulette: () => void;
  onUndo: () => void;
  onRepeat: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isPending || !bothPlayersSet}
        onClick={onRoulette}
        className="truncate rounded-full border border-amber-300/30 py-1.5 text-xs text-amber-200/80 transition hover:bg-purple-900/40 disabled:opacity-40"
      >
        {match.champion ? `🎲 ${match.champion}` : "🎲 Girar ruleta"}
      </button>

      {winnerId !== null && (
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            disabled={isPending || !editable}
            onClick={onUndo}
            className="flex-1 rounded-full border border-amber-300/30 py-1.5 text-amber-200/80 transition hover:bg-purple-900/40 disabled:opacity-40"
          >
            Deshacer
          </button>
          <button
            type="button"
            disabled={isPending || !editable}
            onClick={onRepeat}
            className="flex-1 rounded-full border border-amber-300/30 py-1.5 text-amber-200/80 transition hover:bg-purple-900/40 disabled:opacity-40"
          >
            Repetir
          </button>
        </div>
      )}
      {!editable && (
        <p className="text-center text-[10px] text-purple-300/50">
          Bloqueado: deshaz primero la siguiente ronda
        </p>
      )}
    </div>
  );
}

function toLite(p: PlayerData | undefined) {
  return p ? { id: p.id, name: p.name, photoUrl: p.photoUrl } : null;
}

function LockToggle({
  locked,
  onToggle,
  disabled,
}: {
  locked: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-widest transition ${
        locked
          ? "border-red-400/40 bg-red-500/10 text-red-300"
          : "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
      }`}
    >
      {locked ? "🔒 Pickems bloqueados" : "🔓 Pickems abiertos"}
    </button>
  );
}

function ResultModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: (durationSeconds: number, winCondition: WinCondition) => void;
}) {
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [condition, setCondition] = useState<WinCondition | "">("");

  const canConfirm = minutes !== "" && seconds !== "" && condition !== "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-amber-300/30 bg-linear-to-b from-[#1a1033] to-[#100a24] p-6 shadow-[0_0_80px_rgba(212,175,55,0.2)]"
      >
        <h3 className="font-display text-xl tracking-wide text-amber-200">
          ⋆ Resultado del enfrentamiento ⋆
        </h3>

        <p className="mt-2 text-sm text-purple-300/60">¿Cuánto duró la partida?</p>
        <div className="mt-2 flex items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-purple-200">
            Minutos
            <input
              type="number"
              min={0}
              autoFocus
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-24 rounded-lg border border-amber-300/30 bg-purple-950/60 px-3 py-2 text-purple-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-purple-200">
            Segundos
            <input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              className="w-24 rounded-lg border border-amber-300/30 bg-purple-950/60 px-3 py-2 text-purple-50"
            />
          </label>
        </div>

        <p className="mt-4 text-sm text-purple-300/60">¿Cómo ganó?</p>
        <div className="mt-2 flex flex-col gap-2">
          {(Object.entries(WIN_CONDITION_LABELS) as [WinCondition, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCondition(value)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                condition === value
                  ? "border-amber-300/60 bg-amber-400/10 text-amber-100"
                  : "border-purple-300/20 text-purple-200 hover:border-amber-300/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-amber-300/30 py-2 text-sm font-semibold text-amber-200/80 transition hover:bg-purple-900/40"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(Number(minutes) * 60 + Number(seconds), condition as WinCondition)}
            className="flex-1 rounded-full bg-linear-to-r from-amber-400 to-amber-200 py-2 text-sm font-bold text-purple-950 transition hover:scale-105 disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function BonusStatsPanel({ players, stats }: { players: PlayerData[]; stats: BonusStats }) {
  const playersById = new Map(players.map((p) => [p.id, p]));
  const nameOf = (id: number | null) => (id !== null ? (playersById.get(id)?.name ?? "—") : "—");

  return (
    <div className="rounded-2xl border border-amber-300/20 bg-purple-950/30 p-6">
      <h2 className="font-display text-xl text-amber-200">⋆ Preguntas bonus (automático) ⋆</h2>
      <p className="mt-1 text-sm text-purple-300/60">
        Se calculan solas a partir de la duración y condición de victoria de cada enfrentamiento.
      </p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Stat label="A quién mataron más rápido" value={nameOf(stats.fastestId)} />
        <Stat label="A quién mataron más lento" value={nameOf(stats.slowestId)} />
        <Stat label="Más primeras sangres" value={nameOf(stats.firstBloodsId)} />
        <Stat label="Partidas ganadas por torre" value={String(stats.towerCount)} />
        <Stat label="Partidas ganadas por minions" value={String(stats.minionsCount)} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-amber-300/10 bg-purple-950/40 px-4 py-2">
      <dt className="text-xs text-purple-300/60">{label}</dt>
      <dd className="font-display text-amber-100">{value}</dd>
    </div>
  );
}
