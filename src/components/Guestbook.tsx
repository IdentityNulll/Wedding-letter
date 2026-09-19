"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitMessage, type GuestbookState } from "@/app/[slug]/actions";
import { UI, type GuestMessage, type Lang } from "@/lib/types";
import { MAX_AUTHOR, MAX_BODY } from "@/lib/limits";

export default function Guestbook({
  slug,
  lang,
  messages,
}: {
  slug: string;
  lang: Lang;
  messages: GuestMessage[];
}) {
  const t = UI[lang];
  const [state, action, pending] = useActionState<GuestbookState, FormData>(submitMessage, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box only on success, so a rejected message isn't lost.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div>
      <p className="mb-6 text-center text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {t.guestbookNote}
      </p>

      <form
        ref={formRef}
        action={action}
        className="frame mx-auto mb-10 flex max-w-md flex-col gap-3 p-4 sm:p-6"
        style={{ background: "color-mix(in srgb, var(--paper-2) 50%, transparent)" }}
      >
        <input type="hidden" name="slug" value={slug} />

        <input
          name="author"
          maxLength={MAX_AUTHOR}
          placeholder={t.yourName}
          autoComplete="name"
          className="min-h-11 w-full rounded-sm px-3 py-2.5 text-[16px] outline-none focus:ring-2"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid color-mix(in srgb, var(--gold) 45%, transparent)",
          }}
        />

        <textarea
          name="body"
          required
          rows={4}
          maxLength={MAX_BODY}
          placeholder={t.yourMessage}
          className="w-full resize-y rounded-sm px-3 py-2.5 text-[16px] outline-none focus:ring-2"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid color-mix(in srgb, var(--gold) 45%, transparent)",
          }}
        />

        <button
          type="submit"
          disabled={pending}
          className="min-h-11 w-full rounded-sm px-5 py-3 text-sm tracking-[0.2em] uppercase transition disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--paper)" }}
        >
          {pending ? "…" : t.send}
        </button>

        {state?.message && (
          <p
            role="status"
            className="text-center text-sm"
            style={{ color: state.ok ? "var(--accent)" : "#b3261e" }}
          >
            {state.message}
          </p>
        )}
      </form>

      {messages.length === 0 ? (
        <p className="text-center text-sm italic" style={{ color: "var(--ink-soft)" }}>
          {t.emptyGuestbook}
        </p>
      ) : (
        <ul className="mx-auto flex max-w-md flex-col gap-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className="frame px-4 py-4 sm:px-5"
              style={{ background: "color-mix(in srgb, var(--paper-2) 40%, transparent)" }}
            >
              <p
                className="text-[15px] leading-relaxed break-words whitespace-pre-line"
                style={{ color: "var(--ink)" }}
              >
                {m.body}
              </p>
              <p className="font-script mt-2 text-right text-xl" style={{ color: "var(--accent)" }}>
                — {m.author || t.anonymous}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
