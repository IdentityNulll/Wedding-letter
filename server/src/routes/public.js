import { Router } from "express";
import { Invitation } from "../models/Invitation.js";
import { Message } from "../models/Message.js";
import { hashIp } from "../middleware/auth.js";

const router = Router();

const MAX_AUTHOR = 60;
const MAX_BODY = 600;
const RATE_WINDOW_MS = 45_000;

// Control characters except \t and \n.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function clean(input, max) {
  return String(input || "").replace(CONTROL, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
}

/** The invitation a guest sees, plus its visible guestbook messages. */
router.get("/:slug", async (req, res) => {
  const inv = await Invitation.findOne({ slug: req.params.slug }).lean();
  if (!inv || !inv.published) return res.status(404).json({ error: "not found" });

  const messages = inv.showGuestbook
    ? await Message.find({ invitation: inv._id, hidden: false }).sort({ createdAt: 1 }).lean()
    : [];

  res.json({ invitation: inv, messages });
});

router.post("/:slug/messages", async (req, res) => {
  const inv = await Invitation.findOne({ slug: req.params.slug }).select("_id published showGuestbook").lean();
  if (!inv || !inv.published || !inv.showGuestbook) return res.status(404).json({ error: "not found" });

  const body = clean(req.body?.body, MAX_BODY);
  const author = clean(req.body?.author, MAX_AUTHOR);
  if (!body) return res.status(400).json({ error: "empty" });

  const ipHash = hashIp(req);
  if (ipHash) {
    const recent = await Message.findOne({
      ipHash,
      createdAt: { $gt: new Date(Date.now() - RATE_WINDOW_MS) },
    })
      .select("_id")
      .lean();
    if (recent) return res.status(429).json({ error: "too fast" });
  }

  const msg = await Message.create({ invitation: inv._id, author, body, ipHash });
  res.status(201).json({ message: { ...msg.toObject(), ipHash: undefined } });
});

export default router;
