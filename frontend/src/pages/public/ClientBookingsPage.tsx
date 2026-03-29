import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/context/AuthContext";
import { useGuestSession } from "@/hooks/useGuestSession";
import { bookingApi, BookingLookupResult } from "@/api/booking";
import { AppHeader } from "@/components/mobile/AppHeader";
import { t } from "@/i18n";
import type { BookingConfirmation } from "@/types";

type AnyBooking = BookingLookupResult | BookingConfirmation;

function getStatus(b: AnyBooking): string {
  return "status" in b ? b.status : "confirmed";
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-[#e8f5e9] text-[#2e7d32]",
  pending: "bg-[#fff8e1] text-[#f57f17]",
  completed: "bg-ds-bg-secondary text-ds-text-secondary",
  cancelled: "bg-[#fce4ec] text-[#c62828]",
  in_progress: "bg-[#e3f2fd] text-[#1565c0]",
  no_show: "bg-ds-bg-secondary text-ds-text-muted",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.confirmed;
  return (
    <span className={`ds-caption px-[8px] py-[2px] rounded-ds-full font-medium ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function BookingCard({ b, onNavigate }: { b: AnyBooking; onNavigate: (providerId?: number) => void }) {
  const dateStr = new Date(b.starts_at).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
  const timeStr = new Date(b.starts_at).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
  const status = getStatus(b);

  return (
    <div className="bg-ds-bg-primary border border-ds-border rounded-ds-xl mx-ds-4 p-ds-3 flex flex-col gap-[8px]">
      <div className="flex items-start justify-between gap-ds-2">
        <div className="flex-1 min-w-0">
          <p className="ds-body-strong text-ds-text-primary truncate">{b.service_name ?? t("profile.my_bookings")}</p>
          <p className="ds-caption text-ds-text-secondary truncate">{b.provider_name}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex items-center gap-[6px]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-ds-text-muted">
          <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M4 1v2M10 1v2M1 5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span className="ds-caption text-ds-text-secondary">{dateStr} · {timeStr}</span>
      </div>

      {b.professional_name && (
        <div className="flex items-center gap-[6px]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-ds-text-muted">
            <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1.5 12.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span className="ds-caption text-ds-text-secondary">{b.professional_name}</span>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-ds-border pt-[8px] mt-[2px]">
        <span className="ds-caption text-ds-text-muted">#{b.confirmation_code}</span>
        <div className="flex items-center gap-ds-3">
          {b.price != null && (
            <span className="ds-body-strong text-ds-text-primary">${b.price}</span>
          )}
          {status === "confirmed" && (
            <button
              type="button"
              onClick={() => onNavigate()}
              className="ds-caption text-ds-interactive font-semibold"
            >
              Book again →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ClientBookingsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, role } = useAuthContext();
  const { guestBookings } = useGuestSession();
  const isClient = isAuthenticated && role === "client";

  const { data: clientBookings = [], isLoading } = useQuery<BookingLookupResult[]>({
    queryKey: ["client-bookings", user?.phone],
    queryFn: () => bookingApi.lookupByPhone(user!.phone!),
    enabled: isClient && !!user?.phone,
    staleTime: 0,
  });

  const allBookings: AnyBooking[] = isClient ? clientBookings : guestBookings;
  const now = new Date();
  const upcoming = allBookings
    .filter((b) => new Date(b.starts_at) >= now && getStatus(b) !== "cancelled")
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const past = allBookings
    .filter((b) => new Date(b.starts_at) < now || getStatus(b) === "cancelled")
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  const totalCount = upcoming.length + past.length;
  const upcomingCount = upcoming.length;

  const subtitleStr = upcomingCount > 0
    ? t("profile.guest_bookings_count", { count: String(upcomingCount) })
    : t("profile.no_bookings");

  return (
    <div className="max-w-[768px] mx-auto min-h-screen flex flex-col bg-ds-bg-secondary">
      <AppHeader variant="back-title" title={t("profile.my_bookings")} onBack={() => navigate(-1)} />

      {/* Summary bar */}
      {totalCount > 0 && (
        <div className="bg-ds-bg-primary border-b border-ds-border px-ds-4 py-ds-3">
          <p className="ds-caption text-ds-text-secondary">{subtitleStr}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-ds-2 mt-ds-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-[120px] bg-ds-bg-primary rounded-ds-xl mx-ds-4 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-ds-3 px-ds-6 py-ds-10">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-ds-text-muted">
            <rect x="6" y="8" width="36" height="34" rx="4" stroke="currentColor" strokeWidth="2" />
            <path d="M16 4v8M32 4v8M6 20h36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="ds-body-strong text-ds-text-primary text-center">{t("bookings.none_title")}</p>
          <p className="ds-body text-ds-text-secondary text-center">{t("bookings.none_body")}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-ds-1 h-[44px] px-ds-6 bg-ds-interactive rounded-ds-2xl ds-body-strong text-ds-text-inverse"
          >
            {t("bookings.browse_salons")}
          </button>
        </div>
      )}

      {!isLoading && upcoming.length > 0 && (
        <div className="mt-ds-3">
          <p className="ds-label text-ds-text-secondary px-ds-4 pb-ds-2">{t("bookings.upcoming")}</p>
          <div className="flex flex-col gap-ds-2">
            {upcoming.map((b) => (
              <BookingCard key={b.confirmation_code} b={b} onNavigate={() => navigate("/")} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && past.length > 0 && (
        <div className="mt-ds-3 mb-ds-4">
          <p className="ds-label text-ds-text-secondary px-ds-4 pb-ds-2">{t("bookings.past")}</p>
          <div className="flex flex-col gap-ds-2">
            {past.map((b) => (
              <BookingCard key={b.confirmation_code} b={b} onNavigate={() => navigate("/")} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
