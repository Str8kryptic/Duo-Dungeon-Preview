import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../rpg-combat.js", import.meta.url), "utf8");
const context = { window: {}, Date, Math };
vm.createContext(context);
vm.runInContext(source, context, { filename: "rpg-combat.js" });

const combat = context.window.DUO_RPG_COMBAT;
assert.ok(combat, "combat module should register its public API");

const state = { descent: { depth: 1 } };
const messages = [];
const hooks = {
  save() {},
  render() {},
  toast(message) { messages.push(message); }
};

const rpg = combat.ensure(state);
assert.equal(rpg.level, 1);
assert.equal(rpg.stamina, 100);
assert.equal(rpg.hp, 100);
assert.equal(state.rpgCombat, rpg, "combat data should live in its own save namespace");

const board = combat.render(state);
assert.match(board, /Cave Stalker/);
assert.match(board, /Crypt Guardian/);
assert.match(board, /Reach Descent floor 3/);
assert.match(board, /Combat uses stamina, never Step Power/);

combat.handleAction(state, "hunt:cave-stalker", hooks);
assert.ok(rpg.battle, "unlocked monster should start a battle");
assert.equal(rpg.stamina, 90, "hunting should spend stamina, not Step Power");
assert.equal(state.descent.depth, 1, "hunting should not change Descent progress");

rpg.battle.hp = 1;
rpg.battle.quickReadyAt = 0;
combat.handleAction(state, "quick-strike", hooks);
assert.equal(rpg.battle, null, "defeating a monster should end the encounter");
assert.equal(rpg.kills["cave-stalker"], 1);
assert.ok(rpg.xp >= 28, "victory should award combat XP");

rpg.inventory.materials.bitter_herb = 2;
rpg.inventory.materials.venom_gland = 1;
combat.handleAction(state, "craft-healing", hooks);
assert.equal(rpg.inventory.potions, 1, "healing draught should be craftable from monster drops");
assert.equal(rpg.inventory.materials.bitter_herb, 0);
assert.equal(rpg.inventory.materials.venom_gland, 0);

rpg.inventory.gear.push("stalker_fang");
rpg.inventory.materials.cave_chitin = 2;
combat.handleAction(state, "equip:stalker_fang", hooks);
assert.equal(rpg.equipment.weapon, "stalker_fang");
combat.handleAction(state, "upgrade:stalker_fang", hooks);
assert.equal(rpg.upgrades.stalker_fang, 1, "equipment should be enhanceable with monster materials");
assert.equal(rpg.inventory.materials.cave_chitin, 0);

rpg.inventory.lootBoxes = 1;
const gearBefore = rpg.inventory.gear.length;
combat.handleAction(state, "open-cache", hooks);
assert.equal(rpg.inventory.lootBoxes, 0);
assert.equal(rpg.inventory.gear.length, gearBefore + 1, "loot cache should award equipment");

rpg.stamina = 50;
rpg.staminaUpdatedAt = Date.now() - 300000;
combat.ensure(state);
assert.equal(rpg.stamina, 51, "stamina should regenerate by one every five minutes");

// Forge: floor-gated recipes consume the right monster materials and add real equipment.
const forgeState = { descent: { depth: 1 } };
const forgeRpg = combat.ensure(forgeState);
forgeRpg.inventory.materials.cave_chitin = 10;
forgeRpg.inventory.materials.venom_gland = 4;
combat.handleAction(forgeState, "forge:stalker_fang", hooks);
assert.ok(forgeRpg.inventory.gear.includes("stalker_fang"), "starter weapon should be forgeable");
assert.equal(forgeRpg.inventory.materials.cave_chitin, 6);
combat.handleAction(forgeState, "forge:stalker_fang", hooks);
assert.equal(forgeRpg.inventory.gear.filter(id => id === "stalker_fang").length, 1, "forge should not create duplicate owned gear");
combat.handleAction(forgeState, "forge:cryptbone_blade", hooks);
assert.ok(!forgeRpg.inventory.gear.includes("cryptbone_blade"), "deeper blueprints must remain locked");

// Alchemy: combat tonics become usable consumables with temporary stat bonuses.
forgeState.descent.depth = 3;
forgeRpg.inventory.materials.bitter_herb = 4;
forgeRpg.inventory.materials.cursed_essence = 2;
combat.handleAction(forgeState, "brew:power", hooks);
assert.equal(forgeRpg.inventory.consumables.power, 1, "Brutal Tonic should be craftable");
combat.handleAction(forgeState, "hunt:cave-stalker", hooks);
combat.handleAction(forgeState, "use-power-tonic", hooks);
assert.equal(forgeRpg.inventory.consumables.power, 0, "using a tonic should consume one charge");
assert.equal(forgeRpg.buffs.powerUntil > Date.now(), true, "tonic should apply a timed buff");
assert.match(combat.render(forgeState), /ATK 17/, "Brutal Tonic should increase combat attack by five");

// Warden's Elixir and the stamina stimulant consume their recipes correctly.
forgeRpg.inventory.materials.ancient_bone = 1;
forgeRpg.inventory.materials.cursed_essence = 1;
combat.handleAction(forgeState, "brew:ward", hooks);
assert.equal(forgeRpg.inventory.consumables.ward, 1, "Warden's Elixir should be craftable");
combat.handleAction(forgeState, "use-ward-tonic", hooks);
assert.ok(forgeRpg.buffs.wardUntil > Date.now(), "Warden's Elixir should apply a timed defense buff");
assert.match(combat.render(forgeState), /DEF 10/, "Warden's Elixir should increase combat defense by five");
forgeRpg.battle = null;
forgeState.descent.depth = 6;
forgeRpg.stamina = 50;
forgeRpg.inventory.materials.fire_core = 1;
forgeRpg.inventory.materials.bitter_herb = 2;
combat.handleAction(forgeState, "brew:stamina", hooks);
assert.equal(forgeRpg.stamina, 75, "Ember Stimulant should restore 25 stamina");
assert.equal(forgeRpg.inventory.materials.fire_core, 0);

const forgeView = combat.render(forgeState);
assert.match(forgeView, /THE FORGE/);
assert.match(forgeView, /THE ALCHEMY LAB/);
assert.match(forgeView, /Infernal Edge/);

console.log("RPG combat and crafting tests passed.");
