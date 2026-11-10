export function localDateInTimeZone(timeZone: string, now: number | Date = Date.now()): string {
  if (typeof timeZone !== "string" || timeZone.length < 1 || timeZone.length > 100) {
    throw new Error("invalid_time_zone");
  }
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now instanceof Date ? now : new Date(now));
  } catch {
    throw new Error("invalid_time_zone");
  }
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = values.year, month = values.month, day = values.day;
  if (!year || !month || !day) throw new Error("invalid_time_zone");
  return `${year.padStart(4, "0")}-${month}-${day}`;
}

export function validateLocalStepDate(date: unknown, timeZone: unknown, now: number | Date = Date.now()): string {
  if (typeof date !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) {
    throw new Error("invalid_step_date");
  }
  const parsed = new Date(date + "T00:00:00.000Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error("invalid_step_date");
  }
  if (typeof timeZone !== "string") throw new Error("invalid_time_zone");
  if (localDateInTimeZone(timeZone, now) !== date) throw new Error("step_date_not_today");
  return date;
}
