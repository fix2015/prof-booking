import { Capacitor } from "@capacitor/core";
import { t } from "@/i18n";
import { allReminderIds, planReminders } from "@/utils/reminders";

export interface ReminderBooking {
  session_id: number;
  starts_at: string;
  provider_name: string;
  service_name?: string;
}

export type ReminderResult = "scheduled" | "denied" | "unsupported" | "none";

/**
 * Schedule local notifications 24 h and 2 h before a booking (native app only — the web app relies on SMS/email).
 * The plugin is imported lazily so it never lands in the web bundle's critical path.
 */
export async function scheduleBookingReminders(booking: ReminderBooking): Promise<ReminderResult> {
  if (!Capacitor.isNativePlatform()) return "unsupported";
  const plan = planReminders(booking.session_id, booking.starts_at);
  if (plan.length === 0) return "none";
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display === "prompt" || perm.display === "prompt-with-rationale") {
      perm = await LocalNotifications.requestPermissions();
    }
    if (perm.display !== "granted") return "denied";
    await LocalNotifications.cancel({ notifications: allReminderIds(booking.session_id).map((id) => ({ id })) });
    const what = booking.service_name
      ? t("reminders.what", { service: booking.service_name, provider: booking.provider_name })
      : booking.provider_name;
    const time = booking.starts_at.slice(11, 16);
    await LocalNotifications.schedule({
      notifications: plan.map((r) => ({
        id: r.id,
        title: t("reminders.title"),
        body: r.kind === "day" ? t("reminders.body_day", { what, time }) : t("reminders.body_hours", { what, time }),
        schedule: { at: r.at, allowWhileIdle: true },
        extra: { session_id: booking.session_id },
      })),
    });
    return "scheduled";
  } catch {
    return "unsupported";
  }
}

export async function cancelBookingReminders(sessionId: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: allReminderIds(sessionId).map((id) => ({ id })) });
  } catch {
    /* plugin unavailable — nothing scheduled */
  }
}

/** URL of the booking's .ics file (absolute in the native app, relative on the web). */
export function bookingIcsUrl(sessionId: number, confirmationCode: string): string {
  const base = import.meta.env.VITE_API_URL ?? "";
  return `${base}/api/v1/booking/${sessionId}/calendar.ics?code=${encodeURIComponent(confirmationCode)}`;
}

/** Add to Calendar: the native app hands the .ics to the system browser (which offers "Add to Calendar"). */
export async function openBookingIcs(sessionId: number, confirmationCode: string): Promise<void> {
  const url = bookingIcsUrl(sessionId, confirmationCode);
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    return;
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = `probook-booking-${sessionId}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
