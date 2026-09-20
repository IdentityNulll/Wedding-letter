import mongoose from "mongoose";

const { Schema } = mongoose;

const InvitationSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    theme: { type: String, default: "zar" },
    lang: { type: String, enum: ["uz", "ru"], default: "uz" },
    published: { type: Boolean, default: false },

    groomName: { type: String, default: "" },
    brideName: { type: String, default: "" },
    epigraph: { type: String, default: "" },

    /** "YYYY-MM-DDTHH:mm" — wall-clock, deliberately not a Date. A wedding
     *  happens at a local time in one place; storing UTC invites timezone bugs
     *  that would show guests the wrong hour. */
    eventDate: { type: String, default: "" },

    greetingTitle: { type: String, default: "" },
    greetingBody: { type: String, default: "" },
    inviteFrom: { type: String, default: "" },

    venueName: { type: String, default: "" },
    venueAddress: { type: String, default: "" },
    venueLat: { type: Number, default: null },
    venueLng: { type: Number, default: null },

    schedule: [{ _id: false, time: String, title: String }],
    contacts: [{ _id: false, name: String, phone: String }],
    gallery: [String],

    musicUrl: { type: String, default: "" },
    heroImage: { type: String, default: "" },

    showCountdown: { type: Boolean, default: true },
    showCalendar: { type: Boolean, default: true },
    showMap: { type: Boolean, default: true },
    showSchedule: { type: Boolean, default: true },
    showGallery: { type: Boolean, default: false },
    showContacts: { type: Boolean, default: true },
    showMusic: { type: Boolean, default: true },
    showGuestbook: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Invitation = mongoose.model("Invitation", InvitationSchema);

const CYRILLIC = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** URL-safe slug, transliterating Cyrillic so a Russian invitation still gets
 *  a readable Latin URL. */
export function slugify(input) {
  const s = String(input || "")
    .toLowerCase()
    .replace(/[''`']/g, "")
    .split("")
    .map((c) => CYRILLIC[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "taklifnoma";
}

/** Append -2, -3, … until free. `exceptId` lets an invitation keep its own. */
export async function uniqueSlug(base, exceptId) {
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  for (;;) {
    const hit = await Invitation.findOne({ slug: candidate }).select("_id").lean();
    if (!hit || String(hit._id) === String(exceptId)) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}
