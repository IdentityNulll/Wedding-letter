import { UI, type Lang } from "./types";

/** Parse the stored "YYYY-MM-DDTHH:mm" as *local wall-clock* time.
 *  new Date("...") on a bare datetime is local already, but we parse the parts
 *  explicitly so a malformed value returns null instead of Invalid Date. */
export function parseEventDate(raw: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(raw ?? "");
  if (!m) return null;
  const d = new Date(
    Number(m[1]), Number(m[2]) - 1, Number(m[3]),
    Number(m[4] ?? 0), Number(m[5] ?? 0),
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "4 oktabr 2026, Yakshanba" / "4 октября 2026, Воскресенье" */
export function formatLongDate(raw: string, lang: Lang): string {
  const d = parseEventDate(raw);
  if (!d) return "";
  const t = UI[lang];
  return `${d.getDate()} ${t.months[d.getMonth()]} ${d.getFullYear()}, ${t.weekdays[d.getDay()]}`;
}

export function formatTime(raw: string): string {
  const d = parseEventDate(raw);
  if (!d) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
