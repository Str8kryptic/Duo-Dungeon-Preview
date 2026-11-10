import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { localDateInTimeZone, validateLocalStepDate } from "./step-date.ts";

Deno.test("local date follows the supplied IANA timezone across UTC midnight", () => {
  const instant = Date.parse("2026-11-09T02:30:00.000Z");
  assertEquals(localDateInTimeZone("America/New_York", instant), "2026-11-08");
  assertEquals(localDateInTimeZone("Asia/Tokyo", instant), "2026-11-09");
});

Deno.test("local date handles daylight-saving transitions", () => {
  assertEquals(localDateInTimeZone("America/New_York", Date.parse("2026-03-08T07:30:00Z")), "2026-03-08");
  assertEquals(localDateInTimeZone("America/New_York", Date.parse("2026-11-01T06:30:00Z")), "2026-11-01");
});

Deno.test("accepts only today's valid calendar date in the declared timezone", () => {
  const now = Date.parse("2026-11-09T02:30:00.000Z");
  assertEquals(validateLocalStepDate("2026-11-08", "America/New_York", now), "2026-11-08");
  assertThrows(() => validateLocalStepDate("2026-11-09", "America/New_York", now), Error, "step_date_not_today");
  assertThrows(() => validateLocalStepDate("2026-02-30", "America/New_York", now), Error, "invalid_step_date");
  assertThrows(() => validateLocalStepDate("2026-11-08", "Not/A_Timezone", now), Error, "invalid_time_zone");
});
