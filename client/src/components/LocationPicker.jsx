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
  const [provider, setProvider] = useState("google");
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
  const point = hasCoords ? `${Number(lat)},${Number(lng)}` : "";
  const encodedPoint = encodeURIComponent(point);
  const encodedLabel = encodeURIComponent([name, address].filter(Boolean).join(", "));
  const mapSrc = provider === "google"
    // maps.google.com serves the classic embed endpoint without requiring an
    // Embed API key. www.google.com/maps is a full app and often refuses iframes.
    ? `https://maps.google.com/maps?q=${encodedPoint}&z=17&output=embed`
    : `https://yandex.com/map-widget/v1/?ll=${Number(lng)}%2C${Number(lat)}&z=17&pt=${Number(lng)},${Number(lat)},pm2rdm`;
  const mapLink = provider === "google"
    ? `https://www.google.com/maps/search/?api=1&query=${encodedPoint || encodedLabel}`
    : `https://yandex.com/maps/?pt=${Number(lng)},${Number(lat)}&z=17&l=map`;

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
          <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 px-3 py-2">
            <div className="flex gap-1" role="tablist" aria-label="Xarita provayderi">
              {[
                ["google", "Google Maps"],
                ["yandex", "Yandex Maps"],
              ].map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={provider === id}
                        onClick={() => setProvider(id)}
                        className={`rounded px-2.5 py-1.5 text-xs ${provider === id ? "bg-white font-medium text-stone-900 shadow-sm ring-1 ring-stone-200" : "text-stone-500 hover:text-stone-900"}`}>
                  {label}
                </button>
              ))}
            </div>
            <a href={mapLink} target="_blank" rel="noopener noreferrer"
               className="text-xs font-medium text-stone-700 underline underline-offset-2">
              Xaritada ochish ↗
            </a>
          </div>
          <iframe title="Tanlangan joy" className="block h-44 w-full" loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapSrc} />
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
