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

// Elite bosses: floor gates, three combat phases, telegraphs, and guaranteed paired relic rewards.
const bossState = { descent: { depth: 2 } };
const bossRpg = combat.ensure(bossState);
const lockedBossView = combat.render(bossState);
assert.match(lockedBossView, /The Crypt Warden/);
assert.match(lockedBossView, /FLOOR 3 REQUIRED/);
combat.handleAction(bossState, "hunt:crypt-warden", hooks);
assert.equal(bossRpg.battle, null, "bosses must remain locked until the required Descent floor");

bossState.descent.depth = 3;
const unlockedBossView = combat.render(bossState);
assert.match(unlockedBossView, /Dungeon Bosses/);
assert.match(unlockedBossView, /Warden's Oath/);
assert.match(unlockedBossView, /Warden's Aegis/);
combat.handleAction(bossState, "hunt:crypt-warden", hooks);
assert.equal(bossRpg.battle.monsterId, "crypt-warden");
assert.equal(bossRpg.stamina, 70, "boss encounter should spend its separate stamina cost");
assert.match(combat.render(bossState), /BOSS PHASE 1 \/ 3/);

bossRpg.battle.hp = Math.floor(bossRpg.battle.maxHp * 0.64);
bossRpg.battle.quickReadyAt = 0;
combat.handleAction(bossState, "quick-strike", hooks);
assert.equal(bossRpg.battle.phase, 2, "boss should enter phase two below 65% health");
bossRpg.battle.hp = Math.floor(bossRpg.battle.maxHp * 0.29);
bossRpg.battle.quickReadyAt = 0;
combat.handleAction(bossState, "quick-strike", hooks);
assert.equal(bossRpg.battle.phase, 3, "boss should enter final phase below 30% health");
assert.match(combat.render(bossState), /BOSS PHASE 3 \/ 3/);

bossRpg.battle.hp = 1;
bossRpg.battle.quickReadyAt = 0;
combat.handleAction(bossState, "quick-strike", hooks);
assert.equal(bossRpg.battle, null, "defeated boss should end the encounter");
assert.ok(bossRpg.inventory.gear.includes("warden_oath"), "first boss victory should award its unique weapon");
assert.ok(bossRpg.inventory.gear.includes("warden_aegis"), "first boss victory should award its unique armor");
assert.equal(bossRpg.kills["crypt-warden"], 1);

combat.handleAction(bossState, "hunt:crypt-warden", hooks);
bossRpg.battle.hp = 1;
bossRpg.battle.quickReadyAt = 0;
combat.handleAction(bossState, "quick-strike", hooks);
assert.equal(bossRpg.inventory.gear.filter(id => id === "warden_oath").length, 1, "repeat victories should not duplicate unique relics");
assert.ok(bossRpg.inventory.materials.warden_seal >= 5, "repeat victories should convert duplicate relic rewards into boss materials");

bossState.descent.depth = 9;
bossRpg.stamina = bossRpg.maxStamina;
const finalBossBoard = combat.render(bossState);
assert.match(finalBossBoard, /The Infernal Tyrant/);
assert.match(finalBossBoard, /The Abyssal Dragon/);
combat.handleAction(bossState, "hunt:abyssal-dragon", hooks);
assert.equal(bossRpg.battle.monsterId, "abyssal-dragon", "final boss should unlock at Descent floor nine");

console.log("RPG combat, crafting, and boss tests passed.");
