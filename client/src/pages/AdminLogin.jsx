import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, auth } from "../lib/api";

export default function AdminLogin() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await api.login(password);
      auth.set(token);
      nav("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Parol noto'g'ri");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-stone-100 px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-stone-300 bg-white p-7 shadow-sm">
        <h1 className="font-display text-3xl text-stone-900">Admin panel</h1>
        <p className="mt-1 mb-6 text-sm text-stone-500">Taklifnomalarni boshqarish</p>

        <label htmlFor="pw" className="mb-1.5 block text-sm font-medium text-stone-700">Parol</label>
        <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
               required autoFocus autoComplete="current-password"
               className="min-h-11 w-full min-w-0 rounded-md border border-stone-300 px-3 py-2.5 text-[16px] text-stone-900 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200" />

        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={busy}
                className="mt-5 min-h-11 w-full rounded-md bg-stone-900 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50">
          {busy ? "…" : "Kirish"}
        </button>
      </form>
    </main>
  );
}
