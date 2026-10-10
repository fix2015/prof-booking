import { useState } from "react";
import { CalendarPlus, CheckCircle2, BellRing } from "lucide-react";
import { getLocale, t } from "@/i18n";
import { openBookingIcs, type ReminderResult } from "@/lib/reminders";
import { parseBookingTime } from "@/utils/reminders";
import type { BookingConfirmation } from "@/types";

interface Props {
  confirmation: BookingConfirmation;
  reminders: ReminderResult | null;
  onViewBookings: () => void;
}

/** Booking confirmation screen: summary, Add to Calendar (.ics) and reminder status. */
export function BookingConfirmed({ confirmation: c, reminders, onViewBookings }: Props) {
  const [calendarFailed, setCalendarFailed] = useState(false);
  const start = parseBookingTime(c.starts_at);
  const when = `${start.toLocaleDateString(getLocale(), { weekday: "long", day: "numeric", month: "long" })} · ${c.starts_at.slice(11, 16)}`;
  const reminderText =
    reminders === "scheduled" ? t("booking.confirmed.reminders_on")
      : reminders === "denied" ? t("booking.confirmed.reminders_denied")
        : t("booking.confirmed.reminders_calendar");

  const rows: [string, string | undefined][] = [
    [t("booking.summary_service"), c.service_name],
    [t("booking.confirmed.where"), c.provider_name],
    [t("booking.summary_professional"), c.professional_name],
    [t("booking.summary_datetime"), when],
    [t("booking.summary_total"), c.price != null ? `£${c.price}` : undefined],
    [t("booking.confirmed.code"), c.confirmation_code],
  ];

  async function addToCalendar() {
    setCalendarFailed(false);
    try {
      await openBookingIcs(c.session_id, c.confirmation_code);
    } catch {
      setCalendarFailed(true);
    }
  }

  return (
    <div className="flex-1 px-ds-4 py-ds-6 flex flex-col gap-ds-4">
      <div className="flex flex-col items-center text-center gap-ds-2">
        <CheckCircle2 className="h-12 w-12 text-ds-interactive" aria-hidden />
        <h2 className="ds-h2 text-ds-text-primary">{t("booking.confirmed.title")}</h2>
        <p className="ds-body text-ds-text-secondary">{t("booking.confirmed.subtitle")}</p>
      </div>

      <dl className="bg-ds-bg-primary rounded-ds-xl border border-ds-border p-ds-3 flex flex-col gap-ds-2">
        {rows.filter(([, v]) => !!v).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-ds-3">
            <dt className="ds-body text-ds-text-secondary">{label}</dt>
            <dd className="ds-body-strong text-ds-text-primary text-right">{value}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={addToCalendar}
        className="w-full h-ds-12 rounded-ds-2xl border border-ds-border bg-ds-bg-primary ds-body-large text-ds-text-primary flex items-center justify-center gap-ds-2"
      >
        <CalendarPlus className="h-5 w-5" aria-hidden />
        {t("booking.confirmed.add_to_calendar")}
      </button>
      {calendarFailed && <p className="ds-caption text-ds-feedback-saved text-center">{t("common.error")}</p>}

      <p className="ds-body-small text-ds-text-secondary flex items-start gap-ds-2">
        <BellRing className="h-4 w-4 mt-ds-1 shrink-0" aria-hidden />
        <span>{reminderText}</span>
      </p>

      <button
        type="button"
        onClick={onViewBookings}
        className="w-full h-ds-12 rounded-ds-2xl bg-ds-interactive ds-body-large text-ds-text-inverse"
      >
        {t("booking.confirmed.view_bookings")}
      </button>
    </div>
  );
}
