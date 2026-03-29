import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePublicProvider } from "@/hooks/useSalon";
import { useProviderProfessionalsPublic } from "@/hooks/useMaster";
import { useAvailability, useAvailableDates, useCreateBooking } from "@/hooks/useBooking";
import { servicesApi } from "@/api/services";
import { AppHeader } from "@/components/mobile/AppHeader";
import { MobileAvatar } from "@/components/mobile/MobileAvatar";
import { TimeSlotButton } from "@/components/mobile/TimeSlotButton";
import { t } from "@/i18n";
import { useGuestSession } from "@/hooks/useGuestSession";
import type { Service, Professional, AvailableSlot } from "@/types";

type Step = 1 | 2 | 3 | 4 | 5;

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatTime(slot: AvailableSlot): string {
  return slot.start_time.slice(0, 5);
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function PublicBookingPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = Number(providerId);

  const preselectedServiceId = searchParams.get("service_id");

  const { data: provider } = usePublicProvider(id);
  const { data: professionals = [] } = useProviderProfessionalsPublic(id);
  const { data: services = [] } = useQuery({
    queryKey: ["services", "provider", id],
    queryFn: () => servicesApi.listByProvider(id),
    enabled: !!id,
  });

  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(
    preselectedServiceId
      ? (services.find((s) => s.id === Number(preselectedServiceId)) ?? null)
      : null
  );
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  const today = new Date();
  const [calMonth, setCalMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const calDays = getDaysInMonth(calMonth.year, calMonth.month);

  // First and last day of visible month for available-dates query
  const calDateFrom = formatDate(new Date(calMonth.year, calMonth.month, 1));
  const calDateTo = formatDate(new Date(calMonth.year, calMonth.month + 1, 0));
  const { data: availableDates = [] } = useAvailableDates(
    id,
    calDateFrom,
    calDateTo,
    selectedService?.duration_minutes ?? 60,
    selectedProfessional?.id
  );
  const availableDateSet = new Set(availableDates);

  const { data: slots = [] } = useAvailability(
    id,
    selectedDate,
    selectedService?.duration_minutes ?? 60,
    selectedProfessional?.id
  );

  const createBooking = useCreateBooking();
  const { guestProfile, setGuestProfile, addGuestBooking } = useGuestSession();

  // Prefill form from guest profile when step 5 opens
  useEffect(() => {
    if (step !== 5) return;
    const source = guestProfile;
    if (!source) return;
    setForm((f) => ({
      ...f,
      name: f.name || source.name,
      phone: f.phone || source.phone,
      email: f.email || source.email,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const phoneValid = /^\+?[\d\s\-().]{6,20}$/.test(form.phone.trim());
  const canProceed = form.name.trim().length > 0 && phoneValid;

  function handleBack() {
    if (step > 1) setStep((step - 1) as Step);
    else navigate(-1);
  }

  async function handleConfirm() {
    if (!selectedService || !selectedSlot) return;
    const startsAt = `${selectedSlot.slot_date}T${selectedSlot.start_time}`;
    createBooking.mutate(
      {
        provider_id: id,
        service_id: selectedService.id,
        professional_id: selectedProfessional?.id,
        client_name: form.name,
        client_phone: form.phone,
        client_email: form.email || undefined,
        client_notes: form.notes || undefined,
        starts_at: startsAt,
      },
      {
        onSuccess: (confirmation) => {
          setGuestProfile({ name: form.name, phone: form.phone, email: form.email });
          addGuestBooking(confirmation);
          navigate("/me");
        },
      }
    );
  }

  const STEP_LABELS = [
    t("booking.step.service"),
    t("booking.step.professional"),
    t("booking.step.date"),
    t("booking.step.time"),
    t("booking.step.confirm"),
  ];

  return (
    <div className="max-w-[768px] mx-auto min-h-screen flex flex-col bg-ds-bg-secondary">
      <AppHeader variant="back-title" title={t("booking.book_title")} onBack={handleBack} />

      {/* Progress indicator */}
      <div className="bg-ds-bg-primary px-ds-4 py-ds-3 border-b border-ds-border flex gap-ds-1">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-[4px]">
            <div
              className={`h-[3px] rounded-ds-full w-full ${
                i + 1 <= step ? "bg-ds-interactive" : "bg-ds-border"
              }`}
            />
            <span className={`ds-tab-label ${i + 1 === step ? "text-ds-interactive" : "text-ds-text-disabled"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Provider info */}
      {provider && (
        <div className="bg-ds-bg-primary px-ds-4 py-ds-3 flex items-center gap-ds-3 border-b border-ds-border">
          <MobileAvatar name={provider.name} size="sm" imageUrl={provider.logo_url ?? undefined} />
          <div className="flex-1 min-w-0">
            <p className="ds-body-strong text-ds-text-primary truncate">{provider.name}</p>
            {provider.address && (
              <p className="ds-caption text-ds-text-secondary truncate">{provider.address}</p>
            )}
          </div>
          <button
            onClick={() => navigate(`/providers/${id}`)}
            className="ds-caption text-ds-interactive flex-shrink-0"
          >
            {t("booking.view")}
          </button>
        </div>
      )}

      <div className="flex-1 px-ds-4 py-ds-4">
        {/* Step 1: Service */}
        {step === 1 && (
          <div className="flex flex-col gap-ds-2">
            <p className="ds-h4 text-ds-text-primary mb-ds-2">{t("booking.select_service_heading")}</p>
            {services.length === 0 ? (
              <p className="ds-body text-ds-text-secondary">{t("booking.no_services")}</p>
            ) : (
              services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep(2); }}
                  className={`w-full flex items-center gap-ds-3 p-ds-3 rounded-ds-xl border transition-colors ${
                    selectedService?.id === service.id
                      ? "border-ds-interactive bg-ds-interactive"
                      : "border-ds-border bg-ds-bg-primary"
                  }`}
                >
                  <div className="flex-1 text-left">
                    <p className={`ds-body-strong ${selectedService?.id === service.id ? "text-ds-text-inverse" : "text-ds-text-primary"}`}>
                      {service.name}
                    </p>
                    <p className={`ds-caption ${selectedService?.id === service.id ? "text-ds-text-inverse" : "text-ds-text-secondary"}`}>
                      {service.duration_minutes} min
                    </p>
                  </div>
                  <p className={`ds-body-strong ${selectedService?.id === service.id ? "text-ds-text-inverse" : "text-ds-text-primary"}`}>
                    ${service.price}
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Professional */}
        {step === 2 && (
          <div className="flex flex-col gap-ds-3">
            <p className="ds-h4 text-ds-text-primary mb-ds-1">{t("booking.select_professional_heading")}</p>
            <p className="ds-caption text-ds-text-secondary">{t("booking.optional_skip")}</p>
            <div className="grid grid-cols-3 gap-ds-3">
              <button
                onClick={() => { setSelectedProfessional(null); setStep(3); }}
                className={`flex flex-col items-center gap-ds-2 p-ds-3 rounded-ds-xl border ${
                  selectedProfessional ? "border-ds-border bg-ds-bg-primary" : "border-ds-interactive bg-ds-interactive"
                }`}
              >
                <div className="w-10 h-10 rounded-ds-full bg-ds-bg-secondary flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-ds-text-secondary">
                    <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M3 16C3 13 5.686 11 9 11C12.314 11 15 13 15 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                <span className={`ds-caption text-center ${selectedProfessional ? "text-ds-text-primary" : "text-ds-text-inverse"}`}>
                  {t("booking.any")}
                </span>
              </button>
              {professionals.map((pro) => (
                <button
                  key={pro.id}
                  onClick={() => { setSelectedProfessional(pro); setStep(3); }}
                  className={`flex flex-col items-center gap-ds-2 p-ds-3 rounded-ds-xl border ${
                    selectedProfessional?.id === pro.id
                      ? "border-ds-interactive bg-ds-interactive"
                      : "border-ds-border bg-ds-bg-primary"
                  }`}
                >
                  <MobileAvatar name={pro.name} size="md" imageUrl={pro.avatar_url ?? undefined} />
                  <span className={`ds-caption text-center leading-tight ${selectedProfessional?.id === pro.id ? "text-ds-text-inverse" : "text-ds-text-primary"}`}>
                    {pro.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date */}
        {step === 3 && (
          <div className="flex flex-col gap-ds-3">
            <p className="ds-h4 text-ds-text-primary mb-ds-1">{t("booking.select_date_heading")}</p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCalMonth((m) => { const d = new Date(m.year, m.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
                className="w-8 h-8 flex items-center justify-center text-ds-text-secondary"
              >‹</button>
              <span className="ds-body-strong text-ds-text-primary">
                {new Date(calMonth.year, calMonth.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button
                onClick={() => setCalMonth((m) => { const d = new Date(m.year, m.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
                className="w-8 h-8 flex items-center justify-center text-ds-text-secondary"
              >›</button>
            </div>
            <div className="grid grid-cols-7 gap-[2px]">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-center ds-caption text-ds-text-secondary py-[4px]">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-[2px]">
              {Array.from({ length: calDays[0].getDay() }, (_, i) => <div key={`e-${i}`} />)}
              {calDays.map((day) => {
                const dateStr = formatDate(day);
                const isPast = day < new Date(formatDate(today));
                const hasSlots = availableDateSet.has(dateStr);
                const isDisabled = isPast || !hasSlots;
                const isSelected = dateStr === selectedDate;
                let dayCls = "text-ds-text-primary hover:bg-ds-bg-secondary";
                if (isDisabled) dayCls = "text-ds-text-disabled cursor-not-allowed";
                else if (isSelected) dayCls = "bg-ds-interactive text-ds-text-inverse";
                return (
                  <button
                    key={dateStr}
                    disabled={isDisabled}
                    onClick={() => { setSelectedDate(dateStr); setStep(4); }}
                    className={`h-[36px] rounded-ds-md ds-body-small transition-colors ${dayCls}`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Time slots */}
        {step === 4 && (
          <div className="flex flex-col gap-ds-3">
            <p className="ds-h4 text-ds-text-primary mb-ds-1">{t("booking.select_time_heading")}</p>
            <p className="ds-caption text-ds-text-secondary">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            {slots.length === 0 ? (
              <div className="text-center py-ds-8">
                <p className="ds-body text-ds-text-secondary">{t("booking.no_availability")}</p>
                <button onClick={() => setStep(3)} className="ds-body-small text-ds-interactive mt-ds-2">{t("booking.choose_another_date")}</button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-ds-2">
                {slots.map((slot) => (
                  <TimeSlotButton
                    key={`${slot.professional_id}-${slot.start_time}`}
                    time={formatTime(slot)}
                    professionalName={slot.professional_name}
                    selected={selectedSlot?.start_time === slot.start_time && selectedSlot?.professional_id === slot.professional_id}
                    onClick={() => { setSelectedSlot(slot); setStep(5); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="flex flex-col gap-ds-4">
            <p className="ds-h4 text-ds-text-primary">{t("booking.your_details")}</p>
            <div className="bg-ds-bg-primary rounded-ds-xl border border-ds-border p-ds-3 flex flex-col gap-ds-2">
              {selectedService && (
                <div className="flex justify-between">
                  <span className="ds-body text-ds-text-secondary">{t("booking.summary_service")}</span>
                  <span className="ds-body-strong text-ds-text-primary">{selectedService.name}</span>
                </div>
              )}
              {selectedProfessional && (
                <div className="flex justify-between">
                  <span className="ds-body text-ds-text-secondary">{t("booking.summary_professional")}</span>
                  <span className="ds-body-strong text-ds-text-primary">{selectedProfessional.name}</span>
                </div>
              )}
              {selectedSlot && (
                <div className="flex justify-between">
                  <span className="ds-body text-ds-text-secondary">{t("booking.summary_datetime")}</span>
                  <span className="ds-body-strong text-ds-text-primary">{t("booking.date_at_time", { date: selectedDate, time: formatTime(selectedSlot) })}</span>
                </div>
              )}
              {selectedService && (
                <div className="flex justify-between border-t border-ds-border pt-ds-2">
                  <span className="ds-body-strong text-ds-text-primary">{t("booking.summary_total")}</span>
                  <span className="ds-body-strong text-ds-text-primary">${selectedService.price}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-ds-3">
              {(["phone", "name", "email", "notes"] as const).map((key) => {
                const required = key === "phone" || key === "name";
                const fieldLabels = {
                  phone: t("booking.field.phone"),
                  name: `${t("booking.field.full_name")} *`,
                  email: t("booking.field.email"),
                  notes: t("booking.field.notes"),
                };
                const fieldPlaceholders = { phone: "+1 (555) 000-0000", name: "Jane Smith", email: "jane@example.com", notes: "Any special requests..." };
                const fieldTypes = { phone: "tel", name: "text", email: "email", notes: "text" };
                const isPhoneError = key === "phone" && form.phone.trim().length > 0 && !phoneValid;
                return (
                  <div key={key}>
                    <label className="block mb-ds-1 text-[13px] font-semibold leading-[18px] text-ds-text-secondary">
                      {fieldLabels[key]}
                    </label>
                    <input
                      type={fieldTypes[key]}
                      placeholder={fieldPlaceholders[key]}
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      required={required}
                      className={`w-full h-[48px] px-ds-3 bg-ds-bg-primary border rounded-ds-lg ds-body text-ds-text-primary placeholder:text-ds-text-disabled outline-none focus:border-ds-interactive ${
                        isPhoneError ? "border-ds-feedback-saved" : "border-ds-border"
                      }`}
                    />
                    {isPhoneError && (
                      <p className="ds-caption text-ds-feedback-saved mt-[4px]">{t("booking.field.phone_invalid")}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA — only on the confirm step */}
      {step === 5 && (
        <div className="px-ds-4 py-ds-4 bg-ds-bg-primary border-t border-ds-border">
          <button
            onClick={handleConfirm}
            disabled={!canProceed || createBooking.isPending}
            className={`w-full h-[48px] rounded-ds-2xl ds-body-large transition-colors ${
              canProceed && !createBooking.isPending ? "bg-ds-interactive text-ds-text-inverse" : "bg-ds-bg-secondary text-ds-text-disabled"
            }`}
          >
            {createBooking.isPending ? t("booking.in_progress") : t("booking.confirm_cta")}
          </button>
          {createBooking.isError && (
            <p className="ds-caption text-ds-feedback-saved text-center mt-ds-2">{t("booking.failed")}</p>
          )}
        </div>
      )}
    </div>
  );
}
