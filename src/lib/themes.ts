/** The 7 palettes. Same layout, same typography, same ornaments — only colour
 *  changes. Swatches are duplicated here (not read from CSS) so the admin can
 *  render preview chips without mounting the invitation itself. */
export type Theme = {
  id: string;
  label: { uz: string; ru: string };
  swatch: [string, string, string];
};

export const THEMES: Theme[] = [
  { id: "zar",     label: { uz: "Zar — oltin va bordo",      ru: "Зар — золото и бордо" },        swatch: ["#7B1E2B", "#C9A227", "#FBF6EC"] },
  { id: "firuza",  label: { uz: "Firuza — Samarqand ko'ki",  ru: "Фируза — самаркандская бирюза" }, swatch: ["#147C77", "#C9A227", "#F5FAF9"] },
  { id: "anor",    label: { uz: "Anor — qizil va krem",      ru: "Анор — гранат и крем" },         swatch: ["#A81E28", "#D4A24C", "#FDF4F1"] },
  { id: "zaytun",  label: { uz: "Zaytun — zaytun va guruch", ru: "Зайтун — олива и латунь" },      swatch: ["#5E6B33", "#B08D3F", "#F8F7EE"] },
  { id: "siyoh",   label: { uz: "Siyoh — tungi va marvarid", ru: "Сиёх — ночь и жемчуг" },         swatch: ["#22355C", "#B9A46A", "#F4F5F8"] },
  { id: "gul",     label: { uz: "Gul — atirgul va mis",      ru: "Гул — роза и медь" },            swatch: ["#9E5560", "#C08457", "#FDF5F3"] },
  { id: "qahrabo", label: { uz: "Qahrabo — kahrabo va g'isht", ru: "Кахрабо — янтарь и терракота" }, swatch: ["#B05A28", "#CE9A3E", "#FDF6EB"] },
];

export const DEFAULT_THEME = "zar";

export function isValidTheme(id: string): boolean {
  return THEMES.some((t) => t.id === id);
}

export function themeOr(id: string | undefined | null): string {
  return id && isValidTheme(id) ? id : DEFAULT_THEME;
}
