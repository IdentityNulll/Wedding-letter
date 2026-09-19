import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { countMessages, listInvitations } from "@/lib/db";
import { THEMES } from "@/lib/themes";
import { formatLongDate } from "@/lib/format";
import { createDraft, logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const invitations = listInvitations();

  return (
    <main className="min-h-[100dvh] bg-stone-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-stone-900 sm:text-4xl">Taklifnomalar</h1>
            <p className="mt-1 text-sm text-stone-500">{invitations.length} ta</p>
          </div>
          <div className="flex gap-2">
            <form action={createDraft}>
              <button className="min-h-11 rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800">
                + Yangi
              </button>
            </form>
            <form action={logout}>
              <button className="min-h-11 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-600 transition hover:bg-stone-50">
                Chiqish
              </button>
            </form>
          </div>
        </header>

        {invitations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <p className="text-stone-500">Hali taklifnoma yo&apos;q.</p>
            <form action={createDraft} className="mt-4">
              <button className="text-sm font-medium text-stone-900 underline underline-offset-4">
                Birinchisini yarating
              </button>
            </form>
          </div>
        ) : (
          <ul className="grid gap-3">
            {invitations.map((inv) => {
              const theme = THEMES.find((t) => t.id === inv.theme) ?? THEMES[0];
              const names = [inv.groomName, inv.brideName].filter(Boolean).join(" & ");
              const msgs = countMessages(inv.id);
              return (
                <li key={inv.id}>
                  <Link
                    href={`/admin/${inv.id}`}
                    className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-4 transition hover:border-stone-400 hover:shadow-sm"
                  >
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
                        /{inv.slug}
                        {inv.eventDate && ` · ${formatLongDate(inv.eventDate, inv.lang)}`}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      {msgs > 0 && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                          {msgs} 💬
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          inv.published
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
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
