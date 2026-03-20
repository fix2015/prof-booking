import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, Instagram, ExternalLink, CheckCircle2, Users } from "lucide-react";
import { providersApi } from "@/api/salons";
import { servicesApi } from "@/api/services";
import { professionalsApi } from "@/api/masters";
import { calendarApi } from "@/api/calendar";
import { bookingApi } from "@/api/booking";
import { reviewsApi } from "@/api/reviews";
import { BookingForm } from "@/components/booking/BookingForm";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/utils/dates";
import { formatCurrency } from "@/utils/formatters";
import { BookingConfirmation } from "@/types";
import { CheckCircle } from "lucide-react";

export function PublicBookingPage() {
  // Support both /book/:providerId (new) and /book/:salonId (old) route params
  const { providerId: paramProviderId, salonId: paramSalonId } = useParams();
  const [searchParams] = useSearchParams();
  const idFromQuery = searchParams.get("id");
  const professionalIdParam = Number(searchParams.get("professional_id")) || undefined;
  const providerIdFromUrl = Number(paramProviderId || paramSalonId || idFromQuery) || undefined;

  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<number | undefined>(professionalIdParam);
  const [chosenProviderId, setChosenProviderId] = useState<number | null>(null);

  // If professional_id is in URL, fetch the professional to get their provider(s)
  const { data: preselectedProfessional, isLoading: profLoading } = useQuery({
    queryKey: ["professionals", professionalIdParam],
    queryFn: () => professionalsApi.getById(professionalIdParam!),
    enabled: !!professionalIdParam && !providerIdFromUrl,
  });

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ["providers", "public"],
    queryFn: () => providersApi.listPublic(),
  });

  // Active providers the professional works at
  const linkedActiveProviders = (preselectedProfessional?.professional_providers ?? [])
    .filter((pp) => pp.status === "active");

  const professionalProviderId =
    linkedActiveProviders.length === 1
      ? linkedActiveProviders[0].provider_id
      : chosenProviderId ?? undefined;

  const activeProviderId = providerIdFromUrl || professionalProviderId || providers?.[0]?.id;
  const { data: provider } = useQuery({
    queryKey: ["providers", "public", activeProviderId],
    queryFn: () => providersApi.getPublic(activeProviderId!),
    enabled: !!activeProviderId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", activeProviderId, professionalIdParam],
    queryFn: () =>
      professionalIdParam
        ? servicesApi.listByProfessional(professionalIdParam)
        : servicesApi.listByProvider(activeProviderId!),
    enabled: !!professionalIdParam || !!activeProviderId,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals", "provider", activeProviderId, "public"],
    queryFn: () => professionalsApi.getProviderProfessionalsPublic(activeProviderId!),
    enabled: !!activeProviderId,
  });

  // Professional profile extras (photos, reviews, stats) when preselected
  const { data: professionalPhotos = [] } = useQuery({
    queryKey: ["professional-photos", professionalIdParam],
    queryFn: () => professionalsApi.getPhotos(professionalIdParam!),
    enabled: !!professionalIdParam,
  });

  const { data: reviewStats } = useQuery({
    queryKey: ["review-stats", professionalIdParam],
    queryFn: () => reviewsApi.masterStats(professionalIdParam!).then((r) => r.data),
    enabled: !!professionalIdParam,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", professionalIdParam],
    queryFn: () =>
      reviewsApi.list({ professional_id: professionalIdParam }).then((r) =>
        r.data.filter((rev) => rev.is_published).slice(0, 5)
      ),
    enabled: !!professionalIdParam,
  });

  const selectedServiceData = services.find((s) => s.id === selectedService);

  const { data: availableSlots = [] } = useQuery({
    queryKey: ["availability", activeProviderId, selectedDate, selectedService, selectedProfessional],
    queryFn: () =>
      calendarApi.getAvailability(
        activeProviderId!,
        selectedDate,
        selectedServiceData?.duration_minutes || 60,
        selectedProfessional
      ),
    enabled: !!activeProviderId && !!selectedDate && !!selectedService,
  });

  const handleBooking = async (data: {
    service_id: number;

    master_id?: number;
    slot: { start_time: string; master_id: number };
    client_name: string;
    client_phone: string;
    client_email?: string;
    client_notes?: string;
  }) => {
    setIsBooking(true);
    setBookingError(null);
    try {
      const starts_at = `${selectedDate}T${data.slot.start_time}`;
      const result = await bookingApi.create({
        provider_id: activeProviderId!,
        service_id: data.service_id,
        professional_id: data.slot.master_id || data.master_id,
        client_name: data.client_name,
        client_phone: data.client_phone,
        client_email: data.client_email,
        client_notes: data.client_notes,
        starts_at,
      });
      setConfirmation(result);
    } catch (e) {
      setBookingError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Booking failed. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  if (providersLoading || (!!professionalIdParam && !providerIdFromUrl && profLoading)) return <Spinner className="mx-auto mt-20" />;

  // Show provider picker when professional works at multiple providers and none chosen yet
  if (
    professionalIdParam &&
    !providerIdFromUrl &&
    linkedActiveProviders.length > 1 &&
    !chosenProviderId
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6">
        <div className="mx-auto max-w-lg space-y-5">
          {/* Professional mini-header */}
          {preselectedProfessional && (
            <div className="flex items-center gap-3">
              {preselectedProfessional.avatar_url ? (
                <img
                  src={preselectedProfessional.avatar_url}
                  alt={preselectedProfessional.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-violet-300 flex items-center justify-center text-xl font-bold text-purple-700 shrink-0">
                  {preselectedProfessional.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{preselectedProfessional.name}</p>
                <p className="text-xs text-muted-foreground">works at {linkedActiveProviders.length} locations</p>
              </div>
            </div>
          )}

          <div>
            <h1 className="text-xl font-bold text-gray-800">Choose a location</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Where would you like to book your appointment?
            </p>
          </div>

          <div className="space-y-3">
            {linkedActiveProviders.map((pp) => {
              const pub = providers?.find((p) => p.id === pp.provider_id);
              const name = pub?.name ?? pp.provider?.name ?? `Location #${pp.provider_id}`;
              const address = pub?.address;
              const logo = pub?.logo_url;
              return (
                <button
                  key={pp.provider_id}
                  onClick={() => setChosenProviderId(pp.provider_id)}
                  className="w-full text-left"
                >
                  <Card className="hover:shadow-md hover:border-purple-300 transition-all cursor-pointer active:scale-[0.99]">
                    <CardContent className="p-4 flex items-center gap-3">
                      {logo ? (
                        <img src={logo} alt={name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center text-xl font-bold text-pink-800 shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{name}</p>
                        {address && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{address}</p>
                        )}
                      </div>
                      <span className="text-muted-foreground">›</span>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Show provider selector if no provider selected
  if (!activeProviderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Choose a Provider</h1>
          <div className="grid gap-4">
            {providers?.map((p) => (
              <a key={p.id} href={`/book/${p.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <p className="text-xl font-semibold">{p.name}</p>
                    {p.address && <p className="text-muted-foreground text-sm mt-1">{p.address}</p>}
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (confirmation) {
    // Support both new (provider_name, professional_name) and old (salon_name, master_name) fields
    const providerName = (confirmation as any).provider_name ?? (confirmation as any).salon_name;
    const professionalName = (confirmation as any).professional_name ?? (confirmation as any).master_name;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-700">Booking Confirmed!</h2>
            <p className="text-muted-foreground">
              Your appointment has been booked successfully.
            </p>
            <div className="rounded-lg bg-gray-50 p-4 text-left space-y-2 text-sm">
              {providerName && <p><span className="font-medium">Provider:</span> {providerName}</p>}
              {confirmation.service_name && <p><span className="font-medium">Service:</span> {confirmation.service_name}</p>}
              {professionalName && <p><span className="font-medium">Professional:</span> {professionalName}</p>}
              <p><span className="font-medium">Date & Time:</span> {formatDateTime(confirmation.starts_at)}</p>
              {confirmation.price && <p><span className="font-medium">Price:</span> {formatCurrency(confirmation.price)}</p>}
              <p className="text-lg font-bold text-gray-700">
                Confirmation: {confirmation.confirmation_code}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              You'll receive an SMS confirmation to {confirmation.client_phone}
            </p>
            <a href={`/book/${activeProviderId}`} className="text-gray-700 hover:underline text-sm">
              Book another appointment
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const instagram = preselectedProfessional?.social_links?.instagram;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Professional profile card */}
        {preselectedProfessional && (
          <Card className="shadow-md overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {preselectedProfessional.avatar_url && (
                  <img
                    src={preselectedProfessional.avatar_url}
                    alt={preselectedProfessional.name}
                    className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-purple-200"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{preselectedProfessional.name}</h2>
                      {preselectedProfessional.experience_years != null && (
                        <p className="text-sm text-muted-foreground">{preselectedProfessional.experience_years} yrs experience</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {instagram && (
                        <a
                          href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 font-medium"
                        >
                          <Instagram className="h-3.5 w-3.5" />
                          Instagram
                        </a>
                      )}
                      <Link
                        to={`/professionals/${preselectedProfessional.id}`}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Full Profile
                      </Link>
                    </div>
                  </div>
                  {preselectedProfessional.bio && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{preselectedProfessional.bio}</p>
                  )}
                  {/* Stats row */}
                  {reviewStats && (
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{reviewStats.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({reviewStats.total_reviews} reviews)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo gallery */}
              {professionalPhotos.length > 0 && (
                <div className="mt-4">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {professionalPhotos.map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.image_url}
                        alt={photo.caption ?? "Work photo"}
                        className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Reviews</p>
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{rev.client_name}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < rev.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rev.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Provider header */}
        <div className="text-center">
          <div className="text-4xl mb-2">✨</div>
          <h1 className="text-2xl font-bold text-gray-800">{provider?.name}</h1>
          {provider?.address && <p className="text-gray-600 mt-1 text-sm">{provider.address}</p>}
          {/* Back link when user chose from multiple providers */}
          {linkedActiveProviders.length > 1 && chosenProviderId && (
            <button
              onClick={() => setChosenProviderId(null)}
              className="mt-2 text-xs text-purple-600 hover:text-purple-700 underline"
            >
              ← Change location
            </button>
          )}
          <div className="flex items-center justify-center gap-3 mt-2">
            <Link
              to={`/providers/${activeProviderId}`}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <ExternalLink className="h-3 w-3" />
              View Provider
            </Link>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {professionals.length} professional{professionals.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-6">
            {bookingError && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {bookingError}
              </div>
            )}
            {/* Show preselected professional name if coming from professional link */}
            {professionalIdParam && preselectedProfessional && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-purple-50 border border-purple-200 px-3 py-2 text-sm text-purple-800">
                <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span>Booking with <span className="font-semibold">{preselectedProfessional.name}</span></span>
              </div>
            )}
            <BookingForm
              salonId={activeProviderId}
              services={services}
              masters={professionals}
              onSubmit={handleBooking as any}
              isLoading={isBooking}
              availableSlots={availableSlots}
              onServiceChange={(id) => { setSelectedService(id); }}
              onMasterChange={(id) => setSelectedProfessional(id)}
              onDateChange={setSelectedDate}
              selectedDate={selectedDate}
              preselectedMasterId={professionalIdParam}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
