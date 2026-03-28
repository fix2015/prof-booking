import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: () => void;
}

export function SearchBar({ value, onChange, placeholder = "Search providers, services...", onSearch }: Props) {
  return (
    <div className="flex items-center bg-ds-bg-secondary rounded-ds-full border border-ds-border px-ds-3 h-[48px] gap-ds-2">
      {/* Location dot icon */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-ds-interactive">
        <circle cx="7" cy="7" r="2" fill="currentColor" />
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      <input
        className="flex-1 bg-transparent outline-none ds-body text-ds-text-primary placeholder:text-ds-text-disabled"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-ds-text-secondary"
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      ) : (
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-[32px] rounded-ds-full px-ds-3"
          onClick={onSearch}
        >
          Search
        </Button>
      )}
    </div>
  );
}
