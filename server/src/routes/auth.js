import { Router } from "express";
import jwt from "jsonwebtoken";
import { jwtSecret, safeEqual } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const password = String(req.body?.password ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return res.status(500).json({ error: "ADMIN_PASSWORD not configured" });

  if (!safeEqual(password, expected)) {
    // Blunt the brute-force edge without a full rate limiter.
    await new Promise((r) => setTimeout(r, 600));
    return res.status(401).json({ error: "Parol noto'g'ri" });
  }

  const token = jwt.sign({ role: "admin" }, jwtSecret(), { expiresIn: "14d" });
  res.json({ token });
});

export default router;
