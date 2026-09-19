"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);

  return (
    <form action={action} className="w-full max-w-sm rounded-lg border border-stone-300 bg-white p-7 shadow-sm">
      <h1 className="font-display text-3xl text-stone-900">Admin panel</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">Taklifnomalarni boshqarish</p>

      <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-700">
        Parol
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2.5 text-[16px] text-stone-900 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
      />

      {state?.error && (
        <p role="alert" className="mt-3 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-11 w-full rounded-md bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
      >
        {pending ? "…" : "Kirish"}
      </button>
    </form>
  );
}
