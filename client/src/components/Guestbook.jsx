import { useState } from "react";
import { api, mediaUrl } from "../lib/api";
import { UI } from "../lib/i18n";

export function Guestbook({ slug, lang, messages: initial }) {
  const t = UI[lang];
  const [messages, setMessages] = useState(initial);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [note, setNote] = useState(null);
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) { setNote({ ok: false, text: t.writeSomething }); return; }
    setSending(true);
    try {
      const { message } = await api.postMessage(slug, { author, body });
      setMessages((m) => [...m, message]);
      setBody("");
      setAuthor("");
      setNote({ ok: true, text: t.sent });
    } catch (err) {
      setNote({ ok: false, text: err.status === 429 ? t.tooFast : t.writeSomething });
    } finally {
      setSending(false);
    }
  }

  const field = {
    background: "var(--paper)", color: "var(--ink)",
    border: "1px solid color-mix(in srgb, var(--gold) 45%, transparent)",
  };

  return (
    <div>
      <p className="mb-4 text-center text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {t.guestbookNote}
      </p>

      <form onSubmit={submit} className="frame mb-7 flex flex-col gap-2.5 p-3.5"
            style={{ background: "color-mix(in srgb, var(--paper-2) 50%, transparent)" }}>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={60}
               placeholder={t.yourName} autoComplete="name"
               className="min-h-11 w-full min-w-0 rounded-sm px-3 py-2 text-[16px] outline-none" style={field} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={600}
                  placeholder={t.yourMessage}
                  className="w-full min-w-0 resize-y rounded-sm px-3 py-2 text-[16px] outline-none" style={field} />
        <button type="submit" disabled={sending}
                className="min-h-11 w-full rounded-sm px-4 text-xs tracking-[0.2em] uppercase transition disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--paper)" }}>
          {sending ? "…" : t.send}
        </button>
        {note && (
          <p role="status" className="text-center text-sm"
             style={{ color: note.ok ? "var(--accent)" : "#b3261e" }}>{note.text}</p>
        )}
      </form>

      {messages.length === 0 ? (
        <p className="text-center text-sm italic" style={{ color: "var(--ink-soft)" }}>{t.emptyGuestbook}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <li key={m._id} className="frame px-3.5 py-3"
                style={{ background: "color-mix(in srgb, var(--paper-2) 40%, transparent)" }}>
              <p className="text-[15px] leading-relaxed break-words whitespace-pre-line" style={{ color: "var(--ink)" }}>
                {m.body}
              </p>
              <p className="font-script mt-1.5 text-right text-lg" style={{ color: "var(--accent)" }}>
                — {m.author || t.anonymous}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Gallery({ images }) {
  const [open, setOpen] = useState(null);
  return (
    <>
      <div className="no-bar -mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-1">
        {images.map((src, i) => (
          <button key={src + i} type="button" onClick={() => setOpen(i)}
                  className="frame h-48 w-36 shrink-0 snap-center overflow-hidden sm:h-60 sm:w-44">
            <img src={mediaUrl(src)} alt="" loading="lazy"
                 className="h-full w-full object-cover transition duration-500 hover:scale-105" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
             onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <img src={mediaUrl(images[open])} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </>
  );
}

export function GiftCard({ number, holder, lang }) {
  const t = UI[lang];
  const [copied, setCopied] = useState(false);

  const digits = String(number).replace(/\D/g, "") || number;
  const pretty = String(number).replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim() || number;

  async function copy() {
    try {
      await navigator.clipboard.writeText(digits);
    } catch {
      // Older mobile browsers and non-secure origins have no clipboard API.
      const ta = document.createElement("textarea");
      ta.value = digits; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* give up quietly */ }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="text-center">
      <p className="mb-5 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{t.giftNote}</p>
      <div className="frame px-3 py-5" style={{ background: "color-mix(in srgb, var(--paper-2) 55%, transparent)" }}>
        <p className="font-display text-lg tracking-[0.1em] tabular-nums break-all sm:text-2xl"
           style={{ color: "var(--accent-deep)" }}>{pretty}</p>
        {holder && (
          <p className="mt-2 text-[10px] tracking-[0.25em] uppercase" style={{ color: "var(--ink-soft)" }}>{holder}</p>
        )}
      </div>
      <button type="button" onClick={copy}
              className="mt-4 min-h-11 w-full rounded-sm px-5 text-[11px] tracking-[0.2em] uppercase transition active:scale-[0.98]"
              style={{ background: "var(--accent)", color: "var(--paper)" }}>
        {copied ? t.copied : t.copyCard}
      </button>
    </div>
  );
}
