import { Provider } from "@/types";
import { MobileAvatar } from "./MobileAvatar";
import { StarRating } from "./StarRating";

interface Props {
  provider: Provider;
  variant?: "default" | "compact" | "list";
  saved?: boolean;
  onToggleSave?: (id: number) => void;
  onClick?: (id: number) => void;
  /** When a service is selected, pass its price here (overrides worker_payment_amount) */
  servicePrice?: number;
}

export function ProviderCard({ provider, variant = "default", saved = false, onToggleSave, onClick, servicePrice }: Props) {
  const displayPrice = servicePrice ?? (provider.worker_payment_amount > 0 ? provider.worker_payment_amount : null);
  const priceLabel = servicePrice != null ? `$${servicePrice}` : displayPrice != null ? `from $${displayPrice}` : null;
  if (variant === "list") {
    return (
      <div
        className="relative bg-ds-bg-primary rounded-ds-xl shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] cursor-pointer active:opacity-90 flex items-center gap-ds-3 px-ds-3 py-[14px] h-[100px]"
        onClick={() => onClick?.(provider.id)}
      >
        {/* Avatar 72×72 with rounded-lg corners (10px) */}
        <MobileAvatar
          name={provider.name}
          imageUrl={provider.logo_url ?? undefined}
          size="xl"
          shape="rounded"
        />

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
          <p className="ds-body-strong text-ds-text-primary truncate">{provider.name}</p>
          {provider.category && (
            <span className="self-start bg-ds-bg-tertiary rounded-ds-xs px-ds-2 py-[3px] ds-badge text-ds-text-secondary">
              {provider.category}
            </span>
          )}
          {/* Meta row: star rating + spacer + price pill */}
          <div className="flex items-center gap-[6px]">
            <StarRating rating={4} size="sm" />
            <span className="ds-caption text-ds-text-muted">4.8</span>
            <div className="flex-1" />
            {priceLabel && (
              <span className="bg-ds-interactive rounded-[20px] px-[10px] py-[4px] ds-label-small text-ds-text-inverse">
                {priceLabel}
              </span>
            )}
          </div>
        </div>

        {/* Heart */}
        <div className="absolute top-[10px] right-[10px]">
          <HeartButton saved={saved} onToggle={() => onToggleSave?.(provider.id)} />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className="flex items-center gap-ds-3 px-ds-4 py-ds-3 bg-ds-bg-primary border-b border-ds-border cursor-pointer active:bg-ds-bg-secondary"
        onClick={() => onClick?.(provider.id)}
      >
        <MobileAvatar name={provider.name} imageUrl={provider.logo_url ?? undefined} size="md" />
        <div className="flex-1 min-w-0">
          <p className="ds-body-strong text-ds-text-primary truncate">{provider.name}</p>
          {provider.address && (
            <p className="ds-caption text-ds-text-secondary truncate">{provider.address}</p>
          )}
        </div>
        <HeartButton saved={saved} onToggle={() => onToggleSave?.(provider.id)} />
      </div>
    );
  }

  return (
    <div
      className="bg-ds-bg-primary rounded-ds-2xl border border-ds-border overflow-hidden cursor-pointer active:opacity-90"
      onClick={() => onClick?.(provider.id)}
    >
      {/* Hero banner */}
      <div className="h-[120px] bg-ds-avatar-teal relative flex items-center justify-center">
        {provider.logo_url ? (
          <img src={provider.logo_url} alt={provider.name} className="w-full h-full object-cover" />
        ) : (
          <MobileAvatar name={provider.name} size="lg" />
        )}
        <div className="absolute top-ds-2 right-ds-2">
          <HeartButton saved={saved} onToggle={() => onToggleSave?.(provider.id)} />
        </div>
      </div>

      {/* Content */}
      <div className="p-ds-3 flex flex-col gap-[6px]">
        <p className="ds-body-strong text-ds-text-primary">{provider.name}</p>
        {provider.address && (
          <p className="ds-caption text-ds-text-secondary">{provider.address}</p>
        )}
        {provider.category && (
          <span className="inline-flex self-start bg-ds-bg-secondary rounded-ds-full px-ds-2 py-[2px] ds-badge text-ds-text-secondary">
            {provider.category}
          </span>
        )}
        <div className="flex items-center gap-ds-2 mt-[2px]">
          <StarRating rating={4} size="sm" />
          <span className="ds-caption text-ds-text-secondary">4.0</span>
          {priceLabel && (
            <>
              <span className="ds-caption text-ds-text-disabled">·</span>
              <span className="ds-caption text-ds-text-secondary">{priceLabel}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HeartButton({ saved, onToggle }: { saved: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="w-8 h-8 flex items-center justify-center rounded-ds-full bg-ds-bg-primary shadow-sm"
      aria-label={saved ? "Unsave" : "Save"}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill={saved ? "var(--ds-feedback-saved)" : "none"}>
        <path
          d="M8 13.5L1.5 7C0.8 6.3 0.5 5.3 0.5 4.5C0.5 2.5 2 1 4 1C5 1 6 1.5 7 2.5L8 3.5L9 2.5C10 1.5 11 1 12 1C14 1 15.5 2.5 15.5 4.5C15.5 5.3 15.2 6.3 14.5 7L8 13.5Z"
          stroke={saved ? "var(--ds-feedback-saved)" : "var(--ds-border-strong)"}
          strokeWidth="1.2"
        />
      </svg>
    </button>
  );
}
