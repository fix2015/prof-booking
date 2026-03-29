import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "@/api/booking";
import type { BookingLookupResult } from "@/api/booking";
import type { BookingConfirmation } from "@/types";
import { StatusBadge } from "./StatusBadge";

type AnyBooking = BookingLookupResult | BookingConfirmation;

function getBookingStatus(b: AnyBooking): string {
  return "status" in b ? b.status : "confirmed";
}

const CANCELLABLE = new Set(["confirmed", "pending"]);

export function BookingCard({ b }: { b: AnyBooking }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const status = getBookingStatus(b);
  const sessionId = b.session_id;
  const clientPhone = b.client_phone;

  const cancelMutation = useMutation({
    mutationFn: () =>
      bookingApi.cancel(sessionId, b.confirmation_code, clientPhone),
    onSuccess: () => {
      setConfirmingCancel(false);
      queryClient.invalidateQueries({ queryKey: ["client-bookings"] });
    },
  });

  const dateStr = new Date(b.starts_at).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
  const timeStr = new Date(b.starts_at).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });

  const providerId = "provider_id" in b ? b.provider_id : undefined;
  const providerAddress = "provider_address" in b ? b.provider_address : undefined;
  const providerPhone = "provider_phone" in b ? b.provider_phone : undefined;
  const professionalId = "professional_id" in b ? b.professional_id : undefined;
  const professionalPhone = "professional_phone" in b ? b.professional_phone : undefined;

  const mapsUrl = providerAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(providerAddress)}`
    : undefined;

  return (
    <div className="bg-ds-bg-primary border border-ds-border rounded-ds-xl mx-ds-4 p-ds-3 flex flex-col gap-[8px]">
      {/* Service + status */}
      <div className="flex items-start justify-between gap-ds-2">
        <p className="ds-body-strong text-ds-text-primary flex-1 min-w-0 truncate">{b.service_name ?? "Appointment"}</p>
        <StatusBadge status={status} />
      </div>

      {/* Provider name — clickable */}
      {b.provider_name && (
        <button
          type="button"
          onClick={() => providerId && navigate(`/providers/${providerId}`)}
          className="flex items-center gap-[6px] text-left w-full"
          disabled={!providerId}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-ds-text-muted">
            <path d="M2 12V5l5-3 5 3v7H9V9H5v3H2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          <span className={`ds-caption ${providerId ? "text-ds-interactive font-medium" : "text-ds-text-secondary"} truncate`}>
            {b.provider_name}
          </span>
        </button>
      )}

      {/* Date + time */}
      <div className="flex items-center gap-[6px]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-ds-text-muted">
          <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M4 1v2M10 1v2M1 5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span className="ds-caption text-ds-text-secondary">{dateStr} · {timeStr}</span>
      </div>

      {/* Professional — clickable */}
      {b.professional_name && (
        <button
          type="button"
          onClick={() => professionalId && navigate(`/professionals/${professionalId}`)}
          className="flex items-center gap-[6px] text-left w-full"
          disabled={!professionalId}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-ds-text-muted">
            <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1.5 12.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span className={`ds-caption ${professionalId ? "text-ds-interactive font-medium" : "text-ds-text-secondary"} truncate`}>
            {b.professional_name}
          </span>
        </button>
      )}

      {/* Address → Google Maps */}
      {providerAddress && mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-[6px]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-ds-text-muted">
            <path d="M7 1.5A3.5 3.5 0 0 1 10.5 5c0 2.5-3.5 7-3.5 7S3.5 7.5 3.5 5A3.5 3.5 0 0 1 7 1.5Z" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="7" cy="5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          </svg>
          <span className="ds-caption text-ds-interactive truncate">{providerAddress}</span>
        </a>
      )}

      {/* Provider phone */}
      {providerPhone && (
        <a href={`tel:${providerPhone}`} className="flex items-center gap-[6px]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-ds-text-muted">
            <path d="M2 2.5A1 1 0 0 1 3 1.5h2l1 3-1.5 1a7 7 0 0 0 3 3L9 7l3 1v2a1 1 0 0 1-1 1A10.5 10.5 0 0 1 2 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          <span className="ds-caption text-ds-interactive">{providerPhone}</span>
        </a>
      )}

      {/* Professional phone (if different from provider) */}
      {professionalPhone && professionalPhone !== providerPhone && (
        <a href={`tel:${professionalPhone}`} className="flex items-center gap-[6px]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-ds-text-muted">
            <path d="M2 2.5A1 1 0 0 1 3 1.5h2l1 3-1.5 1a7 7 0 0 0 3 3L9 7l3 1v2a1 1 0 0 1-1 1A10.5 10.5 0 0 1 2 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          <span className="ds-caption text-ds-interactive">{professionalPhone}</span>
        </a>
      )}

      {/* Footer: confirmation code + price + actions */}
      <div className="flex items-center justify-between border-t border-ds-border pt-[8px] mt-[2px]">
        <span className="ds-caption text-ds-text-muted">#{b.confirmation_code}</span>
        <div className="flex items-center gap-ds-3">
          {b.price != null && (
            <span className="ds-body-strong text-ds-text-primary">${b.price}</span>
          )}
          {status === "confirmed" && providerId && (
            <button
              type="button"
              onClick={() => navigate(`/book/${providerId}`)}
              className="ds-caption text-ds-interactive font-semibold"
            >
              Book again →
            </button>
          )}
        </div>
      </div>

      {/* Cancel flow */}
      {CANCELLABLE.has(status) && (
        <div className="border-t border-ds-border pt-[8px]">
          {!confirmingCancel ? (
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className="ds-caption text-[var(--ds-feedback-error)] font-medium"
            >
              Cancel booking
            </button>
          ) : (
            <div className="flex flex-col gap-[6px]">
              <p className="ds-caption text-ds-text-secondary">Cancel this appointment?</p>
              <div className="flex gap-ds-2">
                <button
                  type="button"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="h-[32px] px-ds-3 bg-[var(--ds-feedback-error)] rounded-ds-full ds-caption text-ds-text-inverse font-semibold disabled:opacity-50"
                >
                  {cancelMutation.isPending ? "Cancelling…" : "Yes, cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  disabled={cancelMutation.isPending}
                  className="h-[32px] px-ds-3 border border-ds-border rounded-ds-full ds-caption text-ds-text-secondary"
                >
                  Keep
                </button>
              </div>
              {cancelMutation.isError && (
                <p className="ds-caption text-[var(--ds-feedback-error)]">Failed to cancel. Please try again.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
