export function savedStepBaseline(save: Record<string, unknown>, date: string): number {
  if (String(save.stepDate || "") !== date) return 0;
  const raw = save.healthStepsToday == null ? save.stepsToday : save.healthStepsToday;
  const value = Number(raw == null ? 0 : raw);
  if (!Number.isSafeInteger(value) || value < 0 || value > 100000) {
    throw new Error("invalid_saved_step_baseline");
  }
  return value;
}
