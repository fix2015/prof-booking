import { describe, expect, it } from "vitest";
import { attendanceOf, focusIndex, nextAttendance, telHref, timelinePhase } from "./agenda";

const at = (h: number, m = 0) => `2030-01-07T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
const item = (h: number, status = "confirmed", late = false) => ({ starts_at: at(h), ends_at: at(h + 1), status, late_cancelled: late });

describe("agenda", () => {
  it("derives attendance from status + late flag", () => {
    expect(attendanceOf(item(9, "no_show"))).toBe("no_show");
    expect(attendanceOf(item(9, "cancelled", true))).toBe("late_cancel");
    expect(attendanceOf(item(9, "cancelled"))).toBe("attended");
    expect(attendanceOf(item(9))).toBe("attended");
  });

  it("toggles no-show / late-cancel", () => {
    expect(nextAttendance("attended", "no_show")).toBe("no_show");
    expect(nextAttendance("no_show", "no_show")).toBe("attended");
    expect(nextAttendance("no_show", "late_cancel")).toBe("late_cancel");
  });

  it("places appointments on the timeline and focuses the current/next one", () => {
    const now = new Date(2030, 0, 7, 10, 30);
    expect(timelinePhase(item(9), now)).toBe("past");
    expect(timelinePhase(item(10), now)).toBe("now");
    expect(timelinePhase(item(11), now)).toBe("upcoming");
    expect(focusIndex([item(9), item(10), item(11)], now)).toBe(1);
    expect(focusIndex([item(9), item(10, "no_show"), item(11)], now)).toBe(2);
    expect(focusIndex([item(8), item(9)], now)).toBe(-1);
  });

  it("builds dialable tel: links", () => {
    expect(telHref("+44 (7700) 900-123")).toBe("tel:+447700900123");
  });
});
