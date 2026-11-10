export type StepRewardResult = {
  save: Record<string, any>;
  delta: number;
  rewardDelta: number;
  coins: number;
  xp: number;
  bankedAdded: number;
  overflowConverted: number;
  items: { name: string; count: number }[];
  relics: string[];
  alreadyCurrent: boolean;
};

type RewardOptions = {
  save: Record<string, any>;
  total: number;
  date: string;
  items: any[];
  relicCatalog: any[];
  now?: number;
  random?: () => number;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const nonnegative = (n: unknown) => Math.max(0, Number(n) || 0);

function treasuryCapacity(s: any) {
  return 20000 + nonnegative(s.treasuryUpgrades?.capacity) * 5000;
}
function treasuryCarryRate(s: any) {
  return Math.min(80, 50 + nonnegative(s.treasuryUpgrades?.carry) * 6);
}
function treasuryStepsPerMark(s: any) {
  return Math.max(60, 100 - nonnegative(s.treasuryUpgrades?.efficiency) * 10);
}
function addTreasuryStepRemainder(s: any, n: number) {
  const divisor = treasuryStepsPerMark(s);
  const total = nonnegative(s.treasuryStepRemainder) + Math.max(0, Math.floor(n));
  const marks = Math.floor(total / divisor);
  s.treasuryStepRemainder = total % divisor;
  if (marks) s.treasuryMarks = nonnegative(s.treasuryMarks) + marks;
  return marks;
}
function creditBankedSteps(s: any, n: number) {
  const amount = Math.max(0, Math.floor(n));
  const room = Math.max(0, treasuryCapacity(s) - nonnegative(s.bankedSteps));
  const credited = Math.min(room, amount);
  const overflow = amount - credited;
  s.bankedSteps = nonnegative(s.bankedSteps) + credited;
  if (overflow) addTreasuryStepRemainder(s, overflow);
  return { credited, overflow };
}
function settleDailyTreasury(s: any, date: string) {
  if (!date || s.lastTreasurySettlementDate === date) return null;
  s.lastTreasurySettlementDate = date;
  const earned = nonnegative(s.dailyStepsBanked);
  const spent = Math.min(earned, nonnegative(s.dailyStepsSpent));
  const unused = Math.max(0, earned - spent);
  const eligible = Math.min(unused, nonnegative(s.bankedSteps));
  const carry = Math.floor(eligible * treasuryCarryRate(s) / 100);
  const converted = eligible - carry;
  s.bankedSteps = Math.max(0, nonnegative(s.bankedSteps) - converted);
  const marks = addTreasuryStepRemainder(s, converted);
  s.dailyStepsEarned = 0;
  s.dailyStepsBanked = 0;
  s.dailyReserveBaseline = nonnegative(s.bankedSteps);
  s.dailyStepsSpent = 0;
  return { earned, spent, unused, carry, converted, marks };
}
function passiveEffects(s: any, items: any[], relicCatalog: any[]) {
  const out: Record<string, number> = { coins: 0, xp: 0, rare: 0, companionXP: 0 };
  const get = (id: string) => items.find((x) => x.id === id);
  ["weapon", "armor", "companion"].forEach((slot) => {
    const x = get(s.gear?.[slot]);
    if (x?.effects) Object.keys(x.effects).forEach((k) => out[k] = (out[k] || 0) + Number(x.effects[k] || 0));
  });
  (relicCatalog || []).forEach((r) => {
    if ((s.relics || []).includes(r.id)) Object.keys(r.effects || {}).forEach((k) => out[k] = (out[k] || 0) + Number(r.effects[k] || 0));
  });
  ["weapon", "armor"].forEach((slot) => {
    const id = s.gear?.[slot], lvl = nonnegative(s.upgrades?.[id]), x = get(id);
    if (x && lvl) {
      const key = x.effects?.xp && !x.effects?.coins ? "xp" : "coins";
      out[key] += lvl * .02;
      if (lvl >= 5) out.rare += .05;
    }
  });
  const w = get(s.gear?.weapon), a = get(s.gear?.armor);
  if (w && a && w.set && w.set === a.set) { out.coins += .10; out.xp += .05; }
  const companion = get(s.gear?.companion);
  if (companion) {
    const lv = Math.floor(Math.sqrt(nonnegative(s.companionXP) / 25)) + 1;
    out.companionXP += Math.min(.20, Math.max(0, lv - 1) * .002);
    if (companion.id === "cat") out.rare += .02;
    if (companion.id === "demon") out.xp += .03;
  }
  return out;
}
function activeEffects(s: any, now: number) {
  const out: Record<string, number> = { coins: 0, xp: 0, rare: 0, companionXP: 0 };
  s.activePotions = (s.activePotions || []).filter((p: any) =>
    p.kind === "steps" ? p.remainingSteps > 0 :
    p.kind === "achievement" ? p.charges > 0 : p.endsAt > now
  );
  s.activePotions.forEach((p: any) => Object.keys(p.effect || {}).forEach((k) => {
    out[k] = (out[k] || 0) + Number(p.effect[k] || 0);
  }));
  return out;
}
function awardCompanionXP(s: any, amount: number) {
  const id = s.gear?.companion;
  if (!id) return;
  s.companionXPById = s.companionXPById && typeof s.companionXPById === "object" ? s.companionXPById : {};
  s.companionXPById[id] = nonnegative(s.companionXPById[id]) + amount;
  s.companionXP = s.companionXPById[id];
}

export function calculateStepRewards(options: RewardOptions): StepRewardResult {
  const { total, date, items, relicCatalog } = options;
  const now = options.now ?? Date.now();
  const random = options.random ?? Math.random;
  if (!Number.isSafeInteger(total) || total < 0 || total > 100000) throw new Error("invalid_step_total");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date + "T00:00:00.000Z").toISOString().slice(0, 10) !== date) throw new Error("invalid_step_date");

  const s = clone(options.save || {});
  s.gear = s.gear || {};
  s.materials = s.materials || { herbs: 0, hingeDust: 0, mimicShards: 0, dragonScales: 0 };
  s.relics = Array.isArray(s.relics) ? s.relics : [];
  s.upgrades = s.upgrades || {};
  s.activePotions = Array.isArray(s.activePotions) ? s.activePotions : [];
  s.treasuryUpgrades = s.treasuryUpgrades || {};
  const oldDate = String(s.stepDate || "");
  if (oldDate !== date) {
    if (oldDate) settleDailyTreasury(s, oldDate);
    s.stepsToday = 0;
    s.healthStepsToday = 0;
    s.devStepOffset = 0;
    s.dailyStepsEarned = 0;
    s.dailyStepsBanked = 0;
    s.dailyReserveBaseline = nonnegative(s.bankedSteps);
    s.dailyStepsSpent = 0;
    s.stepDate = date;
  }
  const previous = Number(s.healthStepsToday == null ? s.stepsToday : s.healthStepsToday);
  if (!Number.isSafeInteger(previous) || previous < 0 || total < previous) throw new Error("step_total_regressed");
  const previousReward = Math.min(20000, previous);
  const currentReward = Math.min(20000, total);
  const rewardDelta = currentReward - previousReward;
  if (total === previous) {
    return { save: s, delta: 0, rewardDelta: 0, coins: 0, xp: 0, bankedAdded: 0, overflowConverted: 0, items: [], relics: [], alreadyCurrent: true };
  }

  const beforeMaterials = { ...s.materials };
  const beforeRelics = [...s.relics];
  const passive = passiveEffects(s, items || [], relicCatalog || []);
  let coins = 0, xp = 0;
  const oldTens = Math.floor(previousReward / 10), newTens = Math.floor(currentReward / 10);
  for (let h = oldTens; h < newTens; h++) {
    const active = activeEffects(s, now);
    const coinBoost = passive.coins + active.coins;
    const xpBoost = passive.xp + active.xp;
    const stepFrom = h * 10, stepTo = (h + 1) * 10;
    coins += Math.floor((stepTo / 10) * (1 + coinBoost)) - Math.floor((stepFrom / 10) * (1 + coinBoost));
    xp += Math.floor((stepTo / 40) * (1 + xpBoost)) - Math.floor((stepFrom / 40) * (1 + xpBoost));
    s.activePotions.forEach((p: any) => { if (p.kind === "steps") p.remainingSteps = Math.max(0, p.remainingSteps - 10); });
    if (stepTo % 250 === 0) {
      if (random() < .06) s.materials.herbs = nonnegative(s.materials.herbs) + 1;
      if (random() < .025) s.materials.hingeDust = nonnegative(s.materials.hingeDust) + 1;
      if (random() < .012) s.materials.mimicShards = nonnegative(s.materials.mimicShards) + 1;
      if (random() < .004) s.materials.dragonScales = nonnegative(s.materials.dragonScales) + 1;
      if (s.gear.companion) awardCompanionXP(s, 5);
      if (s.gear.companion === "dragon" && random() < .015) s.materials.dragonScales = nonnegative(s.materials.dragonScales) + 1;
    }
  }
  const oldQuarter = Math.floor(previousReward / 250), newQuarter = Math.floor(currentReward / 250);
  for (let q = oldQuarter; q < newQuarter; q++) {
    if (random() < .0008) {
      const available = (relicCatalog || []).filter((r) => !s.relics.includes(r.id));
      if (available.length) {
        const roll = random() * 100;
        const tier = roll < 55 ? "Common" : roll < 82 ? "Rare" : roll < 96 ? "Epic" : "Legendary";
        const pool = available.filter((r) => r.rarity === tier);
        const choices = pool.length ? pool : available;
        const relic = choices[Math.floor(random() * choices.length)];
        s.relics.push(relic.id);
      }
    }
  }
  if (currentReward >= 10000 && previousReward < 10000) { coins += 250; xp += 100; }
  s.coins = nonnegative(s.coins) + coins;
  s.xp = nonnegative(s.xp) + xp;
  s.stepLifetime = nonnegative(s.stepLifetime) + (total - previous);
  s.yearSteps = nonnegative(s.yearSteps) + (total - previous);
  s.healthStepsToday = total;
  s.stepsToday = total + nonnegative(s.devStepOffset);
  s.dailyStepsEarned = nonnegative(s.dailyStepsEarned) + (total - previous);
  const bankCredit = creditBankedSteps(s, total - previous);
  s.dailyStepsBanked = nonnegative(s.dailyStepsBanked) + bankCredit.credited;
  s.lastStepSyncAt = new Date(now).toISOString();

  const gainedItems = Object.keys(s.materials).flatMap((key) => {
    const gained = nonnegative(s.materials[key]) - nonnegative(beforeMaterials[key]);
    return gained > 0 ? [{ name: key.replace(/([A-Z])/g, " $1").replace(/^./, (c: string) => c.toUpperCase()), count: gained }] : [];
  });
  const gainedRelics = s.relics.filter((id: string) => !beforeRelics.includes(id)).map((id: string) => {
    const relic = (relicCatalog || []).find((x) => x.id === id);
    return relic ? relic.name : id;
  });
  return { save: s, delta: total - previous, rewardDelta, coins, xp, bankedAdded: bankCredit.credited, overflowConverted: bankCredit.overflow, items: gainedItems, relics: gainedRelics, alreadyCurrent: false };
}
