import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "../lib/ui";

describe("formatRelativeTime", () => {
  const now = new Date("2026-04-09T15:00:00.000Z");

  it("returns just now for sub-minute timestamps", () => {
    expect(formatRelativeTime(new Date("2026-04-09T14:59:45.000Z"), now)).toBe("just now");
  });

  it("returns hour-level freshness for recent sessions", () => {
    expect(formatRelativeTime(new Date("2026-04-09T13:00:00.000Z"), now)).toBe("2h ago");
  });

  it("returns day-level freshness for older sessions", () => {
    expect(formatRelativeTime(new Date("2026-04-06T15:00:00.000Z"), now)).toBe("3d ago");
  });
});
