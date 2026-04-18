export function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatTime(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return timeFormatter.format(d);
}

export function formatDate(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return dateFormatter.format(d);
}

export function titleCase(raw: string): string {
  return raw
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const EVENT_CHIP_COLORS: Record<string, string> = {
  AI_CHAT: "chip-purple",
  RUN_TESTS: "chip-orange",
  SUBMIT: "chip-green",
  START_SESSION: "chip-blue",
  OPEN_FILE: "chip-cyan",
  CLARIFICATION_NOTES: "chip-muted",
};
