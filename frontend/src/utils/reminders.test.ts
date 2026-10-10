import { describe, expect, it } from "vitest";
import { allReminderIds, parseBookingTime, planReminders, reminderId } from "./reminders";

describe("booking reminders", () => {
  it("parses backend wall-clock times as local time", () => {
    const d = parseBookingTime("2030-01-07T11:30:00");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2030, 0, 7, 11, 30]);
  });

  it("plans 24 h and 2 h reminders", () => {
    const plan = planReminders(42, "2030-01-07T11:00:00", new Date(2030, 0, 1));
    expect(plan.map((r) => r.kind)).toEqual(["day", "hours"]);
    expect(plan[0].at).toEqual(new Date(2030, 0, 6, 11, 0));
    expect(plan[1].at).toEqual(new Date(2030, 0, 7, 9, 0));
    expect(plan.map((r) => r.id)).toEqual(allReminderIds(42));
  });

  it("skips reminders that are already due", () => {
    // booked 5 hours ahead → only the 2 h reminder; booked 90 minutes ahead → none
    expect(planReminders(1, "2030-01-07T11:00:00", new Date(2030, 0, 7, 6, 0)).map((r) => r.kind)).toEqual(["hours"]);
    expect(planReminders(1, "2030-01-07T11:00:00", new Date(2030, 0, 7, 9, 30))).toEqual([]);
  });

  it("keeps ids within 32-bit range and distinct per booking", () => {
    expect(reminderId(2_000_000_123, 2)).toBeLessThan(2 ** 31);
    expect(new Set([...allReminderIds(1), ...allReminderIds(2)]).size).toBe(4);
  });
});
