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

console.log("RPG combat foundation tests passed.");
