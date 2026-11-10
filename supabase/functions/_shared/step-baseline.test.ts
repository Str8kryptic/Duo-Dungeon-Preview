import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { savedStepBaseline } from "./step-baseline.ts";

Deno.test("first sync starts from the existing Health total for the same day", () => {
  assertEquals(savedStepBaseline({ stepDate: "2026-11-09", healthStepsToday: 3456, stepsToday: 3500 }, "2026-11-09"), 3456);
});

Deno.test("falls back to stepsToday when healthStepsToday is absent", () => {
  assertEquals(savedStepBaseline({ stepDate: "2026-11-09", stepsToday: 250 }, "2026-11-09"), 250);
});

Deno.test("a new local day starts at zero", () => {
  assertEquals(savedStepBaseline({ stepDate: "2026-11-08", healthStepsToday: 9000 }, "2026-11-09"), 0);
});

Deno.test("rejects malformed or out-of-range saved baselines", () => {
  assertThrows(() => savedStepBaseline({ stepDate: "2026-11-09", healthStepsToday: "many" }, "2026-11-09"), Error, "invalid_saved_step_baseline");
  assertThrows(() => savedStepBaseline({ stepDate: "2026-11-09", healthStepsToday: 100001 }, "2026-11-09"), Error, "invalid_saved_step_baseline");
});
