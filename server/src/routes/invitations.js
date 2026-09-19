import { Router } from "express";
import { Invitation, uniqueSlug } from "../models/Invitation.js";
import { Message } from "../models/Message.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const THEMES = ["zar", "firuza", "anor", "zaytun", "siyoh", "gul", "qahrabo"];

/** Only these come from the client. Anything else (slug, timestamps, _id) is
 *  decided server-side — a client must not be able to rewrite its own URL or
 *  inject unknown fields. */
const WRITABLE = [
  "theme", "lang", "published",
  "groomName", "brideName", "epigraph", "eventDate",
  "greetingTitle", "greetingBody", "inviteFrom",
  "venueName", "venueAddress", "venueLat", "venueLng",
  "schedule", "contacts", "gallery",
  "musicUrl", "heroImage", "giftCardNumber", "giftCardHolder",
  "showCountdown", "showCalendar", "showMap", "showSchedule", "showGallery",
  "showContacts", "showMusic", "showGift", "showGuestbook",
];

function pick(body) {
  const out = {};
  for (const k of WRITABLE) if (k in body) out[k] = body[k];

  if (out.theme && !THEMES.includes(out.theme)) out.theme = "zar";
  if (out.lang && !["uz", "ru"].includes(out.lang)) out.lang = "uz";

  // Empty strings arrive from cleared number inputs; store null, not NaN.
  for (const k of ["venueLat", "venueLng"]) {
    if (k in out) {
      const n = Number(out[k]);
      out[k] = out[k] === "" || out[k] === null || Number.isNaN(n) ? null : n;
    }
  }
  for (const k of ["schedule", "contacts", "gallery"]) {
    if (k in out && !Array.isArray(out[k])) out[k] = [];
  }
  return out;
}

router.get("/", async (_req, res) => {
  const list = await Invitation.find().sort({ createdAt: -1 }).lean();
  const counts = await Message.aggregate([{ $group: { _id: "$invitation", n: { $sum: 1 } } }]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({ invitations: list.map((i) => ({ ...i, messageCount: byId.get(String(i._id)) ?? 0 })) });
});

router.post("/", async (_req, res) => {
  const slug = await uniqueSlug("yangi-taklifnoma");
  const inv = await Invitation.create({ slug, published: false });
  res.status(201).json({ invitation: inv.toObject() });
});

/* ── guestbook moderation ──────────────────────────────────────────────
   Declared BEFORE the /:id routes: Express matches in order, so
   `DELETE /messages/abc` would otherwise be captured by `DELETE /:id` with
   id === "messages". */

router.patch("/messages/:id", async (req, res) => {
  const msg = await Message.findByIdAndUpdate(
    req.params.id,
    { hidden: Boolean(req.body?.hidden) },
    { new: true },
  ).lean();
  if (!msg) return res.status(404).json({ error: "not found" });
  res.json({ message: msg });
});

router.delete("/messages/:id", async (req, res) => {
  await Message.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

/* ── single invitation ─────────────────────────────────────────────────── */

router.get("/:id", async (req, res) => {
  const inv = await Invitation.findById(req.params.id).lean();
  if (!inv) return res.status(404).json({ error: "not found" });
  const messages = await Message.find({ invitation: inv._id }).sort({ createdAt: -1 }).lean();
  res.json({ invitation: inv, messages });
});

router.put("/:id", async (req, res) => {
  const existing = await Invitation.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "not found" });

  const update = pick(req.body ?? {});

  // A blank or duplicate slug would break the public URL, so derive one from
  // the couple's names rather than refusing to save.
  const requested =
    String(req.body?.slug ?? "").trim() ||
    `${update.groomName ?? existing.groomName}-${update.brideName ?? existing.brideName}`;
  update.slug = await uniqueSlug(requested, existing._id);

  const inv = await Invitation.findByIdAndUpdate(existing._id, update, { new: true }).lean();
  res.json({ invitation: inv });
});

router.delete("/:id", async (req, res) => {
  await Message.deleteMany({ invitation: req.params.id });
  await Invitation.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
