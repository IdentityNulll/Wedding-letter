import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET is missing or too short. Set it in server/.env (32+ chars).");
  }
  return s;
}

/** Constant-time compare that tolerates length mismatch without throwing. */
export function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) {
    crypto.timingSafeEqual(ab, ab); // burn the same work on failure
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

/** Hash a visitor's IP with the app secret. We only ever need "is this the same
 *  person who just posted?", never the address itself. */
export function hashIp(req) {
  const raw = req.ip || "";
  if (!raw) return "";
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET || "wl")
    .update(raw)
    .digest("base64url")
    .slice(0, 22);
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "unauthorized" });
  try {
    jwt.verify(token, jwtSecret());
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
}
