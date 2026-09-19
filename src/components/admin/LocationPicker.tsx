"use client";

import { useEffect, useRef, useState } from "react";
import type { GeocodeResult } from "@/app/api/geocode/route";

/** Venue search. The admin types a place name and picks it from a list —
 *  latitude and longitude are filled in behind the scenes and never typed. */
export default function LocationPicker({
  name,
  address,
  lat,
  lng,
  onPick,
  onNameChange,
  onAddressChange,
}: {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  onPick: (r: { name: string; address: string; lat: number; lng: number }) => void;
  onNameChange: (v: string) => void;
  onAddressChange: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const seq = useRef(0);

  // Debounced search. `seq` guards against a slow earlier request landing after
  // a faster later one and overwriting fresher results.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setStatus("idle");
      return;
    }

    const mine = ++seq.current;
    setStatus("loading");
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { results?: GeocodeResult[] };
        if (mine !== seq.current) return;
        const list = data.results ?? [];
        setResults(list);
        setStatus(res.ok ? (list.length ? "idle" : "empty") : "error");
      } catch {
        if (mine === seq.current) setStatus("error");
      }
    }, 550);

    return () => window.clearTimeout(id);
  }, [query]);

  const hasCoords = lat !== null && lng !== null;

  return (
    <div className="grid gap-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-stone-700">Joyni qidirish</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Masalan: Rohat to'yxonasi Toshkent"
          className="min-h-11 w-full min-w-0 rounded-md border border-stone-300 bg-white px-3 py-2.5 text-[16px] outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
        />
        <span className="mt-1 block text-xs text-stone-500">
          To&apos;yxona nomini yozing va ro&apos;yxatdan tanlang — koordinatalar o&apos;zi to&apos;ladi.
        </span>
      </label>

      {status === "loading" && <p className="text-sm text-stone-500">Qidirilmoqda…</p>}
      {status === "empty" && (
        <p className="text-sm text-stone-500">Hech narsa topilmadi. Boshqacha yozib ko&apos;ring.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-amber-700">
          Qidiruv ishlamadi. Nomi va manzilini qo&apos;lda yozishingiz mumkin.
        </p>
      )}

      {results.length > 0 && (
        <ul className="grid gap-1.5 rounded-md border border-stone-200 bg-stone-50 p-1.5">
          {results.map((r, i) => (
            <li key={`${r.lat}-${r.lng}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  onPick({ name: r.name, address: r.address, lat: r.lat, lng: r.lng });
                  setResults([]);
                  setQuery("");
                }}
                className="w-full rounded px-3 py-2.5 text-left transition hover:bg-white"
              >
                <span className="block text-sm font-medium text-stone-900">{r.name}</span>
                <span className="mt-0.5 block text-xs text-stone-500">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-stone-700">To&apos;yxona nomi</span>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="«Rohat» to'yxonasi"
          className="min-h-11 w-full min-w-0 rounded-md border border-stone-300 bg-white px-3 py-2.5 text-[16px] outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-stone-700">Manzil</span>
        <input
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Toshkent, Chilonzor tumani…"
          className="min-h-11 w-full min-w-0 rounded-md border border-stone-300 bg-white px-3 py-2.5 text-[16px] outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
        />
      </label>

      {hasCoords ? (
        <div className="overflow-hidden rounded-md border border-stone-200">
          <iframe
            title="Tanlangan joy"
            className="block h-44 w-full"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng! - 0.005},${lat! - 0.0035},${lng! + 0.005},${lat! + 0.0035}&layer=mapnik&marker=${lat},${lng}`}
          />
          <p className="bg-stone-50 px-3 py-2 text-xs text-stone-500">
            Belgilangan: {lat!.toFixed(5)}, {lng!.toFixed(5)}
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
