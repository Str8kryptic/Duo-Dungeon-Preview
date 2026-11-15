import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const window = {
  DUO_DATA: {
    shopItems: [
      { id: "test-sword", set: "test", effects: { coins: 0.2, xp: 0.1 } },
      { id: "test-armor", set: "test", effects: { coins: 0.05 } }
    ],
    relicCatalog: []
  },
  setInterval() { return 1; },
  clearInterval() {},
  addEventListener() {},
  dispatchEvent() {}
};
const document = {
  body: { getAttribute() { return "activities"; } },
  getElementById() { return null; },
  querySelector() { return null; },
  createElement() {
    return {
      dataset: {}, style: {}, children: [],
      appendChild(child) { this.children.push(child); },
      querySelector() { return null; }
    };
  }
};
const context = {
  window, document, navigator: { onLine: true },
  CustomEvent: class CustomEvent { constructor(type) { this.type = type; } },
  Date, Math, JSON, Array, Object, String, Number, RegExp, Error, Promise,
  setTimeout, clearTimeout
};
runInNewContext(readFileSync(new URL("../rpg-combat.js", import.meta.url), "utf8"), context);
runInNewContext(readFileSync(new URL("../activity-engine.js", import.meta.url), "utf8"), context);

const Combat = window.DUO_RPG_COMBAT;
const Activities = window.DUO_ACTIVITY_ENGINE;
assert.ok(Combat && Activities, "Hunt and Activity Ledger modules should both register");

const state = {
  coins: 100, xp: 0, descent: { depth: 3 },
  gear: { weapon: "test-sword", armor: "test-armor" },
  upgrades: { "test-sword": 2 },
  guildStats: { kills: 0, crafts: 0 },
  monsterKills: {}, monsterKillTotal: 0,
  activePotions: [{ endsAt: Date.now() + 60000, effect: { coins: 0.5, xp: 0.5 } }]
};
const hooks = { save() {}, render() {}, toast() {}, notify() {} };
const rpg = Combat.ensure(state);
Activities.ensure(state);

Combat.handleAction(state, "hunt:cave-stalker", hooks);
assert.ok(rpg.battle, "Hunt should start a battle");
rpg.battle.hp = 0;
Combat.handleAction(state, "quick-strike", hooks);
assert.equal(state.guildStats.kills, 1, "Hunt victory should advance Guild kill progress");
assert.equal(state.monsterKillTotal, 1, "Hunt victory should update the lifetime elimination ledger");
assert.ok(state.xp > 28, "Hunt victory should award boosted global XP");
assert.ok(state.coins > 142, "Hunt victory should award boosted coins");

state.rpgCombat.inventory.materials.bitter_herb = 8;
state.rpgCombat.inventory.materials.venom_gland = 8;
state.rpgCombat.inventory.materials.cursed_essence = 8;
state.rpgCombat.inventory.materials.ancient_bone = 8;
state.rpgCombat.inventory.materials.fire_core = 8;
state.rpgCombat.inventory.materials.cave_chitin = 8;
state.rpgCombat.inventory.materials.rusted_fragment = 8;
state.rpgCombat.inventory.materials.infernal_hide = 8;
state.rpgCombat.inventory.materials.demon_horn = 8;

Combat.handleAction(state, "craft-healing", hooks);
assert.equal(state.guildStats.crafts, 1, "Alchemy crafting should advance Guild craft progress");
assert.equal(state.rpgCombat.inventory.potions, 1, "Crafting should still grant the consumable");
assert.equal(state.activityEngine.skills.crafting.xp, 18, "Healing Draught should award Crafting XP");

Combat.handleAction(state, "brew:power", hooks);
assert.equal(state.rpgCombat.inventory.consumables.power, 1, "Brutal Tonic should remain craftable");
assert.equal(state.activityEngine.skills.crafting.xp, 46, "Brutal Tonic should award Crafting XP");

Combat.handleAction(state, "forge:stalker_fang", hooks);
assert.ok(state.rpgCombat.inventory.gear.includes("stalker_fang"), "Forge should add equipment to the shared inventory");
assert.equal(state.activityEngine.skills.crafting.xp, 81, "Forging should award Crafting XP");

const gathering = { descent: { depth: 1 } };
Combat.ensure(gathering);
Activities.ensure(gathering);
const now = Date.now();
gathering.activityEngine.active = {
  nodeId: "bitter-herb", startedAt: now - 60000,
  lastSettledAt: now - 60000, totalActions: 0
};
assert.equal(Activities.settle(gathering, now), true, "completed gathering cycles should settle");
assert.equal(gathering.rpgCombat.inventory.materials.bitter_herb, 2, "gathered materials should enter the shared combat inventory");
assert.equal(gathering.activityEngine.skills.foraging.xp, 16, "gathering should award Foraging XP");
assert.equal(Activities.settle(gathering, now), false, "the same gathering cycles must not be awarded twice");

const page = Activities.render(gathering);
assert.match(page, /<h1>ACTIVITIES<\/h1>/);
assert.match(page, /Foraging/);
assert.match(page, /Quarrying/);
assert.match(page, /Salvaging/);
assert.match(page, /Field Healing Draught/);
assert.doesNotMatch(page, /STEP POWER|step reserve|health sync/i, "the Activity Ledger must not expose step-based mechanics");

const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const auth = readFileSync(new URL("../auth.js", import.meta.url), "utf8");
assert.match(index, /activity-engine\.css/);
assert.ok(index.indexOf("rpg-combat.js") < index.indexOf("activity-engine.js"));
assert.ok(index.indexOf("activity-engine.js") < index.indexOf("app.js"));
assert.match(app, /else if\(page==="activities"\)/, "Activities should have an application route");
assert.match(app, /DUO_ACTIVITY_ENGINE\.handleClick/, "Activity actions should be wired to the shared click handler");
assert.match(app, /Your Activity Ledger:/, "Dungeon AI should understand Activity Ledger skills");
assert.match(auth, /merged\.activityEngine\.skills/, "offline account sync should merge activity XP");
assert.match(auth, /remoteCombat\.inventory\.materials/, "offline account sync should merge gathered materials");
assert.doesNotMatch(app, /bankedSteps:10000/, "new saves must not receive a starter step reserve");

console.log("Hunt and Activity Ledger progression tests passed.");
