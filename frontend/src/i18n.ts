/**
 * Lightweight i18n utility — no external dependencies.
 * Locales live in src/locales/; English ships in the main bundle (fallback + key types), the active
 * non-English locale is loaded before the first render (see loadLocale in main.tsx).
 */
import en from "./locales/en";
import type { TranslationKey, Translations } from "./locales/types";

export type { TranslationKey };
export type Locale = "en" | "pl" | "ro" | "uk" | "es";

const LOADERS: Record<Exclude<Locale, "en">, () => Promise<{ default: Translations }>> = {
  pl: () => import("./locales/pl"),
  ro: () => import("./locales/ro"),
  uk: () => import("./locales/uk"),
  es: () => import("./locales/es"),
};

const VALID_LOCALES = new Set<Locale>(["en", "pl", "ro", "uk", "es"]);
const COOKIE_KEY = "app_locale";
let dict: Translations = en;
function readLocaleCookie(): Locale {
  const match = document.cookie.match(/(?:^|;\s*)app_locale=([^;]+)/);
  const val = match?.[1] as Locale | undefined;
  return val && VALID_LOCALES.has(val) ? val : "en";
}

function writeLocaleCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `${COOKIE_KEY}=${locale};max-age=${maxAge};path=/;SameSite=Lax`;
  // keep localStorage in sync for SSR/hydration compatibility
  localStorage.setItem(COOKIE_KEY, locale);
}

let currentLocale: Locale = readLocaleCookie();

export function setLocale(locale: Locale) {
  currentLocale = locale;
  writeLocaleCookie(locale);
}

/** Load the active locale's strings (call once before rendering; English needs nothing). */
export async function loadLocale(): Promise<void> {
  if (currentLocale === "en") return;
  try {
    dict = (await LOADERS[currentLocale]()).default;
  } catch {
    dict = en; // offline / chunk failed — fall back to English
  }
}

export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Translate a key, replacing `{param}` placeholders with values.
 *
 * @example
 * t("discover.found", { count: 12 }) // "12 found"
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let str = dict[key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
