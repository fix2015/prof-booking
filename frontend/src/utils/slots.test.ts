import { describe, expect, it } from "vitest";
import { bookingPrefillUrl, localDateString, localTimeString, parseSlotPrefill, relativeDay } from "./slots";

describe("slot helpers", () => {
  const now = new Date(2030, 0, 31, 9, 5); // 31 Jan 2030 09:05 local

  it("formats local date and time", () => {
    expect(localDateString(now)).toBe("2030-01-31");
    expect(localTimeString(now)).toBe("09:05");
  });

  it("labels today and tomorrow across a month boundary", () => {
    expect(relativeDay("2030-01-31", now)).toBe("today");
    expect(relativeDay("2030-02-01", now)).toBe("tomorrow");
    expect(relativeDay("2030-02-02", now)).toBeNull();
  });

  it("round-trips the booking pre-fill URL", () => {
    const url = bookingPrefillUrl(7, { date: "2030-02-01", time: "14:30", professionalId: 3 });
    expect(url).toBe("/book/7?date=2030-02-01&time=14%3A30&professional_id=3");
    const parsed = parseSlotPrefill(new URLSearchParams(url.split("?")[1]));
    expect(parsed).toEqual({ date: "2030-02-01", time: "14:30", professionalId: 3 });
  });

  it("rejects malformed pre-fill params", () => {
    expect(parseSlotPrefill(new URLSearchParams("date=tomorrow&time=14:30"))).toBeNull();
    expect(parseSlotPrefill(new URLSearchParams("date=2030-02-01"))).toBeNull();
    expect(parseSlotPrefill(new URLSearchParams("date=2030-02-01&time=09:00&professional_id=x"))).toEqual({
      date: "2030-02-01", time: "09:00", professionalId: undefined,
    });
  });
});
