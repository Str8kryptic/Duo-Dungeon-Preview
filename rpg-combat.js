(function () {
  "use strict";

  var monsters = [
    { id: "cave-stalker", name: "Cave Stalker", kind: "ARACHNID", depth: 1, hp: 72, attack: 9, defense: 2, stamina: 10, xp: 28, lootChance: 0.14, drops: [{ id: "bitter_herb", min: 1, max: 2, chance: 1 }, { id: "cave_chitin", min: 1, max: 2, chance: 0.8 }, { id: "venom_gland", min: 1, max: 1, chance: 0.38 }], flavor: "A patient hunter with too many legs and absolutely no respect for personal space." },
    { id: "crypt-guardian", name: "Crypt Guardian", kind: "UNDEAD", depth: 3, hp: 156, attack: 16, defense: 6, stamina: 18, xp: 62, lootChance: 0.2, drops: [{ id: "ancient_bone", min: 1, max: 2, chance: 1 }, { id: "cursed_essence", min: 1, max: 1, chance: 0.48 }, { id: "rusted_fragment", min: 1, max: 2, chance: 0.75 }], flavor: "The previous occupants are still unhappy with the dungeon's management." },
    { id: "infernal-beast", name: "Infernal Beast", kind: "DEMONIC", depth: 6, hp: 285, attack: 27, defense: 10, stamina: 28, xp: 118, lootChance: 0.28, drops: [{ id: "infernal_hide", min: 1, max: 2, chance: 1 }, { id: "fire_core", min: 1, max: 1, chance: 0.5 }, { id: "demon_horn", min: 1, max: 1, chance: 0.32 }], flavor: "A walking furnace with anger-management issues and excellent loot prospects." }
  ];

  var gearCatalog = [
    { id: "stalker_fang", name: "Stalker Fang", slot: "weapon", attack: 4, defense: 0, rarity: "Uncommon", depth: 1, desc: "A sharp trophy from a very persistent spider." },
    { id: "chitin_vest", name: "Chitin Vest", slot: "armor", attack: 0, defense: 4, rarity: "Uncommon", depth: 1, desc: "Layered cave chitin. Surprisingly fashionable. Mostly." },
    { id: "cryptbone_blade", name: "Cryptbone Blade", slot: "weapon", attack: 8, defense: 0, rarity: "Rare", depth: 3, desc: "A cold blade reinforced with ancient bone." },
    { id: "guardian_plate", name: "Guardian Plate", slot: "armor", attack: 0, defense: 8, rarity: "Rare", depth: 3, desc: "Armor reclaimed from a guardian who no longer needs it." },
    { id: "infernal_edge", name: "Infernal Edge", slot: "weapon", attack: 14, defense: 0, rarity: "Epic", depth: 6, desc: "A blade that keeps its own temperature. Usually too hot." },
    { id: "infernal_mail", name: "Infernal Mail", slot: "armor", attack: 0, defense: 13, rarity: "Epic", depth: 6, desc: "Forged from infernal hide and several regrettable decisions." }
  ];

  var materialNames = {
    bitter_herb: "Bitter Herbs",
    cave_chitin: "Cave Chitin",
    venom_gland: "Venom Glands",
    ancient_bone: "Ancient Bones",
    cursed_essence: "Cursed Essence",
    rusted_fragment: "Rusted Fragments",
    infernal_hide: "Infernal Hide",
    fire_core: "Fire Cores",
    demon_horn: "Demon Horns"
  };

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
    r.inventory.lootBoxes = Math.max(0, Number(r.inventory.lootBoxes) || 0);
    r.kills = r.kills && typeof r.kills === "object" ? r.kills : {};
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
    return {
      attack: 12 + (r.level - 1) + (weapon ? weapon.attack : 0),
      defense: 5 + Math.floor((r.level - 1) * 0.6) + (armor ? armor.defense : 0),
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
    return monsters.find(function (monster) { return monster.id === id; }) || null;
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

  function winBattle(state, r, hooks) {
    var battle = r.battle;
    var monster = monsterById(battle && battle.monsterId);
    if (!monster) { r.battle = null; return; }
    r.kills[monster.id] = (Number(r.kills[monster.id]) || 0) + 1;
    r.xp += monster.xp;
    var drops = awardDrops(r, monster);
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
    if (r.battle.hp <= 0) winBattle(state, r, hooks);
  }

  function enemyTurn(r, hooks) {
    if (!r.battle) return;
    var monster = monsterById(r.battle.monsterId);
    if (!monster) { r.battle = null; return; }
    var player = stats(r);
    var damage = Math.max(1, Math.round(monster.attack + randInt(-2, 2) - player.defense * 0.45));
    if (r.battle.guarding) {
      damage = Math.max(1, Math.floor(damage * 0.4));
      r.battle.guarding = false;
      log(r, "You brace behind your guard and reduce the incoming blow to " + damage + ".");
    } else {
      log(r, monster.name + " hits you for " + damage + " damage.");
    }
    r.hp = Math.max(0, r.hp - damage);
    if (r.hp <= 0) loseBattle(r, hooks);
  }

  function startBattle(state, id, hooks) {
    var r = ensure(state);
    var monster = monsterById(id);
    if (!r || !monster) return;
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
      heavyReadyAt: 0
    };
    log(r, "Hunt started: " + monster.name + ". " + monster.flavor);
    refresh(hooks);
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

  function openLootBox(r, hooks, state) {
    if (r.inventory.lootBoxes < 1) { notify(hooks, "No loot caches to open."); return; }
    var availableDepth = depthOf(state);
    var pool = gearCatalog.filter(function (item) { return item.depth <= availableDepth; });
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
    if (action === "craft-healing") { craftPotion(r, hooks); return; }
    if (action === "open-cache") { openLootBox(r, hooks, state); return; }
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
    var r = ensure(activeState);
    if (!r || !r.battle) { stopTimer(); return; }
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
    if (page !== "combat" || !state || !state.rpgCombat || !state.rpgCombat.battle) {
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
    state.rpgCombat.battle.nextPlayerAt = now + 1600;
    state.rpgCombat.battle.nextEnemyAt = now + 2600;
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
    var heavyReady = Date.now() >= Number(battle.heavyReadyAt || 0);
    return '<section class="rpg-battle-panel"><div class="rpg-battle-heading"><div><div class="rpg-eyebrow">ACTIVE ENCOUNTER · ' + esc(monster.kind) + '</div><h2>' + esc(monster.name) + '</h2><p>' + esc(monster.flavor) + '</p></div><span class="rpg-live-mark">IN COMBAT</span></div>' +
      '<div class="rpg-combatants"><article class="rpg-combatant rpg-player-combatant"><span class="rpg-combatant-icon">♙</span><small>CRAWLER</small><b>LVL ' + r.level + '</b><strong>' + r.hp + ' / ' + r.maxHp + ' HP</strong>' + bar(r.hp, r.maxHp, "rpg-hp") + '<small>ATK ' + player.attack + ' · DEF ' + player.defense + '</small></article>' +
      '<div class="rpg-versus">VS</div><article class="rpg-combatant rpg-monster-combatant"><span class="rpg-combatant-icon">☠</span><small>HOSTILE</small><b>' + esc(monster.kind) + '</b><strong>' + battle.hp + ' / ' + battle.maxHp + ' HP</strong>' + bar(battle.hp, battle.maxHp, "rpg-enemy-hp") + '<small>ATK ' + monster.attack + ' · DEF ' + monster.defense + '</small></article></div>' +
      '<div class="rpg-action-grid"><button class="rpg-action-primary" data-rpg-action="quick-strike">⚔ QUICK STRIKE</button><button data-rpg-action="heavy-strike" ' + (heavyReady && r.stamina >= 5 ? "" : "disabled") + '>✦ HEAVY STRIKE <small>5 STAMINA</small></button><button data-rpg-action="guard">⬟ GUARD</button><button data-rpg-action="use-potion" ' + (r.inventory.potions > 0 && r.hp < r.maxHp ? "" : "disabled") + '>✚ HEALING DRAUGHT <small>' + r.inventory.potions + ' READY</small></button></div>' +
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

  function renderInventory(r) {
    var mats = Object.keys(materialNames).filter(function (id) { return materialCount(r, id) > 0; });
    var gear = r.inventory.gear.map(function (id) { return itemById(id); }).filter(Boolean);
    var materialMarkup = mats.length ? mats.map(function (id) { return '<div class="rpg-material-chip"><b>' + materialCount(r, id) + '</b><span>' + esc(materialNames[id]) + '</span></div>'; }).join("") : '<p class="rpg-empty-copy">No monster materials yet. The first hunt is waiting.</p>';
    var gearMarkup = gear.length ? gear.map(function (item) {
      var equipped = r.equipment[item.slot] === item.id;
      return '<article class="rpg-gear-row"><div><small>' + esc(item.rarity) + ' · ' + esc(item.slot) + '</small><b>' + esc(item.name) + '</b><span>' + (item.attack ? "+" + item.attack + " ATK" : "+" + item.defense + " DEF") + '</span></div><button data-rpg-action="equip:' + item.id + '" ' + (equipped ? "disabled" : "") + '>' + (equipped ? "EQUIPPED" : "EQUIP") + '</button></article>';
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
      (r.battle ? renderBattle(r) : '<section class="rpg-subpanel rpg-hunt-board"><div class="rpg-section-head"><div><div class="rpg-eyebrow">AVAILABLE TARGETS</div><h2>Monster Board</h2></div><span class="rpg-count">' + monsters.filter(function (m) { return depth >= m.depth; }).length + ' / ' + monsters.length + ' UNLOCKED</span></div><p class="rpg-section-hint">Only creatures discovered through Descent can be hunted here. Each target has its own stamina cost and crafting materials.</p><div class="rpg-monster-list">' + renderMonsters(state, r) + '</div></section>') +
      '<div class="rpg-two-column"><section class="rpg-subpanel"><div class="rpg-section-head"><div><div class="rpg-eyebrow">ALCHEMY BENCH</div><h3>Field Healing Draught</h3></div><span class="rpg-count">' + r.inventory.potions + ' READY</span></div><p class="rpg-section-hint">Crafted from 2 Bitter Herbs and 1 Venom Gland. Restores up to 45 HP during combat.</p><div class="rpg-recipe-row"><span>' + materialCount(r, "bitter_herb") + ' / 2 Bitter Herbs</span><span>' + materialCount(r, "venom_gland") + ' / 1 Venom Gland</span></div><button class="rpg-action-primary rpg-craft-button" data-rpg-action="craft-healing" ' + (potionReady ? "" : "disabled") + '>✚ CRAFT HEALING DRAUGHT</button></section>' +
      '<section class="rpg-subpanel"><div class="rpg-section-head"><div><div class="rpg-eyebrow">REWARD CACHE</div><h3>Sealed Loot</h3></div><span class="rpg-count">' + r.inventory.lootBoxes + ' CACHES</span></div><p class="rpg-section-hint">Monster loot caches contain weapons and armor appropriate to your deepest unlocked floor.</p><button class="rpg-action-primary rpg-craft-button" data-rpg-action="open-cache" ' + (r.inventory.lootBoxes > 0 ? "" : "disabled") + '>◇ OPEN LOOT CACHE</button></section></div>' +
      renderInventory(r) + '<p class="rpg-footnote">Combat uses stamina, never Step Power. Basic attacks run automatically while this page is open; you control special attacks, guarding, and healing.</p></div>';
  }

  window.DUO_RPG_COMBAT = {
    ensure: ensure,
    render: render,
    handleAction: handleAction,
    sync: sync
  };
})();