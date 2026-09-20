/* Sample data:  npm run seed  */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "./db.js";
import { Invitation } from "./models/Invitation.js";
import { Message } from "./models/Message.js";

await connectDb();

await Message.deleteMany({});
await Invitation.deleteMany({});

const inv = await Invitation.create({
  slug: "azizbek-nargiza",
  theme: "zar",
  lang: "uz",
  published: true,
  groomName: "Azizbek",
  brideName: "Nargiza",
  epigraph: "Alloh ularning qalblarini muhabbat bilan bog'ladi",
  eventDate: "2026-10-04T18:00",
  greetingTitle: "Hurmatli mehmonlar!",
  greetingBody:
    "Farzandlarimizning turmush qurish marosimiga Sizni va oilangizni chin qalbdan taklif etamiz. " +
    "Bu quvonchli kunda biz bilan birga bo'lishingizdan mamnun bo'lamiz.",
  inviteFrom: "Karimovlar oilasi nomidan",
  venueName: "«Rohat» tantanalar saroyi",
  venueAddress: "Toshkent, Chilonzor tumani, Arnasoy ko'chasi 7/2",
  venueLat: 41.2995,
  venueLng: 69.2401,
  schedule: [
    { time: "18:00", title: "Mehmonlarni kutib olish" },
    { time: "19:00", title: "Tantanali qism" },
    { time: "21:00", title: "Raqs va musiqa" },
  ],
  contacts: [
    { name: "Akmal aka", phone: "+998 90 123 45 67" },
    { name: "Dilnoza opa", phone: "+998 91 234 56 78" },
  ],
});

await Message.create([
  { invitation: inv._id, author: "Akmal", body: "Baxtli bo'ling! Yosh oilaga farovonlik tilaymiz." },
  { invitation: inv._id, author: "", body: "Tabriklaymiz!" },
]);

console.log(`Seeded /${inv.slug}`);
await mongoose.disconnect();
