import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/utils/cn";

export interface NationalityOption {
  label: string; // "Ukrainian"
  flag: string;  // "🇺🇦"
}

export const NATIONALITIES: NationalityOption[] = [
  { flag: "🇦🇫", label: "Afghan" },
  { flag: "🇦🇱", label: "Albanian" },
  { flag: "🇩🇿", label: "Algerian" },
  { flag: "🇦🇴", label: "Angolan" },
  { flag: "🇦🇷", label: "Argentine" },
  { flag: "🇦🇲", label: "Armenian" },
  { flag: "🇦🇺", label: "Australian" },
  { flag: "🇦🇹", label: "Austrian" },
  { flag: "🇦🇿", label: "Azerbaijani" },
  { flag: "🇧🇩", label: "Bangladeshi" },
  { flag: "🇧🇾", label: "Belarusian" },
  { flag: "🇧🇪", label: "Belgian" },
  { flag: "🇧🇴", label: "Bolivian" },
  { flag: "🇧🇦", label: "Bosnian" },
  { flag: "🇧🇷", label: "Brazilian" },
  { flag: "🇧🇬", label: "Bulgarian" },
  { flag: "🇰🇭", label: "Cambodian" },
  { flag: "🇨🇲", label: "Cameroonian" },
  { flag: "🇨🇦", label: "Canadian" },
  { flag: "🇨🇱", label: "Chilean" },
  { flag: "🇨🇳", label: "Chinese" },
  { flag: "🇨🇴", label: "Colombian" },
  { flag: "🇨🇷", label: "Costa Rican" },
  { flag: "🇭🇷", label: "Croatian" },
  { flag: "🇨🇺", label: "Cuban" },
  { flag: "🇨🇾", label: "Cypriot" },
  { flag: "🇨🇿", label: "Czech" },
  { flag: "🇩🇰", label: "Danish" },
  { flag: "🇩🇴", label: "Dominican" },
  { flag: "🇪🇨", label: "Ecuadorian" },
  { flag: "🇪🇬", label: "Egyptian" },
  { flag: "🇸🇻", label: "Salvadoran" },
  { flag: "🇪🇪", label: "Estonian" },
  { flag: "🇪🇹", label: "Ethiopian" },
  { flag: "🇫🇮", label: "Finnish" },
  { flag: "🇫🇷", label: "French" },
  { flag: "🇬🇪", label: "Georgian" },
  { flag: "🇩🇪", label: "German" },
  { flag: "🇬🇭", label: "Ghanaian" },
  { flag: "🇬🇷", label: "Greek" },
  { flag: "🇬🇹", label: "Guatemalan" },
  { flag: "🇭🇳", label: "Honduran" },
  { flag: "🇭🇺", label: "Hungarian" },
  { flag: "🇮🇸", label: "Icelandic" },
  { flag: "🇮🇳", label: "Indian" },
  { flag: "🇮🇩", label: "Indonesian" },
  { flag: "🇮🇷", label: "Iranian" },
  { flag: "🇮🇶", label: "Iraqi" },
  { flag: "🇮🇪", label: "Irish" },
  { flag: "🇮🇱", label: "Israeli" },
  { flag: "🇮🇹", label: "Italian" },
  { flag: "🇯🇲", label: "Jamaican" },
  { flag: "🇯🇵", label: "Japanese" },
  { flag: "🇯🇴", label: "Jordanian" },
  { flag: "🇰🇿", label: "Kazakhstani" },
  { flag: "🇰🇪", label: "Kenyan" },
  { flag: "🇰🇵", label: "North Korean" },
  { flag: "🇰🇷", label: "South Korean" },
  { flag: "🇽🇰", label: "Kosovar" },
  { flag: "🇰🇼", label: "Kuwaiti" },
  { flag: "🇰🇬", label: "Kyrgyz" },
  { flag: "🇱🇻", label: "Latvian" },
  { flag: "🇱🇧", label: "Lebanese" },
  { flag: "🇱🇾", label: "Libyan" },
  { flag: "🇱🇹", label: "Lithuanian" },
  { flag: "🇱🇺", label: "Luxembourgish" },
  { flag: "🇲🇰", label: "Macedonian" },
  { flag: "🇲🇾", label: "Malaysian" },
  { flag: "🇲🇻", label: "Maldivian" },
  { flag: "🇲🇱", label: "Malian" },
  { flag: "🇲🇽", label: "Mexican" },
  { flag: "🇲🇩", label: "Moldovan" },
  { flag: "🇲🇳", label: "Mongolian" },
  { flag: "🇲🇪", label: "Montenegrin" },
  { flag: "🇲🇦", label: "Moroccan" },
  { flag: "🇳🇵", label: "Nepali" },
  { flag: "🇳🇱", label: "Dutch" },
  { flag: "🇳🇿", label: "New Zealander" },
  { flag: "🇳🇬", label: "Nigerian" },
  { flag: "🇳🇴", label: "Norwegian" },
  { flag: "🇵🇰", label: "Pakistani" },
  { flag: "🇵🇦", label: "Panamanian" },
  { flag: "🇵🇾", label: "Paraguayan" },
  { flag: "🇵🇪", label: "Peruvian" },
  { flag: "🇵🇭", label: "Filipino" },
  { flag: "🇵🇱", label: "Polish" },
  { flag: "🇵🇹", label: "Portuguese" },
  { flag: "🇵🇷", label: "Puerto Rican" },
  { flag: "🇶🇦", label: "Qatari" },
  { flag: "🇷🇴", label: "Romanian" },
  { flag: "🇷🇺", label: "Russian" },
  { flag: "🇸🇦", label: "Saudi" },
  { flag: "🇷🇸", label: "Serbian" },
  { flag: "🇸🇬", label: "Singaporean" },
  { flag: "🇸🇰", label: "Slovak" },
  { flag: "🇸🇮", label: "Slovenian" },
  { flag: "🇸🇴", label: "Somali" },
  { flag: "🇿🇦", label: "South African" },
  { flag: "🇸🇸", label: "South Sudanese" },
  { flag: "🇪🇸", label: "Spanish" },
  { flag: "🇱🇰", label: "Sri Lankan" },
  { flag: "🇸🇩", label: "Sudanese" },
  { flag: "🇸🇪", label: "Swedish" },
  { flag: "🇨🇭", label: "Swiss" },
  { flag: "🇸🇾", label: "Syrian" },
  { flag: "🇹🇼", label: "Taiwanese" },
  { flag: "🇹🇯", label: "Tajik" },
  { flag: "🇹🇿", label: "Tanzanian" },
  { flag: "🇹🇭", label: "Thai" },
  { flag: "🇹🇳", label: "Tunisian" },
  { flag: "🇹🇷", label: "Turkish" },
  { flag: "🇹🇲", label: "Turkmen" },
  { flag: "🇺🇬", label: "Ugandan" },
  { flag: "🇺🇦", label: "Ukrainian" },
  { flag: "🇦🇪", label: "Emirati" },
  { flag: "🇬🇧", label: "British" },
  { flag: "🇺🇸", label: "American" },
  { flag: "🇺🇾", label: "Uruguayan" },
  { flag: "🇺🇿", label: "Uzbek" },
  { flag: "🇻🇪", label: "Venezuelan" },
  { flag: "🇻🇳", label: "Vietnamese" },
  { flag: "🇾🇪", label: "Yemeni" },
  { flag: "🇿🇲", label: "Zambian" },
  { flag: "🇿🇼", label: "Zimbabwean" },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function NationalitySelect({ value, onChange, placeholder = "Select nationality…", className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = NATIONALITIES.find((n) => n.label === value) ?? null;

  const filtered = query.trim()
    ? NATIONALITIES.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
    : NATIONALITIES;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (option: NationalityOption) => {
    onChange(option.label);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  const handleToggle = () => {
    setOpen((prev) => !prev);
    if (!open) setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "transition-colors"
        )}
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span className="text-lg leading-none">{selected.flag}</span>
            <span>{selected.label}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {selected && (
            <span
              onClick={handleClear}
              className="hover:text-destructive text-muted-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg">
          {/* Search */}
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-sm border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {/* Options */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No results</li>
            ) : (
              filtered.map((n) => (
                <li
                  key={n.label}
                  onClick={() => handleSelect(n)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-accent",
                    value === n.label && "bg-accent font-medium"
                  )}
                >
                  <span className="text-lg leading-none">{n.flag}</span>
                  <span>{n.label}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
