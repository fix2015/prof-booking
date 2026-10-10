import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Search } from "lucide-react";
import { providersApi } from "@/api/salons";
import { AppHeader } from "@/components/mobile/AppHeader";
import { ProviderCard } from "@/components/mobile/ProviderCard";
import { useFavourites } from "@/hooks/useFavourites";
import { useNextAvailable } from "@/hooks/useBooking";
import { bookingPrefillUrl } from "@/utils/slots";
import { t } from "@/i18n";

/** Favourites tab: the providers this device saved (heart), newest first, with their next free slots. */
export function SavedPage() {
  const navigate = useNavigate();
  const { favourites, toggleFavourite } = useFavourites();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers", "favourites", favourites.join(",")],
    queryFn: () => providersApi.listByIds(favourites),
    enabled: favourites.length > 0,
    placeholderData: (prev) => prev,
  });
  // Unsaving hides the card immediately, before the refetch completes
  const saved = providers.filter((p) => favourites.includes(p.id));
  const { data: nextSlots } = useNextAvailable(saved.filter((p) => !p.is_demo).map((p) => p.id));

  const BrowseButton = (
    <button
      type="button"
      onClick={() => navigate("/")}
      aria-label={t("saved.browse")}
      className="w-8 h-8 flex items-center justify-center text-ds-text-primary"
    >
      <Search className="h-5 w-5" aria-hidden />
    </button>
  );

  return (
    <div className="flex flex-col min-h-full bg-ds-bg-secondary">
      <AppHeader variant="title-action" title={t("saved.title")} rightElement={BrowseButton} />

      <div className="flex-1 px-ds-4 py-ds-4">
        {favourites.length > 0 && isLoading ? (
          <div className="flex flex-col gap-ds-3">
            {favourites.slice(0, 3).map((id) => (
              <div key={id} className="h-[100px] bg-ds-bg-primary rounded-ds-xl border border-ds-border animate-pulse" />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-ds-12 gap-ds-4">
            <div className="w-[72px] h-[72px] rounded-ds-full bg-ds-bg-primary border border-ds-border flex items-center justify-center">
              <Heart className="h-8 w-8 text-ds-text-disabled" aria-hidden />
            </div>
            <div className="text-center">
              <p className="ds-body-strong text-ds-text-primary">{t("saved.empty_title")}</p>
              <p className="ds-body-small text-ds-text-secondary mt-ds-1">{t("saved.empty_subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-ds-6 h-[44px] bg-ds-interactive rounded-ds-xl ds-body-strong text-ds-text-inverse"
            >
              {t("saved.browse")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-ds-3">
            <p className="ds-body-small text-ds-text-secondary">{t("saved.count", { count: saved.length })}</p>
            {saved.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                variant="list"
                saved
                onToggleSave={toggleFavourite}
                onClick={(id) => navigate(`/providers/${id}`)}
                nextSlots={nextSlots?.[String(provider.id)]}
                onSlotSelect={(slot) =>
                  navigate(bookingPrefillUrl(provider.id, {
                    date: slot.slot_date,
                    time: slot.start_time.slice(0, 5),
                    professionalId: slot.professional_id,
                  }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
