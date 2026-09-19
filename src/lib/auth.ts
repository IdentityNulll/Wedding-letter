import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "wl_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set it in .env.local (32+ random chars).",
    );
  }
  return s;
}

function adminPassword(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) throw new Error("ADMIN_PASSWORD is not set. Add it to .env.local.");
  return p;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

/** Constant-time compare that also tolerates length mismatch without throwing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Still burn a comparison so failures cost the same as successes.
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(input: string): boolean {
  return safeEqual(input, adminPassword());
}

export async function createSession(): Promise<void> {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = String(expires);
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [payload, mac] = raw.split(".");
  if (!payload || !mac) return false;
  if (!safeEqual(mac, sign(payload))) return false;
  const expires = Number(payload);
  return Number.isFinite(expires) && expires > Date.now();
}
