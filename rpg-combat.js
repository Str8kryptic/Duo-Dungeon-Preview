(function () {
  "use strict";

  var monsters = [
    { id: "cave-stalker", name: "Cave Stalker", kind: "ARACHNID", depth: 1, hp: 72, attack: 9, defense: 2, stamina: 10, xp: 28, lootChance: 0.14, drops: [{ id: "bitter_herb", min: 1, max: 2, chance: 1 }, { id: "cave_chitin", min: 1, max: 2, chance: 0.8 }, { id: "venom_gland", min: 1, max: 1, chance: 0.38 }], flavor: "A patient hunter with too many legs and absolutely no respect for personal space." },
    { id: "crypt-guardian", name: "Crypt Guardian", kind: "UNDEAD", depth: 3, hp: 156, attack: 16, defense: 6, stamina: 18, xp: 62, lootChance: 0.2, drops: [{ id: "ancient_bone", min: 1, max: 2, chance: 1 }, { id: "cursed_essence", min: 1, max: 1, chance: 0.48 }, { id: "rusted_fragment", min: 1, max: 2, chance: 0.75 }], flavor: "The previous occupants are still unhappy with the dungeon's management." },
    { id: "infernal-beast", name: "Infernal Beast", kind: "DEMONIC", depth: 6, hp: 285, attack: 27, defense: 10, stamina: 28, xp: 118, lootChance: 0.28, drops: [{ id: "infernal_hide", min: 1, max: 2, chance: 1 }, { id: "fire_core", min: 1, max: 1, chance: 0.5 }, { id: "demon_horn", min: 1, max: 1, chance: 0.32 }], flavor: "A walking furnace with anger-management issues and excellent loot prospects." },
    { id: "crypt-reaver", name: "Crypt Reaver", kind: "ELITE · UNDEAD", depth: 3, hp: 230, attack: 21, defense: 8, stamina: 24, xp: 105, lootChance: 0.45, elite: true, drops: [{ id: "ancient_bone", min: 2, max: 3, chance: 1 }, { id: "cursed_essence", min: 1, max: 2, chance: 0.8 }, { id: "crypt_key", min: 1, max: 1, chance: 0.24 }], flavor: "A former tomb raider who kept the key and forgot the exit." },
    { id: "ash-knight", name: "Ashen Knight", kind: "ELITE · INFERNAL", depth: 6, hp: 410, attack: 32, defense: 13, stamina: 34, xp: 190, lootChance: 0.5, elite: true, drops: [{ id: "infernal_hide", min: 2, max: 3, chance: 1 }, { id: "fire_core", min: 1, max: 2, chance: 0.8 }, { id: "ember_key", min: 1, max: 1, chance: 0.2 }], flavor: "A knight still guarding a treasury that burned down three centuries ago." },
    { id: "void-stalker", name: "Void Stalker", kind: "ELITE · ABYSSAL", depth: 9, hp: 590, attack: 43, defense: 17, stamina: 42, xp: 310, lootChance: 0.6, elite: true, drops: [{ id: "demon_horn", min: 2, max: 3, chance: 1 }, { id: "void_heart", min: 1, max: 1, chance: 0.75 }, { id: "void_key", min: 1, max: 1, chance: 0.16 }], flavor: "It hunts by stepping between shadows. Unfortunately, yours is delicious." }
  ];

  var bosses = [
    { id: "crypt-warden", name: "The Crypt Warden", kind: "DUNGEON BOSS", depth: 3, hp: 380, attack: 22, defense: 10, stamina: 30, xp: 180, lootChance: 1, boss: true, relicGear: "warden_oath", relicArmor: "warden_aegis", relicMaterial: "warden_seal", drops: [{ id: "ancient_bone", min: 3, max: 5, chance: 1 }, { id: "cursed_essence", min: 2, max: 3, chance: 1 }, { id: "warden_seal", min: 1, max: 2, chance: 1 }], flavor: "The crypt's keeper has mistaken your heartbeat for a noise complaint." },
    { id: "infernal-tyrant", name: "The Infernal Tyrant", kind: "DUNGEON BOSS", depth: 6, hp: 720, attack: 36, defense: 15, stamina: 45, xp: 390, lootChance: 1, boss: true, relicGear: "tyrant_brand", relicArmor: "tyrant_cinderplate", relicMaterial: "tyrant_core", drops: [{ id: "infernal_hide", min: 3, max: 5, chance: 1 }, { id: "fire_core", min: 2, max: 3, chance: 1 }, { id: "tyrant_core", min: 1, max: 2, chance: 1 }], flavor: "A crowned furnace that has never once heard the word no." },
    { id: "abyssal-dragon", name: "The Abyssal Dragon", kind: "DUNGEON BOSS", depth: 9, hp: 1200, attack: 50, defense: 20, stamina: 60, xp: 720, lootChance: 1, boss: true, relicGear: "dragonfang", relicArmor: "voidscale_aegis", relicMaterial: "void_heart", drops: [{ id: "infernal_hide", min: 4, max: 6, chance: 1 }, { id: "demon_horn", min: 2, max: 3, chance: 1 }, { id: "void_heart", min: 1, max: 2, chance: 1 }], flavor: "The thing beneath the dungeon. It remembers every crawler who came before you." }
  ];

  var chamberBosses = [
    { id: "crypt-vault-sentinel", name: "The Vault Sentinel", kind: "CHAMBER MINI-BOSS", depth: 3, hp: 310, attack: 24, defense: 9, stamina: 28, xp: 145, lootChance: 1, boss: true, chamberId: "crypt-vault", relicGear: "gravemantle_blade", relicArmor: "gravemantle_guard", relicMaterial: "crypt_key", drops: [{ id: "ancient_bone", min: 3, max: 4, chance: 1 }, { id: "cursed_essence", min: 2, max: 3, chance: 1 }], flavor: "A stone sentinel with a very strict interpretation of trespassing." },
    { id: "ashen-treasury-knight", name: "The Cinderbound Knight", kind: "CHAMBER MINI-BOSS", depth: 6, hp: 540, attack: 38, defense: 14, stamina: 38, xp: 260, lootChance: 1, boss: true, chamberId: "ashen-treasury", relicGear: "sunforged_glaive", relicArmor: "ashen_crownplate", relicMaterial: "ember_key", drops: [{ id: "infernal_hide", min: 3, max: 4, chance: 1 }, { id: "fire_core", min: 2, max: 3, chance: 1 }], flavor: "The treasury's last guard, still polishing armor nobody can afford." },
    { id: "void-archive-keeper", name: "The Hollow Archivist", kind: "CHAMBER MINI-BOSS", depth: 9, hp: 850, attack: 48, defense: 18, stamina: 48, xp: 420, lootChance: 1, boss: true, chamberId: "void-archive", relicGear: "starfall_edge", relicArmor: "archivist_shroud", relicMaterial: "void_key", drops: [{ id: "demon_horn", min: 3, max: 4, chance: 1 }, { id: "void_heart", min: 2, max: 3, chance: 1 }], flavor: "It has catalogued every failed crawler. Your file is already open." }
  ];

  var chambers = [
    { id: "crypt-vault", name: "The Forgotten Crypt Vault", depth: 3, key: "crypt_key", bossId: "crypt-vault-sentinel", stamina: 28, reward: "Gravemantle Relics", description: "A sealed vault beneath the old crypt. Something heavy is moving behind the door." },
    { id: "ashen-treasury", name: "The Ashen Treasury", depth: 6, key: "ember_key", bossId: "ashen-treasury-knight", stamina: 38, reward: "Sunforged Relics", description: "A scorched treasury filled with treasures that refused to melt." },
    { id: "void-archive", name: "The Void Archive", depth: 9, key: "void_key", bossId: "void-archive-keeper", stamina: 48, reward: "Starfall Relics", description: "A library outside time. The books are bound in things that once had names." }
  ];

  var bountyCatalog = [
    { id: "stalker-contract", title: "Pest Control", target: "stalker", goal: 3, description: "Put three Cave Stalkers out of your misery.", xp: 85, rewards: { cave_chitin: 3, bitter_herb: 2 } },
    { id: "elite-contract", title: "Problem Solvers", target: "elite", goal: 2, description: "Defeat two elite monsters anywhere in the dungeon.", xp: 180, rewards: { infernal_hide: 2, cursed_essence: 2 } },
    { id: "boss-contract", title: "Head of the Problem", target: "boss", goal: 1, description: "Defeat one dungeon boss or secret-chamber guardian.", xp: 300, rewards: { warden_seal: 2, fire_core: 2 } }
  ];

  var gearCatalog = [
    { id: "gravemantle_blade", name: "Gravemantle Blade", slot: "weapon", attack: 17, defense: 0, rarity: "Legendary", depth: 3, bossOnly: true, desc: "A vault relic etched with the names of forgotten kings." },
    { id: "gravemantle_guard", name: "Gravemantle Guard", slot: "armor", attack: 0, defense: 16, rarity: "Legendary", depth: 3, bossOnly: true, desc: "Stone-forged armor that remembers every blow it has endured." },
    { id: "sunforged_glaive", name: "Sunforged Glaive", slot: "weapon", attack: 25, defense: 0, rarity: "Legendary", depth: 6, bossOnly: true, desc: "A treasury weapon that burns brighter in the dark." },
    { id: "ashen_crownplate", name: "Ashen Crownplate", slot: "armor", attack: 0, defense: 23, rarity: "Legendary", depth: 6, bossOnly: true, desc: "The last armor worn by the treasury's crowned champion." },
    { id: "starfall_edge", name: "Starfall Edge", slot: "weapon", attack: 36, defense: 0, rarity: "Mythic", depth: 9, bossOnly: true, desc: "A blade forged from a fallen star and a missing hour." },
    { id: "archivist_shroud", name: "Archivist's Shroud", slot: "armor", attack: 0, defense: 31, rarity: "Mythic", depth: 9, bossOnly: true, desc: "A cloak woven from pages that describe the future." },
    { id: "warden_oath", name: "Warden's Oath", slot: "weapon", attack: 13, defense: 0, rarity: "Legendary", depth: 3, bossOnly: true, desc: "A crypt-forged oath that refuses to be broken." },
    { id: "warden_aegis", name: "Warden's Aegis", slot: "armor", attack: 0, defense: 12, rarity: "Legendary", depth: 3, bossOnly: true, desc: "The Warden's own shield, reforged as armor." },
    { id: "tyrant_brand", name: "Tyrant's Brand", slot: "weapon", attack: 21, defense: 0, rarity: "Legendary", depth: 6, bossOnly: true, desc: "A blade branded in the heart of a living inferno." },
    { id: "tyrant_cinderplate", name: "Tyrant's Cinderplate", slot: "armor", attack: 0, defense: 20, rarity: "Legendary", depth: 6, bossOnly: true, desc: "Blackened plate that turns the Tyrant's fire against its enemies." },
    { id: "dragonfang", name: "Abyssal Dragonfang", slot: "weapon", attack: 32, defense: 0, rarity: "Mythic", depth: 9, bossOnly: true, desc: "A fang torn from the oldest thing beneath the dungeon." },
    { id: "voidscale_aegis", name: "Voidscale Aegis", slot: "armor", attack: 0, defense: 28, rarity: "Mythic", depth: 9, bossOnly: true, desc: "Scales that remember the shape of the void." },
    { id: "stalker_fang", name: "Stalker Fang", slot: "weapon", attack: 4, defense: 0, rarity: "Uncommon", depth: 1, desc: "A sharp trophy from a very persistent spider." },
    { id: "chitin_vest", name: "Chitin Vest", slot: "armor", attack: 0, defense: 4, rarity: "Uncommon", depth: 1, desc: "Layered cave chitin. Surprisingly fashionable. Mostly." },
    { id: "cryptbone_blade", name: "Cryptbone Blade", slot: "weapon", attack: 8, defense: 0, rarity: "Rare", depth: 3, desc: "A cold blade reinforced with ancient bone." },
    { id: "guardian_plate", name: "Guardian Plate", slot: "armor", attack: 0, defense: 8, rarity: "Rare", depth: 3, desc: "Armor reclaimed from a guardian who no longer needs it." },
    { id: "infernal_edge", name: "Infernal Edge", slot: "weapon", attack: 14, defense: 0, rarity: "Epic", depth: 6, desc: "A blade that keeps its own temperature. Usually too hot." },
    { id: "infernal_mail", name: "Infernal Mail", slot: "armor", attack: 0, defense: 13, rarity: "Epic", depth: 6, desc: "Forged from infernal hide and several regrettable decisions." }
  ];

  var materialNames = {
    crypt_key: "Crypt Vault Keys",
    ember_key: "Ashen Treasury Keys",
    void_key: "Void Archive Keys",
    bitter_herb: "Bitter Herbs",
    cave_chitin: "Cave Chitin",
    venom_gland: "Venom Glands",
    ancient_bone: "Ancient Bones",
    cursed_essence: "Cursed Essence",
    rusted_fragment: "Rusted Fragments",
    infernal_hide: "Infernal Hide",
    fire_core: "Fire Cores",
    demon_horn: "Demon Horns",
    warden_seal: "Warden Seals",
    tyrant_core: "Tyrant Cores",
    void_heart: "Void Hearts"
  };

  var forgeRecipes = [
    { gear: "stalker_fang", depth: 1, costs: { cave_chitin: 4, venom_gland: 2 }, note: "A fast, vicious starter weapon." },
    { gear: "chitin_vest", depth: 1, costs: { cave_chitin: 6, venom_gland: 1 }, note: "Your first real layer between you and the teeth." },
    { gear: "cryptbone_blade", depth: 3, costs: { ancient_bone: 6, cursed_essence: 2, rusted_fragment: 3 }, note: "A blade forged from the crypt's leftovers." },
    { gear: "guardian_plate", depth: 3, costs: { ancient_bone: 5, cursed_essence: 2, rusted_fragment: 4 }, note: "Heavy protection for increasingly rude monsters." },
    { gear: "infernal_edge", depth: 6, costs: { infernal_hide: 6, fire_core: 2, demon_horn: 1 }, note: "An endgame edge with a temper." },
    { gear: "infernal_mail", depth: 6, costs: { infernal_hide: 8, fire_core: 2, demon_horn: 2 }, note: "Armor made from things that should not be wearable." }
  ];

  var alchemyRecipes = [
    { id: "healing", name: "Field Healing Draught", depth: 1, costs: { bitter_herb: 2, venom_gland: 1 }, output: "Restores up to 45 HP.", action: "craft-healing" },
    { id: "power", name: "Brutal Tonic", depth: 3, costs: { bitter_herb: 2, cursed_essence: 1 }, output: "Adds 5 attack for 30 seconds.", action: "craft-power-tonic" },
    { id: "ward", name: "Warden's Elixir", depth: 3, costs: { ancient_bone: 1, cursed_essence: 1 }, output: "Adds 5 defense for 30 seconds.", action: "craft-ward-tonic" },
    { id: "stamina", name: "Ember Stimulant", depth: 6, costs: { bitter_herb: 2, fire_core: 1 }, output: "Restores 25 stamina instantly.", action: "craft-stamina-elixir" }
  ];

  var timer = null;
  var activeState = null;
  var activeHooks = null;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function depthOf(state) {
    return Math.max(1, Number(state && state.descent && state.descent.depth) || 1);
  }

  function localDayKey() {
    var now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }

  function ensure(state) {
    if (!state || typeof state !== "object") return null;
    var r = state.rpgCombat;
    if (!r || typeof r !== "object") r = state.rpgCombat = {};
    r.level = Math.max(1, Math.floor(Number(r.level) || 1));
    r.xp = Math.max(0, Number(r.xp) || 0);
    r.xpNext = Math.max(100, Number(r.xpNext) || 100);
    r.maxHp = 100 + (r.level - 1) * 12;
    r.hp = clamp(r.hp == null ? r.maxHp : r.hp, 0, r.maxHp);
    r.maxStamina = 100 + (r.level - 1) * 5;
    r.stamina = clamp(r.stamina == null ? r.maxStamina : r.stamina, 0, r.maxStamina);
    r.staminaUpdatedAt = Math.max(0, Number(r.staminaUpdatedAt) || Date.now());
    r.equipment = r.equipment && typeof r.equipment === "object" ? r.equipment : {};
    r.inventory = r.inventory && typeof r.inventory === "object" ? r.inventory : {};
    r.inventory.materials = r.inventory.materials && typeof r.inventory.materials === "object" ? r.inventory.materials : {};
    r.inventory.gear = Array.isArray(r.inventory.gear) ? r.inventory.gear : [];
    r.inventory.potions = Math.max(0, Number(r.inventory.potions) || 0);
    r.inventory.consumables = r.inventory.consumables && typeof r.inventory.consumables === "object" ? r.inventory.consumables : {};
    ["power", "ward"].forEach(function (key) { r.inventory.consumables[key] = Math.max(0, Math.floor(Number(r.inventory.consumables[key]) || 0)); });
    r.inventory.lootBoxes = Math.max(0, Number(r.inventory.lootBoxes) || 0);
    r.upgrades = r.upgrades && typeof r.upgrades === "object" ? r.upgrades : {};
    r.buffs = r.buffs && typeof r.buffs === "object" ? r.buffs : {};
    r.buffs.powerUntil = Math.max(0, Number(r.buffs.powerUntil) || 0);
    r.buffs.wardUntil = Math.max(0, Number(r.buffs.wardUntil) || 0);
    r.kills = r.kills && typeof r.kills === "object" ? r.kills : {};
    r.chambers = r.chambers && typeof r.chambers === "object" ? r.chambers : {};
    r.chambers.discovered = Array.isArray(r.chambers.discovered) ? r.chambers.discovered.filter(function (id) { return chambers.some(function (room) { return room.id === id; }); }) : [];
    r.chambers.cleared = r.chambers.cleared && typeof r.chambers.cleared === "object" ? r.chambers.cleared : {};
    chambers.forEach(function (room) { r.chambers.cleared[room.id] = Math.max(0, Math.floor(Number(r.chambers.cleared[room.id]) || 0)); });
    var today = localDayKey();
    if (!r.bounties || typeof r.bounties !== "object" || r.bounties.day !== today) {
      r.bounties = { day: today, progress: {}, claimed: [] };
    }
    r.bounties.progress = r.bounties.progress && typeof r.bounties.progress === "object" ? r.bounties.progress : {};
    r.bounties.claimed = Array.isArray(r.bounties.claimed) ? r.bounties.claimed.filter(function (id) { return bountyCatalog.some(function (bounty) { return bounty.id === id; }); }) : [];
    bountyCatalog.forEach(function (bounty) { r.bounties.progress[bounty.id] = Math.max(0, Math.floor(Number(r.bounties.progress[bounty.id]) || 0)); });
    r.log = Array.isArray(r.log) ? r.log.slice(-8) : [];
    r.battle = r.battle && typeof r.battle === "object" ? r.battle : null;
    ["weapon", "armor"].forEach(function (slot) {
      var id = r.equipment[slot];
      if (id && !gearCatalog.some(function (item) { return item.id === id && item.slot === slot; })) r.equipment[slot] = null;
    });
    Object.keys(r.inventory.materials).forEach(function (key) {
      r.inventory.materials[key] = Math.max(0, Math.floor(Number(r.inventory.materials[key]) || 0));
    });
    var elapsed = Math.max(0, Date.now() - r.staminaUpdatedAt);
    var recovered = Math.floor(elapsed / 300000);
    if (recovered > 0) {
      r.stamina = Math.min(r.maxStamina, r.stamina + recovered);
      r.staminaUpdatedAt += recovered * 300000;
    }
    return r;
  }

  function itemById(id) {
    return gearCatalog.find(function (item) { return item.id === id; }) || null;
  }

  function stats(r) {
    var weapon = itemById(r.equipment.weapon);
    var armor = itemById(r.equipment.armor);
    var now = Date.now();
    var powerBuff = r.buffs && Number(r.buffs.powerUntil) > now ? 5 : 0;
    var wardBuff = r.buffs && Number(r.buffs.wardUntil) > now ? 5 : 0;
    return {
      attack: 12 + (r.level - 1) + (weapon ? weapon.attack + (Number(r.upgrades[weapon.id]) || 0) * 2 : 0) + powerBuff,
      defense: 5 + Math.floor((r.level - 1) * 0.6) + (armor ? armor.defense + (Number(r.upgrades[armor.id]) || 0) * 2 : 0) + wardBuff,
      maxHp: r.maxHp,
      maxStamina: r.maxStamina
    };
  }

  function log(r, message) {
    r.log.push({ at: Date.now(), text: message });
    r.log = r.log.slice(-7);
  }

  function notify(hooks, message) {
    if (hooks && typeof hooks.toast === "function") hooks.toast(message);
  }

  function persist(hooks) {
    if (hooks && typeof hooks.save === "function") hooks.save();
  }

  function refresh(hooks) {
    persist(hooks);
    if (hooks && typeof hooks.render === "function") hooks.render();
  }

  function monsterById(id) {
    return monsters.find(function (monster) { return monster.id === id; }) ||
      bosses.find(function (monster) { return monster.id === id; }) ||
      chamberBosses.find(function (monster) { return monster.id === id; }) || null;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function awardDrops(r, monster) {
    var earned = [];
    monster.drops.forEach(function (drop) {
      if (Math.random() <= drop.chance) {
        var amount = randInt(drop.min, drop.max);
        r.inventory.materials[drop.id] = (Number(r.inventory.materials[drop.id]) || 0) + amount;
        earned.push(amount + " " + (materialNames[drop.id] || drop.id));
      }
    });
    if (Math.random() <= monster.lootChance) {
      r.inventory.lootBoxes += 1;
      earned.push("a sealed loot cache");
    }
    return earned.length ? earned.join(", ") : "no materials this time";
  }

  function levelUp(r, hooks) {
    var levels = 0;
    while (r.xp >= r.xpNext) {
      r.xp -= r.xpNext;
      r.level += 1;
      r.xpNext = Math.floor(r.xpNext * 1.32);
      r.maxHp = 100 + (r.level - 1) * 12;
      r.maxStamina = 100 + (r.level - 1) * 5;
      r.hp = Math.min(r.maxHp, r.hp + 18);
      r.stamina = Math.min(r.maxStamina, r.stamina + 12);
      levels += 1;
    }
    if (levels) {
      log(r, "LEVEL UP. Combat level " + r.level + ". Your training is becoming mildly concerning.");
      notify(hooks, "Combat level " + r.level + " reached!");
    }
  }

  function recordBountyProgress(r, monster) {
    bountyCatalog.forEach(function (bounty) {
      var matches = bounty.target === "stalker" ? monster.id === "cave-stalker" :
        bounty.target === "elite" ? !!monster.elite :
        bounty.target === "boss" ? !!monster.boss : false;
      if (matches) r.bounties.progress[bounty.id] = Math.min(bounty.goal, (Number(r.bounties.progress[bounty.id]) || 0) + 1);
    });
  }

  function claimBounty(r, bountyId, hooks) {
    var bounty = bountyCatalog.find(function (item) { return item.id === bountyId; });
    if (!bounty) { notify(hooks, "That contract is not on today's board."); return; }
    if (r.bounties.claimed.indexOf(bounty.id) >= 0) { notify(hooks, "That contract has already been claimed today."); return; }
    if ((Number(r.bounties.progress[bounty.id]) || 0) < bounty.goal) { notify(hooks, "Contract incomplete. Finish the objective before claiming its reward."); return; }
    Object.keys(bounty.rewards).forEach(function (materialId) {
      r.inventory.materials[materialId] = (Number(r.inventory.materials[materialId]) || 0) + bounty.rewards[materialId];
    });
    r.bounties.claimed.push(bounty.id);
    r.xp += bounty.xp;
    log(r, "BOUNTY CLAIMED: " + bounty.title + ". +" + bounty.xp + " XP and supply rewards.");
    levelUp(r, hooks);
    notify(hooks, bounty.title + " claimed. +" + bounty.xp + " combat XP.");
    refresh(hooks);
  }

  function winBattle(state, r, hooks) {
    var battle = r.battle;
    var monster = monsterById(battle && battle.monsterId);
    if (!monster) { r.battle = null; return; }
    r.kills[monster.id] = (Number(r.kills[monster.id]) || 0) + 1;
    recordBountyProgress(r, monster);
    r.xp += monster.xp;
    var drops = awardDrops(r, monster);
    if (monster.chamberId) {
      r.chambers.cleared[monster.chamberId] = (Number(r.chambers.cleared[monster.chamberId]) || 0) + 1;
      log(r, "SECRET CHAMBER CLEARED. The journal records " + monster.chamberId + ".");
    }
    if (monster.boss && monster.relicGear) {
      [monster.relicGear, monster.relicArmor].filter(Boolean).forEach(function (relicId) {
        var relic = itemById(relicId);
        var ownedRelic = r.inventory.gear.indexOf(relicId) >= 0 || r.equipment[relic.slot] === relicId;
        if (!ownedRelic) {
          r.inventory.gear.push(relicId);
          drops += ", UNIQUE RELIC: " + relic.name;
        } else {
          r.inventory.materials[monster.relicMaterial] = (Number(r.inventory.materials[monster.relicMaterial]) || 0) + 2;
          drops += ", 2 bonus " + materialNames[monster.relicMaterial];
        }
      });
    }
    log(r, monster.name + " defeated. +" + monster.xp + " combat XP. Loot: " + drops + ".");
    r.battle = null;
    levelUp(r, hooks);
    notify(hooks, monster.name + " defeated. " + drops + ".");
  }

  function loseBattle(r, hooks) {
    var monster = monsterById(r.battle && r.battle.monsterId);
    log(r, (monster ? monster.name : "The monster") + " forced a retreat. Recover, re-equip, and try again.");
    r.battle = null;
    r.hp = Math.max(1, Math.round(r.maxHp * 0.4));
    notify(hooks, "You were defeated. You recovered enough to retreat.");
  }

  function dealDamage(state, r, multiplier, label, hooks) {
    if (!r.battle) return;
    var monster = monsterById(r.battle.monsterId);
    if (!monster) { r.battle = null; return; }
    var player = stats(r);
    var damage = Math.max(1, Math.round(player.attack * multiplier + randInt(-2, 3) - monster.defense));
    r.battle.hp = Math.max(0, r.battle.hp - damage);
    log(r, label + " deals " + damage + " damage to " + monster.name + ".");
    if (monster.boss && r.battle.hp > 0) {
      var ratio = r.battle.hp / r.battle.maxHp;
      var phase = ratio <= 0.3 ? 3 : ratio <= 0.65 ? 2 : 1;
      if (phase > (Number(r.battle.phase) || 1)) {
        r.battle.phase = phase;
        r.battle.telegraph = false;
        log(r, monster.name + " enters PHASE " + phase + ". " + (phase === 2 ? "The arena shakes as its power rises." : "Its final form awakens. Brace yourself."));
        notify(hooks, monster.name + " has entered phase " + phase + "!");
      }
    }
    if (r.battle.hp <= 0) winBattle(state, r, hooks);
  }

  function enemyTurn(r, hooks) {
    if (!r.battle) return;
    var monster = monsterById(r.battle.monsterId);
    if (!monster) { r.battle = null; return; }
    var player = stats(r);
    var boss = !!monster.boss;
    var phase = Number(r.battle.phase) || 1;
    r.battle.enemyTurns = (Number(r.battle.enemyTurns) || 0) + 1;
    if (boss && !r.battle.telegraph && r.battle.enemyTurns % 3 === 0) {
      r.battle.telegraph = true;
      r.battle.telegraphText = phase === 3 ? "DEVASTATING VOID STRIKE INCOMING — GUARD NOW" : phase === 2 ? "HEAVY BOSS ATTACK CHARGING — GUARD NOW" : "BOSS IS WINDING UP A HEAVY ATTACK — GUARD NOW";
      log(r, monster.name + " is charging a devastating attack. Guard before it lands.");
      return;
    }
    var heavy = boss && !!r.battle.telegraph;
    var multiplier = heavy ? (phase === 3 ? 2.25 : phase === 2 ? 1.85 : 1.55) : (phase === 3 ? 1.45 : phase === 2 ? 1.2 : 1);
    var damage = Math.max(1, Math.round((monster.attack * multiplier) + randInt(-2, 2) - player.defense * 0.45));
    if (r.battle.guarding) {
      damage = Math.max(1, Math.floor(damage * (heavy ? 0.25 : 0.4)));
      r.battle.guarding = false;
      log(r, "You brace behind your guard and reduce the incoming blow to " + damage + ".");
    } else {
      log(r, (heavy ? "DEVASTATING STRIKE: " : "") + monster.name + " hits you for " + damage + " damage.");
    }
    r.battle.telegraph = false;
    r.battle.telegraphText = "";
    r.hp = Math.max(0, r.hp - damage);
    if (r.hp <= 0) loseBattle(r, hooks);
  }

  function startBattle(state, id, hooks, chamberEntry) {
    var r = ensure(state);
    var monster = monsterById(id);
    if (!r || !monster) return;
    if (monster.chamberId && !chamberEntry) { notify(hooks, "Use the matching secret chamber key to enter."); return; }
    if (r.battle) { notify(hooks, "Finish your current fight before choosing another target."); return; }
    if (depthOf(state) < monster.depth) { notify(hooks, "That creature is deeper in the dungeon. Descend further to unlock it."); return; }
    if (r.stamina < monster.stamina) { notify(hooks, "Not enough stamina. This hunt requires " + monster.stamina + "."); return; }
    if (r.hp <= 0) r.hp = Math.max(1, Math.round(r.maxHp * 0.4));
    r.stamina -= monster.stamina;
    r.battle = {
      monsterId: monster.id,
      hp: monster.hp,
      maxHp: monster.hp,
      startedAt: Date.now(),
      nextPlayerAt: Date.now() + 1800,
      nextEnemyAt: Date.now() + 2800,
      guarding: false,
      heavyReadyAt: 0,
      phase: 1,
      enemyTurns: 0,
      telegraph: false,
      telegraphText: ""
    };
    log(r, "Hunt started: " + monster.name + ". " + monster.flavor);
    refresh(hooks);
  }

  function enterChamber(state, chamberId, hooks) {
    var r = ensure(state);
    var chamber = chambers.find(function (room) { return room.id === chamberId; });
    if (!r || !chamber) { notify(hooks, "That chamber is not on the map."); return; }
    if (r.battle) { notify(hooks, "Finish your current fight before entering a chamber."); return; }
    if (depthOf(state) < chamber.depth) { notify(hooks, "Reach Descent floor " + chamber.depth + " to reveal this chamber."); return; }
    if (materialCount(r, chamber.key) < 1) { notify(hooks, "You need a " + materialNames[chamber.key] + " to unlock this door."); return; }
    if (r.stamina < chamber.stamina) { notify(hooks, "This chamber guardian requires " + chamber.stamina + " stamina."); return; }
    r.inventory.materials[chamber.key] -= 1;
    if (r.chambers.discovered.indexOf(chamber.id) < 0) r.chambers.discovered.push(chamber.id);
    log(r, "SECRET CHAMBER DISCOVERED: " + chamber.name + ". The door seals behind you.");
    startBattle(state, chamber.bossId, hooks, true);
  }

  function craftPotion(r, hooks) {
    var materials = r.inventory.materials;
    if ((materials.bitter_herb || 0) < 2 || (materials.venom_gland || 0) < 1) {
      notify(hooks, "You need 2 Bitter Herbs and 1 Venom Gland to craft a Healing Draught.");
      return;
    }
    materials.bitter_herb -= 2;
    materials.venom_gland -= 1;
    r.inventory.potions += 1;
    log(r, "Crafted 1 Field Healing Draught. The alchemist is only mildly alarmed.");
    notify(hooks, "Field Healing Draught crafted.");
    refresh(hooks);
  }

  function canAfford(r, costs) {
    return Object.keys(costs).every(function (id) { return materialCount(r, id) >= costs[id]; });
  }

  function costMarkup(r, costs) {
    return Object.keys(costs).map(function (id) {
      var have = materialCount(r, id);
      return '<span class="' + (have >= costs[id] ? "is-funded" : "is-short") + '">' + have + ' / ' + costs[id] + ' ' + esc(materialNames[id] || id) + '</span>';
    }).join("");
  }

  function craftGear(state, r, recipe, hooks) {
    var item = itemById(recipe.gear);
    if (!item || depthOf(state) < recipe.depth) { notify(hooks, "Descend further to unlock this blueprint."); return; }
    if (r.inventory.gear.indexOf(item.id) >= 0 || r.equipment[item.slot] === item.id) { notify(hooks, "You already own this blueprint's equipment."); return; }
    if (!canAfford(r, recipe.costs)) { notify(hooks, "You are missing materials for " + item.name + "."); return; }
    Object.keys(recipe.costs).forEach(function (id) { r.inventory.materials[id] -= recipe.costs[id]; });
    r.inventory.gear.push(item.id);
    log(r, "Forged " + item.name + ". The forge approves. The monster probably won't.");
    notify(hooks, item.name + " forged and added to your equipment pack.");
    refresh(hooks);
  }

  function craftConsumable(r, recipe, hooks) {
    if (!canAfford(r, recipe.costs)) { notify(hooks, "You are missing materials for " + recipe.name + "."); return; }
    Object.keys(recipe.costs).forEach(function (id) { r.inventory.materials[id] -= recipe.costs[id]; });
    if (recipe.id === "healing") {
      r.inventory.potions += 1;
    } else {
      r.inventory.consumables[recipe.id] = (Number(r.inventory.consumables[recipe.id]) || 0) + 1;
    }
    log(r, "Brewed " + recipe.name + ".");
    notify(hooks, recipe.name + " brewed.");
    refresh(hooks);
  }

  function upgradeCost(r, item) {
    var rank = Number(r.upgrades[item.id]) || 0;
    return { material: item.depth >= 6 ? "infernal_hide" : item.depth >= 3 ? "rusted_fragment" : "cave_chitin", amount: 2 + rank };
  }

  function openLootBox(r, hooks, state) {
    if (r.inventory.lootBoxes < 1) { notify(hooks, "No loot caches to open."); return; }
    var availableDepth = depthOf(state);
    var pool = gearCatalog.filter(function (item) { return !item.bossOnly && item.depth <= availableDepth; });
    if (!pool.length) pool = [gearCatalog[0]];
    var item = pool[randInt(0, pool.length - 1)];
    r.inventory.lootBoxes -= 1;
    r.inventory.gear.push(item.id);
    log(r, "Loot cache opened: " + item.name + " (" + item.rarity + ").");
    notify(hooks, "Loot cache opened: " + item.name + ".");
    refresh(hooks);
  }

  function handleAction(state, action, hooks) {
    var r = ensure(state);
    if (!r || !action) return;
    if (action.indexOf("hunt:") === 0) { startBattle(state, action.slice(5), hooks); return; }
    if (action.indexOf("chamber:") === 0) { enterChamber(state, action.slice(8), hooks); return; }
    if (action.indexOf("claim-bounty:") === 0) { claimBounty(r, action.slice(13), hooks); return; }
    if (action.indexOf("forge:") === 0) {
      var forgeRecipe = forgeRecipes.find(function (recipe) { return recipe.gear === action.slice(6); });
      if (!forgeRecipe) { notify(hooks, "That forge blueprint does not exist."); return; }
      craftGear(state, r, forgeRecipe, hooks);
      return;
    }
    if (action.indexOf("brew:") === 0) {
      var brewRecipe = alchemyRecipes.find(function (recipe) { return recipe.id === action.slice(5); });
      if (!brewRecipe) { notify(hooks, "That alchemy recipe does not exist."); return; }
      if (depthOf(state) < brewRecipe.depth) { notify(hooks, "Reach Descent floor " + brewRecipe.depth + " to unlock this recipe."); return; }
      if (brewRecipe.id === "stamina") {
        if (!canAfford(r, brewRecipe.costs)) { notify(hooks, "You are missing materials for " + brewRecipe.name + "."); return; }
        Object.keys(brewRecipe.costs).forEach(function (id) { r.inventory.materials[id] -= brewRecipe.costs[id]; });
        var restored = Math.min(25, r.maxStamina - r.stamina);
        r.stamina += restored;
        log(r, brewRecipe.name + " restores " + restored + " stamina.");
        notify(hooks, restored + " stamina restored.");
        refresh(hooks);
        return;
      }
      craftConsumable(r, brewRecipe, hooks);
      return;
    }
    if (action === "craft-healing") { craftPotion(r, hooks); return; }
    if (action === "craft-power-tonic") { craftConsumable(r, alchemyRecipes[1], hooks); return; }
    if (action === "craft-ward-tonic") { craftConsumable(r, alchemyRecipes[2], hooks); return; }
    if (action === "craft-stamina-elixir") {
      var staminaRecipe = alchemyRecipes[3];
      if (!canAfford(r, staminaRecipe.costs)) { notify(hooks, "You are missing materials for " + staminaRecipe.name + "."); return; }
      Object.keys(staminaRecipe.costs).forEach(function (id) { r.inventory.materials[id] -= staminaRecipe.costs[id]; });
      r.stamina = Math.min(r.maxStamina, r.stamina + 25);
      log(r, "Used " + staminaRecipe.name + ". 25 stamina restored.");
      notify(hooks, "25 stamina restored.");
      refresh(hooks);
      return;
    }
    if (action === "open-cache") { openLootBox(r, hooks, state); return; }
    if (action.indexOf("upgrade:") === 0) {
      var upgradeId = action.slice(8);
      var upgradeItem = itemById(upgradeId);
      if (!upgradeItem || r.inventory.gear.indexOf(upgradeId) < 0) { notify(hooks, "That equipment is not in your combat pack."); return; }
      var rank = Number(r.upgrades[upgradeId]) || 0;
      var cost = upgradeCost(r, upgradeItem);
      if (rank >= 5) { notify(hooks, "That item has reached its maximum enhancement rank."); return; }
      if (materialCount(r, cost.material) < cost.amount) { notify(hooks, "Upgrade requires " + cost.amount + " " + (materialNames[cost.material] || cost.material) + "."); return; }
      r.inventory.materials[cost.material] -= cost.amount;
      r.upgrades[upgradeId] = rank + 1;
      log(r, upgradeItem.name + " enhanced to rank " + (rank + 1) + ".");
      notify(hooks, upgradeItem.name + " upgraded to rank " + (rank + 1) + ".");
      refresh(hooks);
      return;
    }
    if (action.indexOf("equip:") === 0) {
      var id = action.slice(6);
      var item = itemById(id);
      var index = r.inventory.gear.indexOf(id);
      if (!item || index < 0) { notify(hooks, "That equipment is not in your combat pack."); return; }
      r.equipment[item.slot] = id;
      log(r, "Equipped " + item.name + ".");
      refresh(hooks);
      return;
    }
    if (!r.battle) { notify(hooks, "Choose a monster to begin a hunt."); return; }
    if (action === "quick-strike") {
      if (Date.now() < Number(r.battle.quickReadyAt || 0)) { notify(hooks, "Quick Strike is still recovering."); return; }
      r.battle.quickReadyAt = Date.now() + 1300;
      dealDamage(state, r, 1.2, "Quick Strike", hooks);
      refresh(hooks);
    } else if (action === "heavy-strike") {
      if (r.stamina < 5) { notify(hooks, "Heavy Strike needs 5 stamina."); return; }
      if (Date.now() < Number(r.battle.heavyReadyAt || 0)) { notify(hooks, "Heavy Strike is still recovering."); return; }
      r.stamina -= 5;
      r.battle.heavyReadyAt = Date.now() + 8000;
      dealDamage(state, r, 2.1, "Heavy Strike", hooks);
      refresh(hooks);
    } else if (action === "guard") {
      r.battle.guarding = true;
      log(r, "Guard raised. The next enemy hit will be reduced.");
      refresh(hooks);
    } else if (action === "use-potion") {
      if (r.inventory.potions < 1) { notify(hooks, "No Healing Draughts available. Craft one from monster materials."); return; }
      if (r.hp >= r.maxHp) { notify(hooks, "Your health is already full."); return; }
      r.inventory.potions -= 1;
      var healed = Math.min(45, r.maxHp - r.hp);
      r.hp += healed;
      log(r, "Healing Draught restores " + healed + " HP.");
      refresh(hooks);
    } else if (action === "use-power-tonic" || action === "use-ward-tonic") {
      var tonic = action === "use-power-tonic" ? "power" : "ward";
      if (r.inventory.consumables[tonic] < 1) { notify(hooks, "You do not have that tonic ready."); return; }
      r.inventory.consumables[tonic] -= 1;
      r.buffs[tonic + "Until"] = Date.now() + 30000;
      log(r, tonic === "power" ? "Brutal Tonic active: +5 attack for 30 seconds." : "Warden's Elixir active: +5 defense for 30 seconds.");
      notify(hooks, tonic === "power" ? "Attack increased for 30 seconds." : "Defense increased for 30 seconds.");
      refresh(hooks);
    } else if (action === "flee") {
      var monster = monsterById(r.battle.monsterId);
      r.battle = null;
      log(r, "Retreated from " + (monster ? monster.name : "the encounter") + ". Stamina spent is not refunded.");
      notify(hooks, "You escaped. The monster is telling everyone it won.");
      refresh(hooks);
    }
  }

  function tick() {
    if (!activeState || !activeHooks) return;
    var previousStamina = activeState.rpgCombat ? Number(activeState.rpgCombat.stamina) || 0 : 0;
    var r = ensure(activeState);
    if (!r) { stopTimer(); return; }
    if (!r.battle) {
      if (r.stamina !== previousStamina) refresh(activeHooks);
      return;
    }
    var now = Date.now();
    var changed = false;
    if (now >= Number(r.battle.nextPlayerAt || 0)) {
      dealDamage(activeState, r, 1, "Auto attack", activeHooks);
      if (r.battle) r.battle.nextPlayerAt = now + 2800;
      changed = true;
    }
    if (r.battle && now >= Number(r.battle.nextEnemyAt || 0)) {
      enemyTurn(r, activeHooks);
      if (r.battle) r.battle.nextEnemyAt = now + 3200;
      changed = true;
    }
    if (changed) refresh(activeHooks);
  }

  function stopTimer() {
    if (timer) window.clearInterval(timer);
    timer = null;
    activeState = null;
    activeHooks = null;
  }

  function sync(state, page, hooks) {
    if (page !== "combat" || !state) {
      stopTimer();
      return;
    }
    if (timer) {
      activeState = state;
      activeHooks = hooks;
      return;
    }
    activeState = state;
    activeHooks = hooks;
    var now = Date.now();
    if (state.rpgCombat && state.rpgCombat.battle) {
      state.rpgCombat.battle.nextPlayerAt = now + 1600;
      state.rpgCombat.battle.nextEnemyAt = now + 2600;
    }
    timer = window.setInterval(tick, 450);
  }

  function materialCount(r, id) {
    return Math.max(0, Number(r.inventory.materials[id]) || 0);
  }

  function bar(value, max, cls) {
    var pct = max > 0 ? clamp(value / max * 100, 0, 100) : 0;
    return '<div class="rpg-meter ' + cls + '"><i style="width:' + pct + '%"></i></div>';
  }

  function renderBattle(r) {
    var battle = r.battle;
    var monster = monsterById(battle.monsterId);
    if (!monster) return "";
    var player = stats(r);
    var quickReady = Date.now() >= Number(battle.quickReadyAt || 0);
    var heavyReady = Date.now() >= Number(battle.heavyReadyAt || 0);
    return '<section class="rpg-battle-panel"><div class="rpg-battle-heading"><div><div class="rpg-eyebrow">ACTIVE ENCOUNTER · ' + esc(monster.kind) + '</div><h2>' + esc(monster.name) + '</h2><p>' + esc(monster.flavor) + '</p></div><span class="rpg-live-mark">IN COMBAT</span></div>' +
      (monster.boss ? '<div class="rpg-boss-phase">BOSS PHASE ' + (Number(battle.phase) || 1) + ' / 3' + (battle.telegraph ? '<strong>' + esc(battle.telegraphText || "HEAVY ATTACK INCOMING — GUARD NOW") + '</strong>' : '<span>Watch for charged attacks and guard at the right moment.</span>') + '</div>' : '') +
      '<div class="rpg-combatants"><article class="rpg-combatant rpg-player-combatant"><span class="rpg-combatant-icon">♙</span><small>CRAWLER</small><b>LVL ' + r.level + '</b><strong>' + r.hp + ' / ' + r.maxHp + ' HP</strong>' + bar(r.hp, r.maxHp, "rpg-hp") + '<small>ATK ' + player.attack + ' · DEF ' + player.defense + '</small></article>' +
      '<div class="rpg-versus">VS</div><article class="rpg-combatant rpg-monster-combatant"><span class="rpg-combatant-icon">☠</span><small>HOSTILE</small><b>' + esc(monster.kind) + '</b><strong>' + battle.hp + ' / ' + battle.maxHp + ' HP</strong>' + bar(battle.hp, battle.maxHp, "rpg-enemy-hp") + '<small>ATK ' + monster.attack + ' · DEF ' + monster.defense + '</small></article></div>' +
      '<div class="rpg-action-grid"><button class="rpg-action-primary" data-rpg-action="quick-strike" ' + (quickReady ? "" : "disabled") + '>⚔ QUICK STRIKE</button><button data-rpg-action="heavy-strike" ' + (heavyReady && r.stamina >= 5 ? "" : "disabled") + '>✦ HEAVY STRIKE <small>5 STAMINA</small></button><button data-rpg-action="guard">⬟ GUARD</button><button data-rpg-action="use-potion" ' + (r.inventory.potions > 0 && r.hp < r.maxHp ? "" : "disabled") + '>✚ HEALING DRAUGHT <small>' + r.inventory.potions + ' READY</small></button><button data-rpg-action="use-power-tonic" ' + (r.inventory.consumables.power > 0 ? "" : "disabled") + '>✦ BRUTAL TONIC <small>' + r.inventory.consumables.power + ' READY</small></button><button data-rpg-action="use-ward-tonic" ' + (r.inventory.consumables.ward > 0 ? "" : "disabled") + '>⬡ WARDEN ELIXIR <small>' + r.inventory.consumables.ward + ' READY</small></button></div>' +
      '<div class="rpg-battle-footer"><span>Auto-attacks are active while this screen is open.</span><button class="rpg-text-button" data-rpg-action="flee">RETREAT</button></div>' +
      '<div class="rpg-log"><div class="rpg-eyebrow">BATTLE LOG</div>' + r.log.slice(-5).reverse().map(function (entry) { return '<p>' + esc(entry.text) + '</p>'; }).join("") + '</div></section>';
  }

  function renderMonsters(state, r) {
    var depth = depthOf(state);
    return monsters.map(function (monster) {
      var unlocked = depth >= monster.depth;
      var kills = Number(r.kills[monster.id]) || 0;
      return '<article class="rpg-monster-card ' + (unlocked ? "" : "is-locked") + '"><div class="rpg-monster-symbol">' + (monster.id === "cave-stalker" ? "♜" : monster.id === "crypt-guardian" ? "☠" : "♨") + '</div><div class="rpg-monster-copy"><div class="rpg-eyebrow">' + esc(monster.kind) + ' · ' + (unlocked ? "UNLOCKED" : "LOCKED") + '</div><h3>' + esc(monster.name) + '</h3><p>' + esc(unlocked ? monster.flavor : "Reach Descent floor " + monster.depth + " to reveal this target.") + '</p><div class="rpg-monster-meta"><span>HP ' + monster.hp + '</span><span>ATK ' + monster.attack + '</span><span>STAMINA ' + monster.stamina + '</span><span>' + kills + ' KILLS</span></div></div><button class="rpg-hunt-button" data-rpg-action="hunt:' + monster.id + '" ' + (!unlocked || !!r.battle || r.stamina < monster.stamina ? "disabled" : "") + '>' + (!unlocked ? "LOCKED" : r.stamina < monster.stamina ? "NEED STAMINA" : "HUNT") + '</button></article>';
    }).join("");
  }

  function renderChambers(state, r) {
    var depth = depthOf(state);
    var discoveredCount = r.chambers.discovered.length;
    var clearedCount = chambers.filter(function (room) { return (Number(r.chambers.cleared[room.id]) || 0) > 0; }).length;
    return '<section class="rpg-chamber-board"><div class="rpg-section-head"><div><div class="rpg-eyebrow">HIDDEN ROOMS · KEY REQUIRED</div><h2>Secret Chambers</h2></div><span class="rpg-count">' + discoveredCount + ' / ' + chambers.length + ' FOUND · ' + clearedCount + ' CLEARED</span></div><p class="rpg-section-hint">Elite monsters sometimes carry sealed keys. Spend one to enter a hidden room, defeat its guardian, and claim a chamber-only relic set. Keys are consumed when the door opens.</p><div class="rpg-chamber-list">' + chambers.map(function (room) {
      var unlocked = depth >= room.depth;
      var keys = materialCount(r, room.key);
      var discovered = r.chambers.discovered.indexOf(room.id) >= 0;
      var clears = Number(r.chambers.cleared[room.id]) || 0;
      var guardian = monsterById(room.bossId);
      var relicWeapon = itemById(guardian.relicGear);
      var relicArmor = itemById(guardian.relicArmor);
      return '<article class="rpg-chamber-card ' + (unlocked ? "" : "is-locked") + '"><div class="rpg-chamber-seal">' + (clears ? "✦" : discovered ? "◇" : "⌑") + '</div><div class="rpg-chamber-copy"><div class="rpg-eyebrow">' + (clears ? "CLEARED " + clears + "×" : discovered ? "DISCOVERED" : unlocked ? "SIGNAL DETECTED" : "FLOOR " + room.depth + " REQUIRED") + '</div><h3>' + esc(room.name) + '</h3><p>' + esc(unlocked ? room.description : "Descend to floor " + room.depth + " to uncover its location.") + '</p><div class="rpg-monster-meta"><span>KEYS ' + keys + '</span><span>GUARDIAN HP ' + guardian.hp + '</span><span>' + room.stamina + ' STAMINA</span></div><small class="rpg-chamber-reward">RELIC SET · ' + esc(relicWeapon.name) + ' + ' + esc(relicArmor.name) + '</small></div><button class="rpg-hunt-button rpg-chamber-button" data-rpg-action="chamber:' + room.id + '" ' + (!unlocked || keys < 1 || !!r.battle || r.stamina < room.stamina ? "disabled" : "") + '>' + (!unlocked ? "LOCKED" : keys < 1 ? "KEY REQUIRED" : r.stamina < room.stamina ? "NEED STAMINA" : "UNLOCK & ENTER") + '</button></article>';
    }).join("") + '</div></section>';
  }

  function renderBounties(r) {
    var claimed = r.bounties.claimed;
    var completed = bountyCatalog.filter(function (bounty) { return (Number(r.bounties.progress[bounty.id]) || 0) >= bounty.goal; }).length;
    return '<section class="rpg-bounty-board"><div class="rpg-section-head"><div><div class="rpg-eyebrow">DAILY CONTRACTS · RESETS AT LOCAL MIDNIGHT</div><h2>Bounty Board</h2></div><span class="rpg-count">' + completed + ' / ' + bountyCatalog.length + ' COMPLETE</span></div><p class="rpg-section-hint">The guild has work. You have questionable judgment. Progress is earned from victories, and each contract can be claimed once per day.</p><div class="rpg-bounty-list">' + bountyCatalog.map(function (bounty) {
      var progress = Math.min(bounty.goal, Number(r.bounties.progress[bounty.id]) || 0);
      var isClaimed = claimed.indexOf(bounty.id) >= 0;
      var ready = progress >= bounty.goal && !isClaimed;
      return '<article class="rpg-bounty-card ' + (isClaimed ? "is-claimed" : ready ? "is-ready" : "") + '"><div class="rpg-bounty-copy"><div class="rpg-eyebrow">' + (isClaimed ? "REWARD CLAIMED" : ready ? "OBJECTIVE COMPLETE" : "GUILD CONTRACT") + '</div><h3>' + esc(bounty.title) + '</h3><p>' + esc(bounty.description) + '</p><div class="rpg-bounty-progress"><span>' + progress + ' / ' + bounty.goal + ' VICTORIES</span>' + bar(progress, bounty.goal, "rpg-bounty-meter") + '</div><small>REWARD · ' + bounty.xp + ' XP + ' + Object.keys(bounty.rewards).map(function (id) { return bounty.rewards[id] + " " + (materialNames[id] || id); }).join(" · ") + '</small></div><button class="rpg-hunt-button rpg-bounty-button" data-rpg-action="claim-bounty:' + bounty.id + '" ' + (!ready ? "disabled" : "") + '>' + (isClaimed ? "CLAIMED" : ready ? "CLAIM REWARD" : "IN PROGRESS") + '</button></article>';
    }).join("") + '</div></section>';
  }

  function renderBosses(state, r) {
    var depth = depthOf(state);
    return '<section class="rpg-boss-board"><div class="rpg-section-head"><div><div class="rpg-eyebrow">ELITE HUNTS · HIGH RISK / HIGH REWARD</div><h2>Dungeon Bosses</h2></div><span class="rpg-count">3 ENCOUNTERS</span></div><p class="rpg-section-hint">Bosses have multiple phases, telegraphed heavy attacks, guaranteed trophy materials, and a unique relic on your first victory.</p><div class="rpg-boss-list">' + bosses.map(function (boss) {
      var unlocked = depth >= boss.depth;
      var kills = Number(r.kills[boss.id]) || 0;
      var relic = itemById(boss.relicGear);
      var relicArmor = itemById(boss.relicArmor);
      var ownsRelic = [boss.relicGear, boss.relicArmor].every(function (id) {
        var item = itemById(id);
        return r.inventory.gear.indexOf(id) >= 0 || r.equipment[item.slot] === id;
      });
      return '<article class="rpg-boss-card ' + (unlocked ? "" : "is-locked") + '"><div class="rpg-boss-mark">♛</div><div class="rpg-boss-copy"><div class="rpg-eyebrow">' + (unlocked ? "BOSS UNLOCKED" : "FLOOR " + boss.depth + " REQUIRED") + ' · ' + esc(boss.kind) + '</div><h3>' + esc(boss.name) + '</h3><p>' + esc(unlocked ? boss.flavor : "Reach Descent floor " + boss.depth + " to challenge this boss.") + '</p><div class="rpg-monster-meta"><span>HP ' + boss.hp + '</span><span>ATK ' + boss.attack + '</span><span>DEF ' + boss.defense + '</span><span>' + kills + ' VICTORIES</span></div><small class="rpg-boss-relic">' + (ownsRelic ? "RELICS CLAIMED · " : "FIRST VICTORY RELICS · ") + esc(relic.name) + ' + ' + esc(relicArmor.name) + '</small></div><button class="rpg-hunt-button rpg-boss-button" data-rpg-action="hunt:' + boss.id + '" ' + (!unlocked || !!r.battle || r.stamina < boss.stamina ? "disabled" : "") + '>' + (!unlocked ? "LOCKED" : r.stamina < boss.stamina ? "NEED STAMINA" : "CHALLENGE") + '</button></article>';
    }).join("") + '</div></section>';
  }

  function renderForge(state, r) {
    var depth = depthOf(state);
    var cards = forgeRecipes.map(function (recipe) {
      var item = itemById(recipe.gear);
      var owned = r.inventory.gear.indexOf(recipe.gear) >= 0 || r.equipment[item.slot] === recipe.gear;
      var unlocked = depth >= recipe.depth;
      var ready = unlocked && !owned && canAfford(r, recipe.costs);
      return '<article class="rpg-recipe-card"><div class="rpg-recipe-title"><div><small>' + esc(item.rarity) + ' · ' + esc(item.slot) + '</small><b>' + esc(item.name) + '</b></div><span>' + (owned ? "OWNED" : unlocked ? "FLOOR " + recipe.depth : "LOCKED") + '</span></div><p>' + esc(recipe.note) + '</p><div class="rpg-recipe-costs">' + costMarkup(r, recipe.costs) + '</div><button class="rpg-action-primary rpg-craft-button" data-rpg-action="forge:' + recipe.gear + '" ' + (ready ? "" : "disabled") + '>' + (owned ? "ALREADY OWNED" : !unlocked ? "DESCEND TO UNLOCK" : "FORGE EQUIPMENT") + '</button></article>';
    }).join("");
    return '<section class="rpg-subpanel"><div class="rpg-section-head"><div><div class="rpg-eyebrow">THE FORGE</div><h3>Weapons & Armor</h3></div><span class="rpg-count">6 BLUEPRINTS</span></div><p class="rpg-section-hint">Turn monster trophies into permanent equipment. Blueprints unlock as you descend; forged gear can be equipped and enhanced.</p><div class="rpg-recipe-grid">' + cards + '</div></section>';
  }

  function renderAlchemy(state, r) {
    var depth = depthOf(state);
    var cards = alchemyRecipes.map(function (recipe) {
      var unlocked = depth >= recipe.depth;
      var count = recipe.id === "healing" ? r.inventory.potions : recipe.id === "stamina" ? "INSTANT" : r.inventory.consumables[recipe.id];
      var ready = unlocked && canAfford(r, recipe.costs);
      return '<article class="rpg-recipe-card"><div class="rpg-recipe-title"><div><small>ALCHEMY · ' + (recipe.depth === 1 ? "BASIC" : recipe.depth === 3 ? "ADVANCED" : "MASTER") + '</small><b>' + esc(recipe.name) + '</b></div><span>' + (unlocked ? (recipe.id === "stamina" ? "ON DEMAND" : count + " READY") : "LOCKED") + '</span></div><p>' + esc(recipe.output) + '</p><div class="rpg-recipe-costs">' + costMarkup(r, recipe.costs) + '</div><button class="rpg-action-primary rpg-craft-button" data-rpg-action="brew:' + recipe.id + '" ' + (ready ? "" : "disabled") + '>' + (!unlocked ? "DESCEND TO UNLOCK" : recipe.id === "stamina" ? "BREW & RESTORE 25" : "BREW ITEM") + '</button></article>';
    }).join("");
    return '<section class="rpg-subpanel"><div class="rpg-section-head"><div><div class="rpg-eyebrow">THE ALCHEMY LAB</div><h3>Potions & Combat Tonics</h3></div><span class="rpg-count">' + r.inventory.potions + ' HEALING DRAUGHTS</span></div><p class="rpg-section-hint">Craft every consumable from monster materials. Advanced recipes require deeper exploration.</p><div class="rpg-recipe-grid">' + cards + '</div></section>';
  }

  function renderInventory(r) {
    var mats = Object.keys(materialNames).filter(function (id) { return materialCount(r, id) > 0; });
    var gear = r.inventory.gear.map(function (id) { return itemById(id); }).filter(Boolean);
    var materialMarkup = mats.length ? mats.map(function (id) { return '<div class="rpg-material-chip"><b>' + materialCount(r, id) + '</b><span>' + esc(materialNames[id]) + '</span></div>'; }).join("") : '<p class="rpg-empty-copy">No monster materials yet. The first hunt is waiting.</p>';
    var gearMarkup = gear.length ? gear.map(function (item) {
      var equipped = r.equipment[item.slot] === item.id;
      var rank = Number(r.upgrades[item.id]) || 0;
      var cost = upgradeCost(r, item);
      return '<article class="rpg-gear-row"><div><small>' + esc(item.rarity) + ' · ' + esc(item.slot) + ' · RANK ' + rank + '</small><b>' + esc(item.name) + '</b><span>' + (item.attack ? "+" + (item.attack + rank * 2) + " ATK" : "+" + (item.defense + rank * 2) + " DEF") + '</span></div><div class="rpg-gear-actions"><button data-rpg-action="equip:' + item.id + '" ' + (equipped ? "disabled" : "") + '>' + (equipped ? "EQUIPPED" : "EQUIP") + '</button><button data-rpg-action="upgrade:' + item.id + '" ' + (rank >= 5 || materialCount(r, cost.material) < cost.amount ? "disabled" : "") + '>+ ENHANCE</button></div></article>';
    }).join("") : '<p class="rpg-empty-copy">No equipment found. Loot caches may contain upgrades.</p>';
    var weapon = itemById(r.equipment.weapon);
    var armor = itemById(r.equipment.armor);
    return '<section class="rpg-subpanel"><div class="rpg-section-head"><div><div class="rpg-eyebrow">CHARACTER LOADOUT</div><h3>Equipment</h3></div></div><div class="rpg-equipped-grid"><div><small>WEAPON</small><b>' + esc(weapon ? weapon.name : "Unarmed") + '</b></div><div><small>ARMOR</small><b>' + esc(armor ? armor.name : "Unarmored") + '</b></div></div><div class="rpg-stat-line"><span>ATTACK <b>' + stats(r).attack + '</b></span><span>DEFENSE <b>' + stats(r).defense + '</b></span></div><div class="rpg-divider"></div><div class="rpg-section-head"><div><div class="rpg-eyebrow">FIELD PACK</div><h3>Equipment found</h3></div><span class="rpg-count">' + gear.length + ' ITEMS</span></div>' + gearMarkup + '<div class="rpg-divider"></div><div class="rpg-section-head"><div><div class="rpg-eyebrow">MONSTER COMPONENTS</div><h3>Materials</h3></div></div><div class="rpg-material-grid">' + materialMarkup + '</div></section>';
  }

  function render(state) {
    var r = ensure(state);
    if (!r) return '<section class="rpg-page"><h1>COMBAT UNAVAILABLE</h1></section>';
    var player = stats(r);
    var depth = depthOf(state);
    var xpPct = clamp(r.xp / r.xpNext * 100, 0, 100);
    var potionReady = materialCount(r, "bitter_herb") >= 2 && materialCount(r, "venom_gland") >= 1;
    return '<div class="rpg-page"><section class="rpg-hero"><div class="rpg-hero-copy"><div class="rpg-eyebrow">DUO DUNGEON · COMBAT DIVISION</div><h1>THE HUNTING GROUNDS</h1><p>Descent reveals the prey. Your preparation decides whether you become the meal.</p><div class="rpg-hero-tags"><span>FLOOR ' + depth + ' REACHED</span><span>COMBAT LEVEL ' + r.level + '</span></div></div><div class="rpg-hero-sigil">⚔</div></section>' +
      '<section class="rpg-resource-grid"><article><small>STAMINA</small><strong>' + r.stamina + '<i> / ' + r.maxStamina + '</i></strong>' + bar(r.stamina, r.maxStamina, "rpg-stamina") + '<span>Regenerates 1 every 5 minutes.</span></article><article><small>HEALTH</small><strong>' + r.hp + '<i> / ' + r.maxHp + '</i></strong>' + bar(r.hp, r.maxHp, "rpg-hp") + '<span>Healing Draughts restore up to 45 HP.</span></article><article><small>COMBAT EXPERIENCE</small><strong>' + r.xp + '<i> / ' + r.xpNext + ' XP</i></strong>' + bar(r.xp, r.xpNext, "rpg-xp") + '<span>Level-ups improve your combat stats.</span></article></section>' +
      renderBounties(r) + (r.battle ? renderBattle(r) : '<section class="rpg-subpanel rpg-hunt-board"><div class="rpg-section-head"><div><div class="rpg-eyebrow">AVAILABLE TARGETS</div><h2>Hunt Board</h2></div><span class="rpg-count">' + monsters.filter(function (m) { return depth >= m.depth; }).length + ' / ' + monsters.length + ' CREATURES</span></div><p class="rpg-section-hint">Hunt ordinary monsters for crafting materials, or challenge a boss for a multi-phase fight and unique relic.</p><div class="rpg-monster-list">' + renderMonsters(state, r) + '</div></section>' + renderBosses(state, r)) +
      renderChambers(state, r) + renderForge(state, r) + renderAlchemy(state, r) +
      '<section class="rpg-subpanel"><div class="rpg-section-head"><div><div class="rpg-eyebrow">REWARD CACHE</div><h3>Sealed Loot</h3></div><span class="rpg-count">' + r.inventory.lootBoxes + ' CACHES</span></div><p class="rpg-section-hint">Monster loot caches contain equipment appropriate to your deepest unlocked floor.</p><button class="rpg-action-primary rpg-craft-button" data-rpg-action="open-cache" ' + (r.inventory.lootBoxes > 0 ? "" : "disabled") + '>◇ OPEN LOOT CACHE</button></section>' +
      renderInventory(r) + '<p class="rpg-footnote">Combat uses stamina, never Step Power. Basic attacks run automatically while this page is open; you control special attacks, guarding, and healing.</p></div>';
  }

  window.DUO_RPG_COMBAT = {
    ensure: ensure,
    render: render,
    handleAction: handleAction,
    sync: sync
  };
})();