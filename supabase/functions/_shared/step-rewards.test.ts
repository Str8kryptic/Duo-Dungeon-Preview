import { assertEquals } from "jsr:@std/assert@1";
import { calculateStepRewards } from "./step-rewards.ts";

const baseSave = () => ({
  coins: 0, xp: 0, stepDate: "2026-11-08", stepsToday: 0,
  healthStepsToday: 0, stepLifetime: 0, yearSteps: 0,
  bankedSteps: 0, treasuryMarks: 0, treasuryStepRemainder: 0,
  treasuryUpgrades: { capacity: 0, carry: 0, efficiency: 0 },
  dailyStepsEarned: 0, dailyStepsBanked: 0,
  dailyReserveBaseline: 0, dailyStepsSpent: 0,
  materials: { herbs: 0, hingeDust: 0, mimicShards: 0, dragonScales: 0 },
  relics: [], gear: {}, upgrades: {}, activePotions: [],
  companionXP: 0, companionXPById: {},
});
const noDrops = () => 1;
const run = (save: Record<string, any>, total: number, items: any[] = [], relicCatalog: any[] = []) =>
  calculateStepRewards({ save, total, date: "2026-11-09", items, relicCatalog, now: Date.parse("2026-11-09T12:00:00Z"), random: noDrops });

Deno.test("100 steps preserve base coin, XP, and Treasury rewards", () => {
  const r = run(baseSave(), 100);
  assertEquals(r.coins, 10);
  assertEquals(r.xp, 2);
  assertEquals(r.save.healthStepsToday, 100);
  assertEquals(r.save.stepLifetime, 100);
  assertEquals(r.save.bankedSteps, 100);
  assertEquals(r.save.dailyStepsBanked, 100);
});

Deno.test("10,000-step milestone pays its one-time bonus", () => {
  const r = run(baseSave(), 10000);
  assertEquals(r.coins, 1250);
  assertEquals(r.xp, 350);
  assertEquals(r.rewardDelta, 10000);
});

Deno.test("daily reward cap stops rewards above 20,000 while lifetime steps continue", () => {
  const r = run(baseSave(), 25000);
  assertEquals(r.coins, 2250);
  assertEquals(r.xp, 600);
  assertEquals(r.save.healthStepsToday, 25000);
  assertEquals(r.rewardDelta, 20000);
  assertEquals(r.save.stepLifetime, 25000);
});

Deno.test("same total is idempotent and awards no additional currency or steps", () => {
  const save = baseSave();
  save.stepDate = "2026-11-09";
  save.healthStepsToday = 100;
  save.stepsToday = 100;
  save.coins = 10;
  save.xp = 2;
  save.stepLifetime = 100;
  save.yearSteps = 100;
  save.bankedSteps = 100;
  const r = run(save, 100);
  assertEquals(r.alreadyCurrent, true);
  assertEquals(r.coins, 0);
  assertEquals(r.xp, 0);
  assertEquals(r.save.coins, 10);
  assertEquals(r.save.stepLifetime, 100);
});

Deno.test("lower step total is rejected", () => {
  const save = baseSave();
  save.stepDate = "2026-11-09";
  save.healthStepsToday = 500;
  save.stepsToday = 500;
  let rejected = false;
  try { run(save, 499); } catch (e) { rejected = String(e).includes("step_total_regressed"); }
  assertEquals(rejected, true);
});

Deno.test("step potion bonuses apply and step charges are consumed", () => {
  const save = baseSave();
  save.activePotions = [{ kind: "steps", remainingSteps: 100, effect: { coins: .5, xp: .1 } }];
  const r = run(save, 100);
  assertEquals(r.coins, 15);
  assertEquals(r.save.activePotions.length, 1);
  assertEquals(r.save.activePotions[0].remainingSteps, 0);
});

Deno.test("treasury overflow converts into marks using the crawler's efficiency upgrade", () => {
  const save = baseSave();
  save.treasuryUpgrades.capacity = 0;
  save.treasuryUpgrades.efficiency = 2;
  save.bankedSteps = 19950;
  const r = run(save, 100);
  assertEquals(r.bankedAdded, 50);
  assertEquals(r.overflowConverted, 50);
  assertEquals(r.save.treasuryStepRemainder, 50);
  assertEquals(r.save.treasuryMarks, 0);
});


Deno.test("Royal weapon and armor set bonuses stack with equipped item effects", () => {
  const save = baseSave();
  save.gear = { weapon: "sword", armor: "helmet" };
  const items = [
    { id: "sword", type: "weapon", set: "Royal", effects: { xp: .10 } },
    { id: "helmet", type: "armor", set: "Royal", effects: { coins: .10 } },
  ];
  const r = run(save, 100, items);
  assertEquals(r.coins, 12);
  assertEquals(r.xp, 2);
});

Deno.test("owned relic bonuses are included in step currency calculations", () => {
  const save = baseSave();
  save.relics = ["gilded_tooth", "hinge_relic"];
  const relics = [
    { id: "gilded_tooth", name: "Gilded Goblin Tooth", rarity: "Rare", effects: { coins: .01 } },
    { id: "hinge_relic", name: "Relic of the First Footstep", rarity: "Common", effects: { xp: .01 } },
  ];
  const r = run(save, 100, [], relics);
  assertEquals(r.coins, 10);
  assertEquals(r.xp, 2);
});

Deno.test("new-day sync settles prior Treasury before crediting today's steps", () => {
  const save = baseSave();
  save.stepDate = "2026-11-08";
  save.healthStepsToday = 100;
  save.stepsToday = 100;
  save.stepLifetime = 100;
  save.yearSteps = 100;
  save.bankedSteps = 100;
  save.dailyStepsEarned = 100;
  save.dailyStepsBanked = 100;
  save.dailyReserveBaseline = 0;
  const r = run(save, 50);
  assertEquals(r.save.stepDate, "2026-11-09");
  assertEquals(r.save.healthStepsToday, 50);
  assertEquals(r.save.stepLifetime, 150);
  assertEquals(r.save.bankedSteps, 100);
  assertEquals(r.save.treasuryStepRemainder, 50);
  assertEquals(r.save.dailyStepsBanked, 50);
  assertEquals(r.coins, 5);
  assertEquals(r.xp, 1);
});

Deno.test("steps beyond the reward cap increase lifetime totals without extra currency", () => {
  const save = baseSave();
  save.stepDate = "2026-11-09";
  save.healthStepsToday = 20000;
  save.stepsToday = 20000;
  save.stepLifetime = 20000;
  save.yearSteps = 20000;
  const r = run(save, 21000);
  assertEquals(r.rewardDelta, 0);
  assertEquals(r.coins, 0);
  assertEquals(r.xp, 0);
  assertEquals(r.save.stepLifetime, 21000);
  assertEquals(r.save.healthStepsToday, 21000);
});
