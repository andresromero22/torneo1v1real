"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_NAME, getSessionToken, isCorrectPassword, requireAdmin } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import * as bracket from "@/lib/bracket";

export async function login(password: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await isCorrectPassword(password))) {
    return { ok: false, error: "Contraseña incorrecta" };
  }

  const store = await cookies();
  store.set(COOKIE_NAME, await getSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return { ok: true };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function adminResetTournament(): Promise<void> {
  await requireAdmin();
  await bracket.resetTournament();
  revalidatePath("/admin");
  revalidatePath("/pickems");
  revalidatePath("/resultados");
}

/** Wipes the bracket/predictions without generating a new pairing. */
export async function adminClearTournament(): Promise<void> {
  await requireAdmin();
  await bracket.clearTournament();
  revalidatePath("/admin");
  revalidatePath("/pickems");
  revalidatePath("/resultados");
}

export async function adminSetMatchWinner(
  matchId: number,
  winnerId: number | null,
  result?: bracket.MatchResultInput
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    await bracket.setMatchWinner(matchId, winnerId, result);
    revalidatePath("/admin");
    revalidatePath("/resultados");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function adminRepeatMatch(matchId: number): Promise<{ ok: boolean; champion?: string; error?: string }> {
  await requireAdmin();
  try {
    await bracket.setMatchWinner(matchId, null);
    const champion = await bracket.rerollChampion(matchId);
    revalidatePath("/admin");
    revalidatePath("/resultados");
    return { ok: true, champion };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function adminRerollChampion(matchId: number): Promise<string> {
  await requireAdmin();
  const champion = await bracket.rerollChampion(matchId);
  revalidatePath("/admin");
  revalidatePath("/resultados");
  return champion;
}

export async function adminTogglePickemsLock(locked: boolean): Promise<void> {
  await requireAdmin();
  await ensureSchema();
  await sql`UPDATE tournament_settings SET pickems_locked = ${locked} WHERE id = 1`;
  revalidatePath("/admin");
  revalidatePath("/pickems");
}
