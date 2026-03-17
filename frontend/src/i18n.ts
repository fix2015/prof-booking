/**
 * Lightweight i18n utility — no external dependencies.
 * Supports en and ru locales. Add new keys to both objects.
 */

const translations = {
  en: {
    // Discover page
    "discover.title": "Discover Professionals",
    "discover.subtitle": "Browse and book top-rated specialists",
    "discover.search_placeholder": "Search by name…",
    "discover.filters": "Filters",
    "discover.filter.salon": "Salon / Provider",
    "discover.filter.service": "Service",
    "discover.filter.nationality": "Nationality",
    "discover.filter.min_experience": "Min. Experience",
    "discover.filter.all_salons": "All salons",
    "discover.filter.service_placeholder": "e.g. Manicure",
    "discover.filter.all_nationalities": "All nationalities",
    "discover.filter.experience_placeholder": "e.g. 3 years",
    "discover.filter.clear_all": "Clear all",
    "discover.filter.apply": "Apply",
    "discover.filter.independent": "Independent only",
    "discover.found": "{count} found",
    "discover.empty.title": "No professionals found",
    "discover.empty.subtitle": "Try adjusting your search or filters",
    "discover.empty.clear": "Clear filters",
    "discover.card.profile": "Profile",
    "discover.card.book": "Book",
    "discover.nav.find_salons": "Find Salons",
    "discover.nav.sign_in": "Sign in",

    // Booking management page
    "bookings.title": "My Bookings",
    "bookings.subtitle": "Look up your bookings using the phone number you booked with",
    "bookings.phone_label": "Phone Number",
    "bookings.phone_placeholder": "+1 (555) 000-0000",
    "bookings.lookup": "Look Up",
    "bookings.looking_up": "Looking up…",
    "bookings.no_bookings": "No bookings found for this phone number",
    "bookings.cancel": "Cancel Booking",
    "bookings.cancel.confirm": "Are you sure?",
    "bookings.cancel.reason_label": "Cancellation reason (optional)",
    "bookings.cancel.reason_placeholder": "e.g. Change of plans",
    "bookings.cancel.submit": "Confirm Cancellation",
    "bookings.cancel.cancelling": "Cancelling…",
    "bookings.cancel.back": "Back",
    "bookings.status.pending": "Pending",
    "bookings.status.confirmed": "Confirmed",
    "bookings.status.in_progress": "In Progress",
    "bookings.status.completed": "Completed",
    "bookings.status.cancelled": "Cancelled",
    "bookings.status.no_show": "No Show",
    "bookings.field.provider": "Salon",
    "bookings.field.service": "Service",
    "bookings.field.professional": "Professional",
    "bookings.field.date": "Date & Time",
    "bookings.field.price": "Price",
    "bookings.field.code": "Confirmation Code",
    "bookings.cancelled_reason": "Reason: {reason}",

    // Onboarding
    "onboarding.step": "Step {current} of {total}",
    "onboarding.next": "Next",
    "onboarding.back": "Back",
    "onboarding.finish": "Finish",

    // Common
    "common.search": "Search",
    "common.loading": "Loading…",
    "common.error": "Something went wrong",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.free": "Free",
  },
  ru: {
    // Discover page
    "discover.title": "Найти специалистов",
    "discover.subtitle": "Просматривайте и бронируйте лучших мастеров",
    "discover.search_placeholder": "Поиск по имени…",
    "discover.filters": "Фильтры",
    "discover.filter.salon": "Салон",
    "discover.filter.service": "Услуга",
    "discover.filter.nationality": "Национальность",
    "discover.filter.min_experience": "Мин. опыт",
    "discover.filter.all_salons": "Все салоны",
    "discover.filter.service_placeholder": "напр. Маникюр",
    "discover.filter.all_nationalities": "Все национальности",
    "discover.filter.experience_placeholder": "напр. 3 года",
    "discover.filter.clear_all": "Сбросить",
    "discover.filter.apply": "Применить",
    "discover.filter.independent": "Только независимые",
    "discover.found": "Найдено: {count}",
    "discover.empty.title": "Специалисты не найдены",
    "discover.empty.subtitle": "Попробуйте изменить запрос или фильтры",
    "discover.empty.clear": "Сбросить фильтры",
    "discover.card.profile": "Профиль",
    "discover.card.book": "Записаться",
    "discover.nav.find_salons": "Найти салоны",
    "discover.nav.sign_in": "Войти",

    // Booking management page
    "bookings.title": "Мои записи",
    "bookings.subtitle": "Найдите свои записи по номеру телефона",
    "bookings.phone_label": "Номер телефона",
    "bookings.phone_placeholder": "+7 (999) 000-0000",
    "bookings.lookup": "Найти",
    "bookings.looking_up": "Поиск…",
    "bookings.no_bookings": "Записи для этого номера не найдены",
    "bookings.cancel": "Отменить запись",
    "bookings.cancel.confirm": "Вы уверены?",
    "bookings.cancel.reason_label": "Причина отмены (необязательно)",
    "bookings.cancel.reason_placeholder": "напр. Изменились планы",
    "bookings.cancel.submit": "Подтвердить отмену",
    "bookings.cancel.cancelling": "Отмена…",
    "bookings.cancel.back": "Назад",
    "bookings.status.pending": "Ожидает",
    "bookings.status.confirmed": "Подтверждена",
    "bookings.status.in_progress": "В процессе",
    "bookings.status.completed": "Завершена",
    "bookings.status.cancelled": "Отменена",
    "bookings.status.no_show": "Не явился",
    "bookings.field.provider": "Салон",
    "bookings.field.service": "Услуга",
    "bookings.field.professional": "Мастер",
    "bookings.field.date": "Дата и время",
    "bookings.field.price": "Цена",
    "bookings.field.code": "Код подтверждения",
    "bookings.cancelled_reason": "Причина: {reason}",

    // Onboarding
    "onboarding.step": "Шаг {current} из {total}",
    "onboarding.next": "Далее",
    "onboarding.back": "Назад",
    "onboarding.finish": "Завершить",

    // Common
    "common.search": "Найти",
    "common.loading": "Загрузка…",
    "common.error": "Что-то пошло не так",
    "common.cancel": "Отмена",
    "common.save": "Сохранить",
    "common.free": "Бесплатно",
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

let currentLocale: Locale = (localStorage.getItem("locale") as Locale) || "en";

export function setLocale(locale: Locale) {
  currentLocale = locale;
  localStorage.setItem("locale", locale);
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
  const dict = translations[currentLocale] as Record<string, string>;
  let str = dict[key] ?? (translations.en as Record<string, string>)[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
