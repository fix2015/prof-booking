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
      className="ds-body border border-ds-border rounded-ds-xs px-ds-2 py-ds-1 bg-ds-bg-primary text-ds-text-primary cursor-pointer"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.label}
        </option>
      ))}
    </select>
  );
}
