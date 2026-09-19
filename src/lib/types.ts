export type Lang = "uz" | "ru";

export type ScheduleItem = { time: string; title: string };
export type Contact = { name: string; phone: string };

/** One row of the `invitations` table, already JSON-decoded. */
export type Invitation = {
  id: number;
  slug: string;
  theme: string;
  lang: Lang;
  published: 0 | 1;

  groomName: string;
  brideName: string;
  /** Optional religious/poetic epigraph shown above the names. */
  epigraph: string;

  /** ISO-8601 local datetime, e.g. "2026-10-04T18:00". No timezone: a wedding
   *  happens at a wall-clock time in one place, so we never shift it. */
  eventDate: string;

  greetingTitle: string;
  greetingBody: string;
  inviteFrom: string;

  venueName: string;
  venueAddress: string;
  venueLat: number | null;
  venueLng: number | null;

  schedule: ScheduleItem[];
  gallery: string[];
  contacts: Contact[];
  musicUrl: string;
  heroImage: string;

  giftCardNumber: string;
  giftCardHolder: string;

  showCountdown: 0 | 1;
  showMap: 0 | 1;
  showGallery: 0 | 1;
  showSchedule: 0 | 1;
  showContacts: 0 | 1;
  showMusic: 0 | 1;
  showCalendar: 0 | 1;
  showGift: 0 | 1;
  showGuestbook: 0 | 1;

  createdAt: string;
  updatedAt: string;
};

export type GuestMessage = {
  id: number;
  invitationId: number;
  author: string;
  body: string;
  hidden: 0 | 1;
  createdAt: string;
};

/** Every string a guest can see, in both scripts we support.
 *  Admin-entered content is never translated — only this chrome is. */
export const UI = {
  uz: {
    openLetter: "Taklifnomani ochish",
    countdownTitle: "To'yga qoldi",
    days: "kun",
    hours: "soat",
    minutes: "daqiqa",
    seconds: "soniya",
    scheduleTitle: "Tadbir dasturi",
    venueTitle: "Manzil",
    galleryTitle: "Suratlar",
    contactsTitle: "Aloqa uchun",
    openInYandex: "Yandex xaritada ochish",
    openInGoogle: "Google xaritada ochish",
    musicOn: "Musiqa",
    theBigDay: "Kutib qolamiz!",
    scrollHint: "Pastga suring",
    giftTitle: "To'y sovg'asi",
    giftNote: "Yosh kelin-kuyovni tabriklamoqchi bo'lsangiz, ushbu kartaga o'tkazishingiz mumkin.",
    copyCard: "Karta raqamini nusxalash",
    copied: "Nusxalandi!",
    guestbookTitle: "Mehmonlar kitobi",
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
    turnHint: "Varaqlang",
    weekdays: ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"],
    months: [
      "yanvar", "fevral", "mart", "aprel", "may", "iyun",
      "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
    ],
  },
  ru: {
    openLetter: "Открыть приглашение",
    countdownTitle: "До свадьбы осталось",
    days: "дней",
    hours: "часов",
    minutes: "минут",
    seconds: "секунд",
    scheduleTitle: "Программа вечера",
    venueTitle: "Место проведения",
    galleryTitle: "Фотографии",
    contactsTitle: "Контакты",
    openInYandex: "Открыть в Яндекс Картах",
    openInGoogle: "Открыть в Google Картах",
    musicOn: "Музыка",
    theBigDay: "Будем рады видеть вас!",
    scrollHint: "Листайте вниз",
    giftTitle: "Свадебный подарок",
    giftNote: "Если вы хотите поздравить молодожёнов денежным подарком, вы можете отправить его на эту карту.",
    copyCard: "Скопировать номер карты",
    copied: "Скопировано!",
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
    turnHint: "Листайте",
    weekdays: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
    months: [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря",
    ],
  },
} as const;
