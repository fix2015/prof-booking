import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ChevronLeft, ChevronRight, Phone, UserX, Clock3 } from "lucide-react";
import { sessionsApi, type AgendaItem } from "@/api/sessions";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/mobile/StatusBadge";
import { toast } from "@/hooks/useToast";
import { getLocale, t } from "@/i18n";
import { cn } from "@/utils/cn";
import { attendanceOf, focusIndex, nextAttendance, telHref, timelinePhase, type Attendance } from "@/utils/agenda";
import { localDateString } from "@/utils/slots";
import { parseBookingTime } from "@/utils/reminders";

function shiftDay(date: string, days: number): string {
  const d = parseBookingTime(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDateString(d);
}

/** Owner/professional Today view: the day's appointments as a timeline, tap-to-call, no-show / late-cancel toggles. */
export function TodayPage() {
  const qc = useQueryClient();
  const today = localDateString(new Date());
  const [date, setDate] = useState(today);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["sessions", "agenda", date],
    queryFn: () => sessionsApi.agenda(date),
    refetchInterval: date === today ? 60_000 : false,
  });

  const attendance = useMutation({
    mutationFn: ({ id, outcome }: { id: number; outcome: Attendance }) => sessionsApi.setAttendance(id, outcome),
    onSuccess: (_, { outcome }) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast({
        title: outcome === "attended" ? t("today.marked_attended") : outcome === "no_show" ? t("today.marked_no_show") : t("today.marked_late_cancel"),
        variant: "success",
      });
    },
    onError: () => toast({ title: t("common.error"), variant: "destructive" }),
  });

  const focus = date === today ? focusIndex(items, now) : -1;
  const active = items.filter((i) => i.status !== "cancelled" && i.status !== "no_show");
  const dayLabel = parseBookingTime(`${date}T12:00:00`).toLocaleDateString(getLocale(), { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-ds-4 max-w-[768px]">
      <div className="flex items-start justify-between gap-ds-3 flex-wrap">
        <div>
          <h1 className="ds-h2 flex items-center gap-ds-2 text-ds-text-primary">
            <CalendarClock className="h-6 w-6" aria-hidden /> {date === today ? t("today.title") : dayLabel}
          </h1>
          <p className="ds-body text-ds-text-secondary">
            {date === today ? `${dayLabel} · ` : ""}{t("today.summary", { count: active.length })}
          </p>
        </div>
        <div className="flex items-center gap-ds-1">
          <button type="button" onClick={() => setDate(shiftDay(date, -1))} aria-label={t("today.prev_day")}
            className="h-ds-10 w-ds-10 rounded-ds-full border border-ds-border bg-ds-bg-primary flex items-center justify-center text-ds-text-primary">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          {date !== today && (
            <button type="button" onClick={() => setDate(today)}
              className="h-ds-10 px-ds-3 rounded-ds-full border border-ds-border bg-ds-bg-primary ds-label text-ds-text-primary">
              {t("today.back_to_today")}
            </button>
          )}
          <button type="button" onClick={() => setDate(shiftDay(date, 1))} aria-label={t("today.next_day")}
            className="h-ds-10 w-ds-10 rounded-ds-full border border-ds-border bg-ds-bg-primary flex items-center justify-center text-ds-text-primary">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-ds-6 text-center ds-body text-ds-text-secondary">{t("today.empty")}</CardContent>
        </Card>
      ) : (
        <ol className="relative flex flex-col gap-ds-3 border-l-2 border-ds-border ml-ds-2 pl-ds-4" aria-label={t("today.timeline")}>
          {items.map((item, idx) => (
            <TimelineItem
              key={item.id}
              item={item}
              focused={idx === focus}
              past={date < today || (date === today && timelinePhase(item, now) === "past")}
              busy={attendance.isPending && attendance.variables?.id === item.id}
              onToggle={(pressed) => attendance.mutate({ id: item.id, outcome: nextAttendance(attendanceOf(item), pressed) })}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function TimelineItem({ item, focused, past, busy, onToggle }: {
  item: AgendaItem;
  focused: boolean;
  past: boolean;
  busy: boolean;
  onToggle: (pressed: "no_show" | "late_cancel") => void;
}) {
  const state = attendanceOf(item);
  const missed = state !== "attended";
  const toggle = (on: boolean) =>
    cn(
      "h-ds-8 px-ds-3 rounded-ds-full border ds-label-small inline-flex items-center gap-ds-1 disabled:opacity-50",
      on ? "bg-ds-interactive text-ds-text-inverse border-transparent" : "bg-ds-bg-primary text-ds-text-secondary border-ds-border",
    );

  return (
    <li className="relative">
      <span
        aria-hidden
        className={cn(
          "absolute -left-[23px] top-ds-4 h-3 w-3 rounded-ds-full border-2 border-ds-bg-primary",
          focused ? "bg-ds-interactive" : past ? "bg-ds-border-strong" : "bg-ds-bg-tertiary",
        )}
      />
      <Card className={cn(focused && "border-ds-interactive", missed && "opacity-70")}>
        <CardContent className="p-ds-3 flex flex-col gap-ds-2">
          <div className="flex items-center justify-between gap-ds-2">
            <p className="ds-body-strong text-ds-text-primary">
              {item.starts_at.slice(11, 16)}–{item.ends_at.slice(11, 16)}
              {focused && <span className="ds-caption text-ds-interactive ml-ds-2">{t("today.now_next")}</span>}
            </p>
            <StatusBadge status={state === "late_cancel" ? "cancelled" : item.status} />
          </div>
          <div>
            <p className="ds-body-strong text-ds-text-primary">{item.client_name}</p>
            <p className="ds-caption text-ds-text-secondary">
              {[item.service_name, item.professional_name].filter(Boolean).join(" · ")}
              {item.price != null ? ` · £${item.price}` : ""}
            </p>
            {item.client_notes && <p className="ds-caption text-ds-text-muted mt-ds-1">“{item.client_notes}”</p>}
          </div>
          <div className="flex items-center gap-ds-2 flex-wrap">
            <a
              href={telHref(item.client_phone)}
              aria-label={t("today.call", { name: item.client_name })}
              className="h-ds-8 px-ds-3 rounded-ds-full bg-ds-bg-tertiary ds-label-small text-ds-text-primary inline-flex items-center gap-ds-1"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden /> {item.client_phone}
            </a>
            <button type="button" aria-pressed={state === "no_show"} disabled={busy} onClick={() => onToggle("no_show")}
              className={toggle(state === "no_show")}>
              <UserX className="h-3.5 w-3.5" aria-hidden /> {t("today.no_show")}
            </button>
            <button type="button" aria-pressed={state === "late_cancel"} disabled={busy} onClick={() => onToggle("late_cancel")}
              className={toggle(state === "late_cancel")}>
              <Clock3 className="h-3.5 w-3.5" aria-hidden /> {t("today.late_cancel")}
            </button>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
