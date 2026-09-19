import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const field =
  "min-h-11 w-full min-w-0 rounded-md border border-stone-300 bg-white px-3 py-2.5 text-[16px] text-stone-900 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200";

/** Venue search: the admin types a place name and picks it from a list.
 *  Latitude and longitude are filled behind the scenes, never typed. */
export default function LocationPicker({ name, address, lat, lng, onPick, onNameChange, onAddressChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const seq = useRef(0);

  // Debounced. `seq` guards against a slow earlier request landing after a
  // faster later one and overwriting fresher results.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) { setResults([]); setStatus("idle"); return; }

    const mine = ++seq.current;
    setStatus("loading");
    const id = setTimeout(async () => {
      try {
        const { results: list = [] } = await api.geocode(q);
        if (mine !== seq.current) return;
        setResults(list);
        setStatus(list.length ? "idle" : "empty");
      } catch {
        if (mine === seq.current) setStatus("error");
      }
    }, 550);

    return () => clearTimeout(id);
  }, [query]);

  const hasCoords = lat != null && lng != null;

  return (
    <div className="grid grid-cols-1 gap-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-stone-700">Joyni qidirish</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)}
               placeholder="Masalan: Rohat to'yxonasi Toshkent" className={field} />
        <span className="mt-1 block text-xs text-stone-500">
          To&apos;yxona nomini yozing va ro&apos;yxatdan tanlang — koordinatalar o&apos;zi to&apos;ladi.
        </span>
      </label>

      {status === "loading" && <p className="text-sm text-stone-500">Qidirilmoqda…</p>}
      {status === "empty" && <p className="text-sm text-stone-500">Hech narsa topilmadi. Boshqacha yozib ko&apos;ring.</p>}
      {status === "error" && (
        <p className="text-sm text-amber-700">Qidiruv ishlamadi. Nomi va manzilini qo&apos;lda yozishingiz mumkin.</p>
      )}

      {results.length > 0 && (
        <ul className="grid gap-1.5 rounded-md border border-stone-200 bg-stone-50 p-1.5">
          {results.map((r, i) => (
            <li key={`${r.lat}-${r.lng}-${i}`}>
              <button type="button"
                      onClick={() => { onPick(r); setResults([]); setQuery(""); }}
                      className="w-full rounded px-3 py-2.5 text-left hover:bg-white">
                <span className="block text-sm font-medium text-stone-900">{r.name}</span>
                <span className="mt-0.5 block text-xs text-stone-500">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-stone-700">To&apos;yxona nomi</span>
        <input value={name ?? ""} onChange={(e) => onNameChange(e.target.value)} placeholder="«Rohat» to'yxonasi" className={field} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-stone-700">Manzil</span>
        <input value={address ?? ""} onChange={(e) => onAddressChange(e.target.value)} placeholder="Toshkent, Chilonzor tumani…" className={field} />
      </label>

      {hasCoords ? (
        <div className="overflow-hidden rounded-md border border-stone-200">
          <iframe title="Tanlangan joy" className="block h-44 w-full" loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.0035},${lng + 0.005},${lat + 0.0035}&layer=mapnik&marker=${lat},${lng}`} />
          <p className="bg-stone-50 px-3 py-2 text-xs text-stone-500">
            Belgilangan: {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </p>
        </div>
      ) : (
        <p className="rounded-md bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          Joy tanlanmagan — xarita ko&apos;rsatilmaydi, faqat manzil matni chiqadi.
        </p>
      )}
    </div>
  );
}
