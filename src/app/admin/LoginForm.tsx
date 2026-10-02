"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "./actions";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await login(password);
      if (!result.ok) {
        setError(result.error ?? "Error desconocido");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-[#0b0718]">
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

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-amber-300/30 bg-linear-to-b from-[#1a1033] to-[#100a24] p-8 shadow-[0_0_80px_rgba(212,175,55,0.18)]"
      >
        <h1 className="font-display text-center text-2xl tracking-wide text-amber-200">
          ⋆ Panel de Admin ⋆
        </h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoFocus
          className="rounded-lg border border-amber-300/30 bg-purple-950/60 px-4 py-2.5 text-purple-50 outline-none placeholder:text-purple-300/40 focus:border-amber-300/60"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending || password.length === 0}
          className="rounded-full bg-linear-to-r from-amber-400 to-amber-200 px-6 py-2.5 text-sm font-bold tracking-wide text-purple-950 transition hover:scale-105 disabled:opacity-50"
        >
          {isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
