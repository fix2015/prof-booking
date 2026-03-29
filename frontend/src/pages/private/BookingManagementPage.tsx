import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, Phone, Tag, User, Scissors, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { bookingApi, BookingLookupResult } from "@/api/booking";
import type { SessionStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";

type CancelState = { booking: BookingLookupResult; reason: string } | null;

export function BookingManagementPage() {
  const [phone, setPhone] = useState("");
  const [bookings, setBookings] = useState<BookingLookupResult[] | null>(null);
  const [cancelState, setCancelState] = useState<CancelState>(null);
  const [error, setError] = useState("");

  const lookupMutation = useMutation({
    mutationFn: (phoneNum: string) => bookingApi.lookupByPhone(phoneNum),
    onSuccess: (data) => {
      setBookings(data);
      if (error) setError("");
    },
    onError: () => {
      setError(t("common.error"));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ booking, reason }: { booking: BookingLookupResult; reason: string }) =>
      bookingApi.cancel(booking.session_id, booking.confirmation_code, booking.client_phone, reason || undefined),
    onSuccess: (updated) => {
      setBookings((prev) =>
        prev ? prev.map((b) => (b.session_id === updated.session_id ? updated : b)) : prev
      );
      setCancelState(null);
    },
    onError: () => {
      setError(t("common.error"));
    },
  });

  const handleLookup = () => {
    const cleaned = phone.trim();
    if (!cleaned) return;
    lookupMutation.mutate(cleaned);
  };

  const isCancellable = (status: SessionStatus) =>
    status === "pending" || status === "confirmed";

  return (
    <div className="min-h-screen bg-ds-bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-ds-bg-primary/80 backdrop-blur border-b border-ds-border px-ds-4 py-ds-3 flex items-center gap-ds-3">
        <Link to="/discover">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="ds-body-strong text-ds-text-primary">{t("bookings.title")}</h1>
          <p className="ds-caption text-ds-text-muted hidden sm:block">{t("bookings.subtitle")}</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-ds-4 py-ds-8 space-y-ds-6">
        {/* Cancel confirmation overlay */}
        {cancelState && (
          <div className="rounded-ds-xl border border-ds-border bg-ds-bg-primary p-ds-5 shadow-sm space-y-ds-4">
            <h2 className="ds-body-strong text-ds-text-primary">{t("bookings.cancel.confirm")}</h2>
            <BookingCard booking={cancelState.booking} />
            <div className="space-y-[6px]">
              <label className="ds-label-small text-ds-text-muted uppercase tracking-wide">
                {t("bookings.cancel.reason_label")}
              </label>
              <Input
                placeholder={t("bookings.cancel.reason_placeholder")}
                value={cancelState.reason}
                onChange={(e) => setCancelState((s) => s && { ...s, reason: e.target.value })}
              />
            </div>
            {error && <p className="ds-body text-[var(--ds-feedback-error)]">{error}</p>}
            <div className="flex gap-ds-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setCancelState(null)}>
                {t("bookings.cancel.back")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(cancelState)}
              >
                {cancelMutation.isPending
                  ? t("bookings.cancel.cancelling")
                  : t("bookings.cancel.submit")}
              </Button>
            </div>
          </div>
        )}

        {!cancelState && (
          <>
            {/* Lookup form */}
            <div className="rounded-ds-xl border border-ds-border bg-ds-bg-primary p-ds-5 shadow-sm space-y-ds-4">
              <div className="space-y-[6px]">
                <label className="ds-body-strong text-ds-text-primary">{t("bookings.phone_label")}</label>
                <div className="flex gap-ds-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ds-text-muted pointer-events-none" />
                    <Input
                      type="tel"
                      placeholder={t("bookings.phone_placeholder")}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    onClick={handleLookup}
                    disabled={lookupMutation.isPending || !phone.trim()}
                    className="bg-ds-interactive hover:bg-ds-interactive-hover shrink-0"
                  >
                    {lookupMutation.isPending ? t("bookings.looking_up") : t("bookings.lookup")}
                  </Button>
                </div>
              </div>
              {error && <p className="ds-body text-[var(--ds-feedback-error)]">{error}</p>}
            </div>

            {/* Results */}
            {bookings !== null && (
              bookings.length === 0 ? (
                <div className="text-center py-ds-12">
                  <div className="text-[4rem] mb-ds-3">📭</div>
                  <p className="ds-body text-ds-text-secondary">{t("bookings.no_bookings")}</p>
                </div>
              ) : (
                <div className="space-y-ds-4">
                  {bookings.map((booking) => (
                    <div key={booking.session_id} className="rounded-ds-xl border border-ds-border bg-ds-bg-primary shadow-sm overflow-hidden">
                      <BookingCard booking={booking} />
                      {isCancellable(booking.status) && (
                        <div className="px-ds-4 pb-ds-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[var(--ds-feedback-error)] border-[var(--ds-feedback-error)] hover:bg-[var(--ds-feedback-error-bg)]"
                            onClick={() => setCancelState({ booking, reason: "" })}
                          >
                            {t("bookings.cancel")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingLookupResult }) {
  const statusConfig: Record<SessionStatus, { label: string; className: string; icon: ReactNode }> = {
    pending:     { label: t("bookings.status.pending"),     className: "bg-[var(--ds-feedback-warning-bg)] text-[var(--ds-feedback-warning)]", icon: <Clock className="h-3 w-3" /> },
    confirmed:   { label: t("bookings.status.confirmed"),   className: "bg-[var(--ds-feedback-info-bg)] text-[var(--ds-feedback-info)]",       icon: <CheckCircle2 className="h-3 w-3" /> },
    in_progress: { label: t("bookings.status.in_progress"), className: "bg-[var(--ds-feedback-info-bg)] text-[var(--ds-feedback-info)]",       icon: <Clock className="h-3 w-3" /> },
    completed:   { label: t("bookings.status.completed"),   className: "bg-[var(--ds-feedback-success-bg)] text-[var(--ds-feedback-success)]", icon: <CheckCircle2 className="h-3 w-3" /> },
    cancelled:   { label: t("bookings.status.cancelled"),   className: "bg-[var(--ds-feedback-error-bg)] text-[var(--ds-feedback-error)]",     icon: <XCircle className="h-3 w-3" /> },
    no_show:     { label: t("bookings.status.no_show"),     className: "bg-ds-bg-tertiary text-ds-text-secondary",                             icon: <AlertCircle className="h-3 w-3" /> },
  };
  const statusCfg = statusConfig[booking.status] ?? statusConfig.pending;

  return (
    <div className="p-ds-4 space-y-ds-3">
      {/* Status + code row */}
      <div className="flex items-center justify-between gap-ds-2 flex-wrap">
        <span className={`inline-flex items-center gap-[6px] rounded-ds-full px-ds-2 py-[2px] ds-badge ${statusCfg.className}`}>
          {statusCfg.icon}
          {statusCfg.label}
        </span>
        <span className="font-mono ds-caption bg-ds-bg-tertiary px-ds-2 py-[2px] rounded-ds-md text-ds-text-secondary">
          {booking.confirmation_code}
        </span>
      </div>

      {/* Details grid */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-ds-2 ds-body">
        <Detail icon={<Tag className="h-3.5 w-3.5" />} label={t("bookings.field.provider")} value={booking.provider_name} />
        {booking.service_name && (
          <Detail icon={<Scissors className="h-3.5 w-3.5" />} label={t("bookings.field.service")} value={booking.service_name} />
        )}
        {booking.professional_name && (
          <Detail icon={<User className="h-3.5 w-3.5" />} label={t("bookings.field.professional")} value={booking.professional_name} />
        )}
        <Detail
          icon={<CalendarDays className="h-3.5 w-3.5" />}
          label={t("bookings.field.date")}
          value={format(new Date(booking.starts_at), "dd MMM yyyy, HH:mm")}
        />
        {booking.price != null && (
          <Detail
            icon={null}
            label={t("bookings.field.price")}
            value={booking.price === 0 ? t("common.free") : `$${booking.price.toFixed(2)}`}
          />
        )}
      </dl>

      {/* Cancellation reason */}
      {booking.status === "cancelled" && booking.cancellation_reason && (
        <p className="ds-caption text-ds-text-muted">
          {t("bookings.cancelled_reason", { reason: booking.cancellation_reason })}
        </p>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-ds-2">
      {icon && <span className="text-ds-text-muted mt-[2px] shrink-0">{icon}</span>}
      <div className="min-w-0">
        <dt className="ds-label-small uppercase tracking-wide text-ds-text-muted">{label}</dt>
        <dd className="ds-body-strong text-ds-text-primary truncate">{value}</dd>
      </div>
    </div>
  );
}
