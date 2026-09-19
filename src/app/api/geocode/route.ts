import { isAuthenticated } from "@/lib/auth";

/** Venue search, proxied to OpenStreetMap's Nominatim.
 *
 *  Proxied rather than called from the browser for three reasons: Nominatim
 *  requires an identifying User-Agent (a browser can't set one), it forbids
 *  heavy client-side use, and going through the server lets us cache and
 *  throttle centrally.
 *
 *  Admin-only — this is not an open geocoding endpoint for the internet. */

type NominatimHit = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  address?: Record<string, string>;
};

export type GeocodeResult = {
  label: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

// Nominatim's usage policy allows at most 1 request/second. One shared gate is
// enough: this endpoint only ever serves the handful of staff using the admin.
let lastCall = 0;
const MIN_GAP = 1100;

const cache = new Map<string, { at: number; data: GeocodeResult[] }>();
const CACHE_TTL = 10 * 60 * 1000;

export async function GET(req: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return Response.json({ results: [] });

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) {
    return Response.json({ results: hit.data });
  }

  const gap = Date.now() - lastCall;
  if (gap < MIN_GAP) await new Promise((r) => setTimeout(r, MIN_GAP - gap));
  lastCall = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  // Bias toward Uzbekistan, where essentially every venue will be.
  url.searchParams.set("countrycodes", "uz");
  url.searchParams.set("accept-language", "uz,ru,en");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "taklifnoma-wedding-invitations/1.0 (admin venue search)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return Response.json({ results: [], error: "upstream" }, { status: 502 });

    const raw = (await res.json()) as NominatimHit[];
    const results: GeocodeResult[] = raw.map((h) => {
      const a = h.address ?? {};
      const street = [a.road, a.house_number].filter(Boolean).join(" ");
      const city = a.city || a.town || a.village || a.county || "";
      const district = a.suburb || a.city_district || "";
      return {
        label: h.display_name,
        name: h.name || h.display_name.split(",")[0],
        address: [city, district, street].filter(Boolean).join(", ") || h.display_name,
        lat: Number(h.lat),
        lng: Number(h.lon),
      };
    });

    cache.set(key, { at: Date.now(), data: results });
    return Response.json({ results });
  } catch {
    // Network blip or timeout — the admin can still type the address by hand.
    return Response.json({ results: [], error: "unreachable" }, { status: 502 });
  }
}
