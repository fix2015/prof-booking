import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { salonsApi } from "@/api/salons";
import { servicesApi } from "@/api/services";
import { mastersApi } from "@/api/masters";
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
  const { salonId: paramSalonId } = useParams();
  const [searchParams] = useSearchParams();
  const salonIdFromQuery = searchParams.get("id");
  const salonId = Number(paramSalonId || salonIdFromQuery);

  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<number | undefined>(undefined);

  const { data: salons, isLoading: salonsLoading } = useQuery({
    queryKey: ["salons", "public"],
    queryFn: () => salonsApi.listPublic(),
  });

  const activeSalonId = salonId || salons?.[0]?.id;
  const { data: salon } = useQuery({
    queryKey: ["salons", "public", activeSalonId],
    queryFn: () => salonsApi.getPublic(activeSalonId!),
    enabled: !!activeSalonId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", activeSalonId],
    queryFn: () => servicesApi.listBySalon(activeSalonId!),
    enabled: !!activeSalonId,
  });

  const { data: masters = [] } = useQuery({
    queryKey: ["masters", "salon", activeSalonId, "public"],
    queryFn: () => mastersApi.getSalonMastersPublic(activeSalonId!),
    enabled: !!activeSalonId,
  });

  const selectedServiceData = services.find((s) => s.id === selectedService);

  const { data: availableSlots = [] } = useQuery({
    queryKey: ["availability", activeSalonId, selectedDate, selectedService, selectedMaster],
    queryFn: () =>
      calendarApi.getAvailability(
        activeSalonId!,
        selectedDate,
        selectedServiceData?.duration_minutes || 60,
        selectedMaster
      ),
    enabled: !!activeSalonId && !!selectedDate && !!selectedService,
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
        salon_id: activeSalonId!,
        service_id: data.service_id,
        master_id: data.slot.master_id || data.master_id,
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

  if (salonsLoading) return <Spinner className="mx-auto mt-20" />;

  // Show salon selector if no salon selected
  if (!activeSalonId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-center mb-8 text-pink-800">Choose a Salon</h1>
          <div className="grid gap-4">
            {salons?.map((s) => (
              <a key={s.id} href={`/book/${s.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <p className="text-xl font-semibold">{s.name}</p>
                    {s.address && <p className="text-muted-foreground text-sm mt-1">{s.address}</p>}
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-700">Booking Confirmed!</h2>
            <p className="text-muted-foreground">
              Your appointment has been booked successfully.
            </p>
            <div className="rounded-lg bg-gray-50 p-4 text-left space-y-2 text-sm">
              <p><span className="font-medium">Salon:</span> {confirmation.salon_name}</p>
              {confirmation.service_name && <p><span className="font-medium">Service:</span> {confirmation.service_name}</p>}
              {confirmation.master_name && <p><span className="font-medium">Master:</span> {confirmation.master_name}</p>}
              <p><span className="font-medium">Date & Time:</span> {formatDateTime(confirmation.starts_at)}</p>
              {confirmation.price && <p><span className="font-medium">Price:</span> {formatCurrency(confirmation.price)}</p>}
              <p className="text-lg font-bold text-pink-700">
                Confirmation: {confirmation.confirmation_code}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              You'll receive an SMS confirmation to {confirmation.client_phone}
            </p>
            <a href={`/book/${activeSalonId}`} className="text-pink-600 hover:underline text-sm">
              Book another appointment
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="text-5xl mb-2">💅</div>
          <h1 className="text-3xl font-bold text-pink-800">{salon?.name}</h1>
          {salon?.address && <p className="text-pink-600 mt-1">{salon.address}</p>}
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-6">
            {bookingError && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {bookingError}
              </div>
            )}
            <BookingForm
              salonId={activeSalonId}
              services={services}
              masters={masters}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onSubmit={handleBooking as any}
              isLoading={isBooking}
              availableSlots={availableSlots}
              onServiceChange={(id) => { setSelectedService(id); }}
              onMasterChange={(id) => setSelectedMaster(id)}
              onDateChange={setSelectedDate}
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
