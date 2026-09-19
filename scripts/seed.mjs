/* Dev-only sample data. Run after the app has started once (the app creates
 * the schema on first boot):  node scripts/seed.mjs                          */
import Database from "better-sqlite3";

const db = new Database("data/wedding.db");

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
  .all()
  .map((r) => r.name);

if (!tables.includes("invitations")) {
  console.error("Schema missing — start the app once first (npm run dev).");
  process.exit(1);
}

db.prepare("DELETE FROM guest_messages").run();
db.prepare("DELETE FROM invitations").run();

const { lastInsertRowid: id } = db
  .prepare(
    `INSERT INTO invitations
      (slug, theme, lang, published, groom_name, bride_name, epigraph, event_date,
       greeting_title, greeting_body, invite_from,
       venue_name, venue_address, venue_lat, venue_lng,
       schedule, gallery, contacts, music_url, hero_image,
       gift_card_number, gift_card_holder,
       show_countdown, show_map, show_gallery, show_schedule, show_contacts,
       show_music, show_calendar, show_gift, show_guestbook)
     VALUES
      (@slug, @theme, @lang, 1, @groom, @bride, @epigraph, @date,
       @title, @body, @from,
       @venue, @address, @lat, @lng,
       @schedule, '[]', @contacts, '', '',
       @card, @holder,
       1, 1, 0, 1, 1, 0, 1, 1, 1)`,
  )
  .run({
    slug: "azizbek-nargiza",
    theme: "zar",
    lang: "uz",
    groom: "Azizbek",
    bride: "Nargiza",
    epigraph: "Alloh ularning qalblarini muhabbat bilan bog'ladi",
    date: "2026-10-04T18:00",
    title: "Hurmatli mehmonlar!",
    body:
      "Farzandlarimizning turmush qurish marosimiga Sizni va oilangizni chin qalbdan taklif etamiz. " +
      "Bu quvonchli kunda biz bilan birga bo'lishingizdan mamnun bo'lamiz.",
    from: "Karimovlar oilasi nomidan",
    venue: "«Rohat» tantanalar saroyi",
    address: "Toshkent, Chilonzor tumani, Arnasoy ko'chasi 7/2",
    lat: 41.2995,
    lng: 69.2401,
    schedule: JSON.stringify([
      { time: "18:00", title: "Mehmonlarni kutib olish" },
      { time: "19:00", title: "Tantanali qism" },
      { time: "21:00", title: "Raqs va musiqa" },
    ]),
    contacts: JSON.stringify([
      { name: "Akmal aka", phone: "+998 90 123 45 67" },
      { name: "Dilnoza opa", phone: "+998 91 234 56 78" },
    ]),
    card: "8600123456789012",
    holder: "AZIZBEK KARIMOV",
  });

const msg = db.prepare(
  "INSERT INTO guest_messages (invitation_id, author, body) VALUES (?, ?, ?)",
);
msg.run(id, "Akmal", "Baxtli bo'ling! Yosh oilaga farovonlik tilaymiz.");
msg.run(id, "", "Tabriklaymiz!");

console.log(`Seeded invitation #${id} → /azizbek-nargiza`);
