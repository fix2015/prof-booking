import { useState, useRef, useEffect } from "react";
import { setLocale, getLocale, Locale } from "@/i18n";

const LANGS: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "pl", label: "PL", flag: "🇵🇱" },
  { code: "ro", label: "RO", flag: "🇷🇴" },
  { code: "uk", label: "UA", flag: "🇺🇦" },
  { code: "es", label: "ES", flag: "🇪🇸" },
];

export function LanguageSwitcher() {
  const current = LANGS.find((l) => l.code === getLocale()) ?? LANGS[0];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (code: Locale) => {
    setLocale(code);
    window.location.reload();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-[6px] h-[32px] px-[10px] border border-ds-border rounded-ds-lg bg-ds-bg-primary text-ds-text-primary ds-body-small hover:bg-ds-bg-secondary transition-colors"
      >
        <span>{current.flag}</span>
        <span className="font-semibold">{current.label}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`text-ds-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[120px] bg-ds-bg-primary border border-ds-border rounded-ds-lg shadow-lg overflow-hidden">
          {LANGS.map((l) => {
            const isActive = l.code === current.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => select(l.code)}
                className={`w-full flex items-center gap-[10px] px-[12px] py-[9px] ds-body-small text-left transition-colors ${
                  isActive
                    ? "bg-ds-bg-secondary text-ds-text-primary font-semibold"
                    : "text-ds-text-secondary hover:bg-ds-bg-secondary hover:text-ds-text-primary"
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto text-ds-interactive">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
