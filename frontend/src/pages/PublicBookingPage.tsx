import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { providersApi } from "@/api/salons";
import { servicesApi } from "@/api/services";
import { professionalsApi } from "@/api/masters";
import { calendarApi } from "@/api/calendar";
import { bookingApi } from "@/api/booking";
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

  // If professional_id is in URL, fetch the professional to get their provider
  const { data: preselectedProfessional, isLoading: profLoading } = useQuery({
    queryKey: ["professionals", professionalIdParam],
    queryFn: () => professionalsApi.getById(professionalIdParam!),
    enabled: !!professionalIdParam && !providerIdFromUrl,
  });

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ["providers", "public"],
    queryFn: () => providersApi.listPublic(),
  });

  const professionalProviderId = preselectedProfessional?.professional_providers?.[0]?.provider_id;
  const activeProviderId = providerIdFromUrl || professionalProviderId || providers?.[0]?.id;
  const { data: provider } = useQuery({
    queryKey: ["providers", "public", activeProviderId],
    queryFn: () => providersApi.getPublic(activeProviderId!),
    enabled: !!activeProviderId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", activeProviderId],
    queryFn: () => servicesApi.listByProvider(activeProviderId!),
    enabled: !!activeProviderId,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals", "provider", activeProviderId, "public"],
    queryFn: () => professionalsApi.getProviderProfessionalsPublic(activeProviderId!),
    enabled: !!activeProviderId,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="text-5xl mb-2">✨</div>
          <h1 className="text-3xl font-bold text-gray-800">{provider?.name}</h1>
          {provider?.address && <p className="text-gray-700 mt-1">{provider.address}</p>}
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
                <span className="font-medium">Professional:</span>
                {preselectedProfessional.avatar_url && (
                  <img src={preselectedProfessional.avatar_url} alt={preselectedProfessional.name}
                    className="w-6 h-6 rounded-full object-cover" />
                )}
                {preselectedProfessional.name}
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
