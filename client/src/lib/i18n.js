/** Every string a guest can see, in both scripts we support. Admin-entered
 *  content is never translated — only this chrome is. */
export const UI = {
  uz: {
    openLetter: "Taklifnomani ochish",
    turnHint: "Varaqlang",
    countdownTitle: "To'yga qoldi",
    days: "kun", hours: "soat", minutes: "daqiqa", seconds: "soniya",
    scheduleTitle: "Tadbir dasturi",
    venueTitle: "Manzil",
    galleryTitle: "Suratlar",
    contactsTitle: "Aloqa uchun",
    openInYandex: "Yandex xarita",
    openInGoogle: "Google xarita",
    musicOn: "Musiqa",
    theBigDay: "Kutib qolamiz!",
    guestbookTitle: "Tilaklar",
    guestbookNote: "Yosh oilaga tilaklaringizni yozib qoldiring.",
    yourName: "Ismingiz (ixtiyoriy)",
    yourMessage: "Tilagingiz",
    send: "Yuborish",
    sent: "Rahmat! Tilagingiz qabul qilindi.",
    anonymous: "Mehmon",
    emptyGuestbook: "Hali tilaklar yo'q — birinchi bo'ling!",
    tooFast: "Biroz kuting va qayta urinib ko'ring.",
    writeSomething: "Iltimos, tilak yozing.",
    prevPage: "Oldingi sahifa",
    nextPage: "Keyingi sahifa",
    pages: "Sahifalar",
    coverPage: "Muqova",
    weekdays: ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"],
    weekShort: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"],
    months: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  },
  ru: {
    openLetter: "Открыть приглашение",
    turnHint: "Листайте",
    countdownTitle: "До свадьбы осталось",
    days: "дней", hours: "часов", minutes: "минут", seconds: "секунд",
    scheduleTitle: "Программа вечера",
    venueTitle: "Место проведения",
    galleryTitle: "Фотографии",
    contactsTitle: "Контакты",
    openInYandex: "Яндекс Карты",
    openInGoogle: "Google Карты",
    musicOn: "Музыка",
    theBigDay: "Будем рады видеть вас!",
    guestbookTitle: "Гостевая книга",
    guestbookNote: "Оставьте свои пожелания молодой семье.",
    yourName: "Ваше имя (необязательно)",
    yourMessage: "Ваше пожелание",
    send: "Отправить",
    sent: "Спасибо! Ваше пожелание принято.",
    anonymous: "Гость",
    emptyGuestbook: "Пожеланий пока нет — будьте первым!",
    tooFast: "Подождите немного и попробуйте снова.",
    writeSomething: "Пожалуйста, напишите пожелание.",
    prevPage: "Предыдущая страница",
    nextPage: "Следующая страница",
    pages: "Страницы",
    coverPage: "Обложка",
    weekdays: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
    weekShort: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    months: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  },
};

export const THEMES = [
  { id: "zar",     label: { uz: "Zar — oltin va bordo",        ru: "Зар — золото и бордо" },        swatch: ["#7b1e2b", "#c9a227", "#fbf6ec"] },
  { id: "firuza",  label: { uz: "Firuza — Samarqand ko'ki",    ru: "Фируза — бирюза" },             swatch: ["#147c77", "#c9a227", "#f5faf9"] },
  { id: "anor",    label: { uz: "Anor — qizil va krem",        ru: "Анор — гранат и крем" },        swatch: ["#a81e28", "#d4a24c", "#fdf4f1"] },
  { id: "zaytun",  label: { uz: "Zaytun — zaytun va guruch",   ru: "Зайтун — олива и латунь" },     swatch: ["#5e6b33", "#b08d3f", "#f8f7ee"] },
  { id: "siyoh",   label: { uz: "Siyoh — tungi va marvarid",   ru: "Сиёх — ночь и жемчуг" },        swatch: ["#22355c", "#b9a46a", "#f4f5f8"] },
  { id: "gul",     label: { uz: "Gul — atirgul va mis",        ru: "Гул — роза и медь" },           swatch: ["#9e5560", "#c08457", "#fdf5f3"] },
  { id: "qahrabo", label: { uz: "Qahrabo — kahrabo va g'isht", ru: "Кахрабо — янтарь и терракота" }, swatch: ["#b05a28", "#ce9a3e", "#fdf6eb"] },
];

export const themeOr = (id) => (THEMES.some((t) => t.id === id) ? id : "zar");

/** Parse "YYYY-MM-DDTHH:mm" as local wall-clock time; null if malformed. */
export function parseEventDate(raw) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(raw || "");
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatLongDate(raw, lang) {
  const d = parseEventDate(raw);
  if (!d) return "";
  const t = UI[lang];
  return `${d.getDate()} ${t.months[d.getMonth()]} ${d.getFullYear()}, ${t.weekdays[d.getDay()]}`;
}

export function formatTime(raw) {
  const d = parseEventDate(raw);
  if (!d) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
