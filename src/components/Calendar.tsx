import { UI, type Lang } from "@/lib/types";

const SHORT = {
  uz: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
} as const;

/** Month grid with the wedding day ringed. Weeks start Monday, as they do in
 *  both Uzbek and Russian calendars — not Sunday. */
export default function Calendar({ date, lang }: { date: Date; lang: Lang }) {
  const t = UI[lang];
  const year = date.getFullYear();
  const month = date.getMonth();
  const theDay = date.getDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0=Sun..6=Sat. Shift so Monday is column 0.
  const firstCol = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array<null>(firstCol).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = t.months[month];

  return (
    <div className="mx-auto w-full max-w-xs">
      <p className="font-display mb-4 text-center text-2xl capitalize" style={{ color: "var(--accent-deep)" }}>
        {monthName} {year}
      </p>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {SHORT[lang].map((d) => (
          <div key={d} className="pb-1 text-[11px] tracking-wider uppercase" style={{ color: "var(--ink-soft)" }}>
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          const isDay = day === theDay;
          return (
            <div key={i} className="flex items-center justify-center">
              {day === null ? (
                <span className="block h-9 w-9" />
              ) : (
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[15px]"
                  style={
                    isDay
                      ? {
                          background: "var(--accent)",
                          color: "var(--paper)",
                          boxShadow: "0 0 0 3px color-mix(in srgb, var(--gold) 55%, transparent)",
                        }
                      : { color: "var(--ink-soft)" }
                  }
                  aria-current={isDay ? "date" : undefined}
                >
                  {day}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
