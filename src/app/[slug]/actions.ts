"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { addMessage, getBySlug, isRateLimited } from "@/lib/db";
import { MAX_AUTHOR, MAX_BODY } from "@/lib/limits";
import { UI, type Lang } from "@/lib/types";

export type GuestbookState = { ok: boolean; message: string } | null;

/** Hash the visitor's IP with the app secret. We only ever need "is this the
 *  same person who just posted?", never the address itself. */
async function ipHash(): Promise<string> {
  const h = await headers();
  const raw = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "";
  if (!raw) return "";
  return crypto
    .createHmac("sha256", process.env.SESSION_SECRET || "wl")
    .update(raw)
    .digest("base64url")
    .slice(0, 22);
}

// Control characters, minus \t and \n which we keep.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Tidy and clamp guest input. React renders this as plain text, so the job
 *  here is removing junk, not escaping HTML. */
function clean(input: string, max: number): string {
  return input.replace(CONTROL_CHARS, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
}

export async function submitMessage(
  _prev: GuestbookState,
  formData: FormData,
): Promise<GuestbookState> {
  const slug = String(formData.get("slug") ?? "");
  const inv = getBySlug(slug);
  if (!inv || !inv.published || inv.showGuestbook !== 1) {
    return { ok: false, message: "" };
  }

  const t = UI[inv.lang as Lang];
  const body = clean(String(formData.get("body") ?? ""), MAX_BODY);
  const author = clean(String(formData.get("author") ?? ""), MAX_AUTHOR);

  if (!body) return { ok: false, message: t.writeSomething };

  const hash = await ipHash();
  if (isRateLimited(hash)) return { ok: false, message: t.tooFast };

  addMessage({ invitationId: inv.id, author, body, ipHash: hash });
  revalidatePath(`/${slug}`);
  return { ok: true, message: t.sent };
}
