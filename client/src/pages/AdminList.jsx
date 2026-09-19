import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, auth } from "../lib/api";
import { THEMES, formatLongDate } from "../lib/i18n";

export default function AdminList() {
  const nav = useNavigate();
  const [items, setItems] = useState(null);

  useEffect(() => { api.list().then((d) => setItems(d.invitations)).catch(() => setItems([])); }, []);

  async function create() {
    const { invitation } = await api.create();
    nav(`/admin/${invitation._id}`);
  }

  function logout() {
    auth.clear();
    nav("/admin/login", { replace: true });
  }

  return (
    <main className="min-h-[100dvh] bg-stone-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-stone-900 sm:text-4xl">Taklifnomalar</h1>
            <p className="mt-1 text-sm text-stone-500">{items ? `${items.length} ta` : "…"}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="min-h-11 rounded-md bg-stone-900 px-5 text-sm font-medium text-white hover:bg-stone-800">
              + Yangi
            </button>
            <button onClick={logout} className="min-h-11 rounded-md border border-stone-300 bg-white px-4 text-sm text-stone-600 hover:bg-stone-50">
              Chiqish
            </button>
          </div>
        </header>

        {!items ? (
          <p className="text-stone-500">Yuklanmoqda…</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <p className="text-stone-500">Hali taklifnoma yo&apos;q.</p>
            <button onClick={create} className="mt-4 text-sm font-medium text-stone-900 underline underline-offset-4">
              Birinchisini yarating
            </button>
          </div>
        ) : (
          <ul className="grid gap-3">
            {items.map((inv) => {
              const theme = THEMES.find((t) => t.id === inv.theme) ?? THEMES[0];
              const names = [inv.groomName, inv.brideName].filter(Boolean).join(" & ");
              return (
                <li key={inv._id}>
                  <Link to={`/admin/${inv._id}`}
                        className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-4 transition hover:border-stone-400 hover:shadow-sm">
                    <span className="flex shrink-0 gap-1" aria-hidden>
                      {theme.swatch.map((c) => (
                        <span key={c} className="h-9 w-3 rounded-sm ring-1 ring-black/10" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-stone-900">
                        {names || <span className="text-stone-400">Nomsiz</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-stone-500">
                        /{inv.slug}{inv.eventDate && ` · ${formatLongDate(inv.eventDate, inv.lang)}`}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {inv.messageCount > 0 && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{inv.messageCount} 💬</span>
                      )}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${inv.published ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                        {inv.published ? "Faol" : "Qoralama"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
