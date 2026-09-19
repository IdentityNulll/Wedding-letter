import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import multer from "multer";
import QRCode from "qrcode";
import { Invitation } from "../models/Invitation.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "uploads");

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["audio/mpeg", "mp3"],
  ["audio/mp4", "m4a"],
  ["audio/ogg", "ogg"],
]);

/** Filenames are always generated, never taken from the client — an upload
 *  named "../../x.png" must not be able to escape the uploads directory. */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED.get(file.mimetype) ?? "bin";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED.has(file.mimetype)),
});

router.post("/upload", requireAuth, upload.array("files", 12), (req, res) => {
  res.json({ paths: (req.files ?? []).map((f) => `/uploads/${f.filename}`) });
});

/* ── QR ────────────────────────────────────────────────────────────────── */

/** Error correction is fixed at H (30% recoverable): these get printed on
 *  textured card stock, often with an ornament dropped in the middle. */
router.get("/qr/:slug", async (req, res) => {
  const inv = await Invitation.findOne({ slug: req.params.slug }).select("slug").lean();
  if (!inv) return res.status(404).send("Not found");

  const origin = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",")[0].replace(/\/+$/, "");
  const target = `${origin}/${inv.slug}`;
  const opts = { errorCorrectionLevel: "H", margin: 2, color: { dark: "#000000", light: "#FFFFFF" } };

  if (req.query.format === "png") {
    const buf = await QRCode.toBuffer(target, { ...opts, type: "png", width: 1400 });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="${inv.slug}-qr.png"`);
    return res.send(buf);
  }

  const svg = await QRCode.toString(target, { ...opts, type: "svg", width: 1024 });
  res.setHeader("Content-Type", "image/svg+xml");
  res.send(svg);
});

/* ── Venue search ──────────────────────────────────────────────────────── */

// Nominatim's policy allows ~1 request/second and wants an identifying
// User-Agent (which a browser cannot set) — hence the server-side proxy.
let lastCall = 0;
const MIN_GAP = 1100;
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

router.get("/geocode", requireAuth, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 3) return res.json({ results: [] });

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return res.json({ results: hit.data });

  const gap = Date.now() - lastCall;
  if (gap < MIN_GAP) await new Promise((r) => setTimeout(r, MIN_GAP - gap));
  lastCall = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "uz");
  url.searchParams.set("accept-language", "uz,ru,en");

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "taklifnoma/1.0 (admin venue search)", Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) return res.status(502).json({ results: [], error: "upstream" });

    const raw = await upstream.json();
    const results = raw.map((h) => {
      const a = h.address ?? {};
      const street = [a.road, a.house_number].filter(Boolean).join(" ");
      const city = a.city || a.town || a.village || a.county || "";
      const district = a.suburb || a.city_district || "";
      return {
        label: h.display_name,
        name: h.name || String(h.display_name).split(",")[0],
        address: [city, district, street].filter(Boolean).join(", ") || h.display_name,
        lat: Number(h.lat),
        lng: Number(h.lon),
      };
    });

    cache.set(key, { at: Date.now(), data: results });
    res.json({ results });
  } catch {
    // Network blip — the admin can still type the address by hand.
    res.status(502).json({ results: [], error: "unreachable" });
  }
});

export default router;
