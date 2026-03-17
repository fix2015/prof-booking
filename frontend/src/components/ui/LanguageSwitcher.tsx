import { setLocale, getLocale, Locale } from "@/i18n";

const LANGS: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "pl", label: "PL", flag: "🇵🇱" },
  { code: "ro", label: "RO", flag: "🇷🇴" },
  { code: "uk", label: "UA", flag: "🇺🇦" },
  { code: "es", label: "ES", flag: "🇪🇸" },
];

export function LanguageSwitcher() {
  const current = getLocale();
  return (
    <select
      value={current}
      onChange={(e) => {
        setLocale(e.target.value as Locale);
        window.location.reload();
      }}
      className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 cursor-pointer"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.label}
        </option>
      ))}
    </select>
  );
}
