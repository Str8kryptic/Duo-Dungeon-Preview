(function () {
  "use strict";

  var MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;
  var currentState = null;
  var skills = {
    foraging: { name: "Foraging", icon: "✦", description: "Gather herbs, venomous reagents and rare growths from the dungeon's living edges." },
    quarrying: { name: "Quarrying", icon: "⛏", description: "Recover bone, chitin, stone and mineral deposits from forgotten chambers." },
    salvage: { name: "Salvaging", icon: "⚒", description: "Strip useful components from ruined armor, infernal remains and abandoned machinery." },
    crafting: { name: "Crafting", icon: "⌑", description: "Turn gathered materials into field supplies, elixirs and permanent equipment." }
  };
  var nodes = [
    { id: "bitter-herb", skill: "foraging", name: "Bitter Herb Patch", material: "bitter_herb", yield: 1, seconds: 25, xp: 8, level: 1, depth: 1, note: "A hardy medicinal herb growing between damp stones." },
    { id: "venom-reeds", skill: "foraging", name: "Venom Reeds", material: "venom_gland", yield: 1, seconds: 45, xp: 13, level: 3, depth: 1, note: "Careful harvesting keeps the useful venom intact." },
    { id: "cursed-growth", skill: "foraging", name: "Cursed Growth", material: "cursed_essence", yield: 1, seconds: 90, xp: 22, level: 8, depth: 3, note: "The roots whisper. The ingredients are worth it." },
    { id: "rift-bloom", skill: "foraging", name: "Rift Bloom", material: "rift_sheet", yield: 1, seconds: 120, xp: 30, level: 12, depth: 9, note: "A translucent growth found where reality has split." },
    { id: "cave-chitin", skill: "quarrying", name: "Cave Chitin Seam", material: "cave_chitin", yield: 1, seconds: 35, xp: 9, level: 1, depth: 1, note: "Harvest hardened plates from the cavern walls." },
    { id: "ancient-bone", skill: "quarrying", name: "Ancient Bone Deposit", material: "ancient_bone", yield: 1, seconds: 60, xp: 15, level: 4, depth: 3, note: "Old remains, still useful to a patient Delver." },
    { id: "rusted-fragment", skill: "quarrying", name: "Buried Ironwork", material: "rusted_fragment", yield: 1, seconds: 50, xp: 12, level: 3, depth: 3, note: "Fragments of equipment lost to the deep." },
    { id: "fire-core", skill: "quarrying", name: "Emberstone Vein", material: "fire_core", yield: 1, seconds: 100, xp: 25, level: 8, depth: 6, note: "A volatile mineral deposit beneath the ash layers." },
    { id: "venom-salvage", skill: "salvage", name: "Spent Venom Sacs", material: "venom_gland", yield: 1, seconds: 40, xp: 10, level: 1, depth: 1, note: "Recover intact reagents from abandoned field remains." },
    { id: "crypt-scrap", skill: "salvage", name: "Crypt Armature", material: "rusted_fragment", yield: 1, seconds: 55, xp: 13, level: 4, depth: 3, note: "Strip workable metal from broken crypt defenses." },
    { id: "infernal-hide", skill: "salvage", name: "Infernal Remains", material: "infernal_hide", yield: 1, seconds: 100, xp: 26, level: 8, depth: 6, note: "Recover heat-resistant hide from the fallen." },
    { id: "demon-horn", skill: "salvage", name: "Demon Horn Cache", material: "demon_horn", yield: 1, seconds: 120, xp: 32, level: 12, depth: 6, note: "A rare component prized by master artisans." }
  ];
  var recipes = [
    { id: "healing", name: "Field Healing Draught", station: "Veiled Apothecary", action: "craft-healing", depth: 1, costs: { bitter_herb: 2, venom_gland: 1 }, xp: 18, output: "Restores up to 45 HP during an encounter." },
    { id: "power", name: "Brutal Tonic", station: "Veiled Apothecary", action: "brew:power", depth: 3, costs: { bitter_herb: 2, cursed_essence: 1 }, xp: 28, output: "Adds 5 attack for 30 seconds." },
    { id: "ward", name: "Warden's Elixir", station: "Veiled Apothecary", action: "brew:ward", depth: 3, costs: { ancient_bone: 1, cursed_essence: 1 }, xp: 28, output: "Adds 5 defense for 30 seconds." },
    { id: "stamina", name: "Ember Stimulant", station: "Veiled Apothecary", action: "brew:stamina", depth: 6, costs: { bitter_herb: 2, fire_core: 1 }, xp: 42, output: "Restores up to 25 stamina instantly." },
    { id: "stalker-fang", name: "Stalker Fang", station: "Ember Forge", action: "forge:stalker_fang", depth: 1, costs: { cave_chitin: 4, venom_gland: 2 }, xp: 35, output: "A fast, vicious starter weapon." },
    { id: "chitin-vest", name: "Chitin Vest", station: "Ember Forge", action: "forge:chitin_vest", depth: 1, costs: { cave_chitin: 6, venom_gland: 1 }, xp: 35, output: "Your first real layer between you and the teeth." },
    { id: "cryptbone-blade", name: "Cryptbone Blade", station: "Ember Forge", action: "forge:cryptbone_blade", depth: 3, costs: { ancient_bone: 6, cursed_essence: 2, rusted_fragment: 3 }, xp: 65, output: "A blade forged from the crypt's leftovers." },
    { id: "guardian-plate", name: "Guardian Plate", station: "Ember Forge", action: "forge:guardian_plate", depth: 3, costs: { ancient_bone: 5, cursed_essence: 2, rusted_fragment: 4 }, xp: 65, output: "Heavy protection for increasingly rude monsters." },
    { id: "infernal-edge", name: "Infernal Edge", station: "Ember Forge", action: "forge:infernal_edge", depth: 6, costs: { infernal_hide: 6, fire_core: 2, demon_horn: 1 }, xp: 100, output: "An endgame edge with a temper." },
    { id: "infernal-mail", name: "Infernal Mail", station: "Ember Forge", action: "forge:infernal_mail", depth: 6, costs: { infernal_hide: 8, fire_core: 2, demon_horn: 2 }, xp: 100, output: "Armor made from things that should not be wearable." }
  ];
  var materialNames = {
    bitter_herb: "Bitter Herbs", venom_gland: "Venom Glands", cursed_essence: "Cursed Essence",
    rift_sheet: "Rift Sheets", cave_chitin: "Cave Chitin", ancient_bone: "Ancient Bones",
    rusted_fragment: "Rusted Fragments", fire_core: "Fire Cores", infernal_hide: "Infernal Hide",
    demon_horn: "Demon Horns"
  };

  function ensure(state) {
    if (!state || typeof state !== "object") return null;
    currentState = state;
    var a = state.activityEngine;
    if (!a || typeof a !== "object") a = state.activityEngine = {};
    a.version = 1;
    a.skills = a.skills && typeof a.skills === "object" ? a.skills : {};
    Object.keys(skills).forEach(function (id) {
      var skill = a.skills[id] && typeof a.skills[id] === "object" ? a.skills[id] : {};
      skill.xp = Math.max(0, Number(skill.xp) || 0);
      skill.level = levelForXp(skill.xp);
      a.skills[id] = skill;
    });
    a.active = a.active && typeof a.active === "object" ? a.active : null;
    a.crafted = a.crafted && typeof a.crafted === "object" ? a.crafted : {};
    return a;
  }

  function xpForNext(level) { return Math.floor(60 * Math.pow(Math.max(1, level), 1.55)); }
  function levelForXp(xp) {
    var level = 1, remaining = Math.max(0, Number(xp) || 0);
    while (level < 99 && remaining >= xpForNext(level)) { remaining -= xpForNext(level); level += 1; }
    return level;
  }
  function xpIntoLevel(xp) {
    var level = 1, remaining = Math.max(0, Number(xp) || 0);
    while (level < 99 && remaining >= xpForNext(level)) { remaining -= xpForNext(level); level += 1; }
    return { level: level, current: remaining, next: xpForNext(level) };
  }
  function rpg(state) {
    if (window.DUO_RPG_COMBAT) return window.DUO_RPG_COMBAT.ensure(state);
    return null;
  }
  function materialCount(state, id) {
    var combat = rpg(state);
    return combat ? Math.max(0, Number(combat.inventory.materials[id]) || 0) : 0;
  }
  function depthOf(state) {
    var combat = rpg(state);
    return Math.max(1, Number(combat && combat.depth) || Number(state.descent && state.descent.depth) || 1);
  }
  function grantXp(a, skillId, amount) {
    var skill = a.skills[skillId];
    var before = skill.level;
    skill.xp += Math.max(0, Number(amount) || 0);
    skill.level = levelForXp(skill.xp);
    return skill.level > before;
  }
  function settle(state, now) {
    var a = ensure(state), active = a && a.active;
    if (!active) return false;
    var node = nodes.find(function (x) { return x.id === active.nodeId; });
    if (!node) { a.active = null; return true; }
    var r = rpg(state);
    if (!r) return false;
    var stamp = Math.max(0, Number(now) || Date.now());
    var last = Math.max(0, Number(active.lastSettledAt) || Number(active.startedAt) || stamp);
    var capEnd = Math.min(stamp, last + MAX_OFFLINE_MS);
    var duration = node.seconds * 1000;
    var cycles = Math.floor(Math.max(0, capEnd - last) / duration);
    if (cycles < 1) return false;
    var skillLevel = a.skills[node.skill].level;
    var yieldEach = node.yield + Math.floor(Math.max(0, skillLevel - 1) / 5);
    var amount = cycles * yieldEach;
    r.inventory.materials[node.material] = Math.max(0, Number(r.inventory.materials[node.material]) || 0) + amount;
    grantXp(a, node.skill, cycles * node.xp);
    active.lastSettledAt = stamp - last > MAX_OFFLINE_MS ? stamp - ((stamp - last) % duration) : last + cycles * duration;
    active.totalActions = Math.max(0, Number(active.totalActions) || 0) + cycles;
    return true;
  }
  function fmtTime(seconds) {
    var n = Math.max(0, Math.ceil(seconds));
    if (n >= 3600) return Math.floor(n / 3600) + "h " + Math.floor((n % 3600) / 60) + "m";
    if (n >= 60) return Math.floor(n / 60) + "m " + (n % 60) + "s";
    return n + "s";
  }
  function progress(active, node, now) {
    var last = Number(active && active.lastSettledAt) || Number(active && active.startedAt) || now;
    var duration = node.seconds * 1000;
    var elapsed = Math.max(0, now - last);
    var pct = Math.min(100, elapsed % duration / duration * 100);
    return { pct: pct, remaining: Math.max(0, (duration - (elapsed % duration)) / 1000) };
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function costMarkup(state, costs) {
    return Object.keys(costs).map(function (id) {
      var have = materialCount(state, id), need = costs[id];
      return '<span class="' + (have >= need ? "is-funded" : "is-short") + '">' + have + ' / ' + need + ' ' + esc(materialNames[id] || id) + '</span>';
    }).join("");
  }
  function skillCard(a, id) {
    var def = skills[id], value = xpIntoLevel(a.skills[id].xp), pct = Math.min(100, value.current / value.next * 100);
    return '<article class="activity-skill-card" data-activity-skill-card="' + id + '"><div class="activity-skill-icon">' + def.icon + '</div><div class="activity-skill-main"><div class="activity-skill-title"><b>' + def.name + '</b><strong data-activity-level>LVL ' + value.level + '</strong></div><div class="activity-xp-track"><i data-activity-xp-bar style="width:' + pct + '%"></i></div><small data-activity-xp-text>' + value.current.toLocaleString() + ' / ' + value.next.toLocaleString() + ' XP to next level</small></div></article>';
  }
  function render(state) {
    var a = ensure(state), now = Date.now(), r = rpg(state);
    if (!a || !r) return '<section class="activity-page"><h1>ACTIVITY LEDGER UNAVAILABLE</h1><p>Refresh the Sanctum and try again.</p></section>';
    var changed = settle(state, now);
    var activeNode = a.active && nodes.find(function (x) { return x.id === a.active.nodeId; });
    var activeProgress = activeNode ? progress(a.active, activeNode, now) : null;
    var skillMarkup = Object.keys(skills).map(function (id) { return skillCard(a, id); }).join("");
    var offlineMode = !navigator.onLine || !!(window.DUO_AUTH && window.DUO_AUTH.mode === "account-offline");
    var offlineNotice = offlineMode ? '<div class="activity-offline-notice"><b>◌ OFFLINE ACTIVITY MODE</b><span>Your gathering and crafting are saved on this device. Progress syncs when your connection returns. Offline settlement is capped at 8 hours per absence.</span></div>' : '';
    var nodeMarkup = Object.keys(skills).filter(function (id) { return id !== "crafting"; }).map(function (skillId) {
      var group = nodes.filter(function (node) { return node.skill === skillId; }).map(function (node) {
        var skillLevel = a.skills[skillId].level, locked = skillLevel < node.level || depthOf(state) < node.depth;
        var active = a.active && a.active.nodeId === node.id;
        var why = skillLevel < node.level ? "Requires " + skills[skillId].name + " level " + node.level : "Requires floor " + node.depth;
        return '<article class="activity-node' + (locked ? ' is-locked' : '') + (active ? ' is-active' : '') + '"><div class="activity-node-top"><div><small>' + (locked ? 'LOCKED NODE' : 'GATHERING NODE') + ' · ' + node.seconds + ' SEC / CYCLE</small><h3>' + esc(node.name) + '</h3></div><span class="activity-node-level">LVL ' + node.level + '</span></div><p>' + esc(node.note) + '</p><div class="activity-node-reward" data-activity-yield="' + node.id + '">+' + (node.yield + Math.floor(Math.max(0, skillLevel - 1) / 5)) + ' ' + esc(materialNames[node.material]) + ' · +' + node.xp + ' XP / cycle</div>' + (locked ? '<div class="activity-lock-note">' + why + '</div>' : '<button class="activity-action' + (active ? ' is-selected' : '') + '" data-activity-start="' + node.id + '"' + (active ? ' disabled' : '') + '>' + (active ? 'CURRENTLY GATHERING' : 'START GATHERING') + '</button>') + '</article>';
      }).join("");
      return '<section class="activity-skill-section"><div class="activity-section-heading"><div><small>GATHERING DISCIPLINE</small><h2>' + skills[skillId].icon + ' ' + skills[skillId].name + '</h2><p>' + skills[skillId].description + '</p></div></div><div class="activity-node-grid">' + group + '</div></section>';
    }).join("");
    var recipeMarkup = recipes.map(function (recipe) {
      var owned = false;
      if (recipe.action.indexOf("forge:") === 0) {
        var id = recipe.action.slice(6), combat = r;
        owned = combat.inventory.gear.indexOf(id) >= 0 || combat.equipment.weapon === id || combat.equipment.armor === id;
      }
      var locked = depthOf(state) < recipe.depth, canPay = Object.keys(recipe.costs).every(function (id) { return materialCount(state, id) >= recipe.costs[id]; }), staminaFull = recipe.action === "brew:stamina" && r.stamina >= r.maxStamina;
      return '<article class="activity-recipe-card"><div class="activity-recipe-head"><div><small>' + esc(recipe.station) + ' · ' + (locked ? 'FLOOR ' + recipe.depth : 'UNLOCKED') + '</small><h3>' + esc(recipe.name) + '</h3></div><span>+' + recipe.xp + ' CRAFT XP</span></div><p>' + esc(recipe.output) + '</p><div class="activity-costs">' + costMarkup(state, recipe.costs) + '</div><button class="activity-action" data-activity-craft="' + recipe.id + '" ' + (locked || !canPay || owned || staminaFull ? 'disabled' : '') + '>' + (owned ? 'ALREADY OWNED' : locked ? 'DESCEND TO UNLOCK' : !canPay ? 'MISSING MATERIALS' : staminaFull ? 'STAMINA FULL' : 'CRAFT RECIPE') + '</button></article>';
    }).join("");
    var activeMarkup = activeNode ? '<section class="activity-active-panel"><div class="activity-active-top"><div><small>RUNNING IN THE SANCTUM</small><h2>' + esc(activeNode.name) + '</h2><p>' + esc(skills[activeNode.skill].name) + ' · ' + esc(materialNames[activeNode.material]) + '</p></div><span class="activity-live-dot">ACTIVE</span></div><div class="activity-live-track"><i id="activity-live-bar" style="width:' + activeProgress.pct + '%"></i></div><div class="activity-live-meta"><b id="activity-live-time">' + fmtTime(activeProgress.remaining) + ' until next yield</b><span>Offline progress capped at 8 hours</span></div><button class="activity-stop" data-activity-collect>COLLECT & STOP</button></section>' : '<section class="activity-active-panel is-idle"><small>NO ACTIVE GATHERING</small><h2>Your next expedition starts here.</h2><p>Choose a node below. Gathering continues while you are away, with an eight-hour offline cap.</p></section>';
    var bag = Object.keys(materialNames).map(function (id) { return { id: id, count: materialCount(state, id) }; }).filter(function (x) { return x.count > 0; });
    var bagMarkup = bag.length ? bag.map(function (x) { return '<div class="activity-material" data-activity-material="' + x.id + '"><b data-activity-material-count>' + x.count.toLocaleString() + '</b><span>' + esc(materialNames[x.id]) + '</span></div>'; }).join("") : '<p class="activity-empty">No materials yet. The dungeon is full of things to collect.</p>';
    if (changed) window.dispatchEvent(new CustomEvent("duo:activity-settled"));
    return '<div class="activity-page"><header class="activity-hero"><div class="activity-eyebrow">THE SANCTUM · PRODUCTION & PROFICIENCY</div><h1>ACTIVITIES</h1><p>Gather what the dungeon hides. Master the craft. Return to the Hunt better prepared.</p><div class="activity-hero-stats"><span><b>' + Object.keys(skills).length + '</b> DISCIPLINES</span><span><b>' + nodes.length + '</b> GATHERING NODES</span><span><b>' + recipes.length + '</b> RECIPES</span></div></header>' + offlineNotice + activeMarkup + '<section class="activity-skill-overview"><div class="activity-section-heading"><div><small>YOUR DISCIPLINES</small><h2>Skill Ledger</h2></div></div><div class="activity-skill-grid">' + skillMarkup + '</div></section>' + nodeMarkup + '<section class="activity-skill-section"><div class="activity-section-heading"><div><small>THE WORKSHOP</small><h2>⌑ Crafting</h2><p>Crafting uses the same materials as your existing Vault, Forge and Apothecary. Successful recipes award Crafting XP.</p></div></div><div class="activity-recipe-grid">' + recipeMarkup + '</div></section><section class="activity-skill-section"><div class="activity-section-heading"><div><small>SHARED INVENTORY</small><h2>Material Locker</h2><p>Gathered resources are added directly to your existing combat material inventory.</p></div></div><div class="activity-material-grid">' + bagMarkup + '</div></section><footer class="activity-footer">Step history is preserved separately. Activities use their own gathering cycles, skill XP and shared crafting materials.</footer></div>';
  }
  function renderHotbar(state) {
    var a = ensure(state), active = a && a.active;
    if (!active) return "";
    var node = nodes.find(function (x) { return x.id === active.nodeId; });
    if (!node) return "";
    var p = progress(active, node, Date.now());
    return '<aside class="duo-gather-hotbar" role="region" aria-label="Active gathering activity"><div class="duo-gather-top"><span class="duo-gather-live"><i></i> ACTIVITY RUNNING</span><strong>' + esc(node.name) + '</strong><span class="duo-gather-yield">+' + (node.yield + Math.floor(Math.max(0, a.skills[node.skill].level - 1) / 5)) + ' / CYCLE</span></div><div class="duo-gather-track"><i style="width:' + p.pct + '%"></i></div><div class="duo-gather-meta"><b>' + fmtTime(p.remaining) + ' TO NEXT YIELD</b><span>' + (Number(active.totalActions) || 0) + ' CYCLES COLLECTED</span></div><button class="duo-gather-stop" data-activity-collect>■ COLLECT & STOP</button></aside>';
  }
  function awardCraftingXP(state, action) {
    var recipe = recipes.find(function (x) { return x.action === action; });
    if (!recipe) return false;
    var a = ensure(state);
    if (!a) return false;
    grantXp(a, "crafting", recipe.xp);
    return { xp: recipe.xp, level: a.skills.crafting.level };
  }
  function handleClick(event, state, hooks) {
    var start = event.target.closest && event.target.closest("[data-activity-start]");
    var collect = event.target.closest && event.target.closest("[data-activity-collect]");
    var craft = event.target.closest && event.target.closest("[data-activity-craft]");
    if (!start && !collect && !craft) return false;
    var a = ensure(state), now = Date.now(), r = rpg(state);
    if (!a || !r) { if (hooks && hooks.toast) hooks.toast("Activity services are unavailable. Refresh and try again."); return true; }
    if (start) {
      var node = nodes.find(function (x) { return x.id === start.dataset.activityStart; });
      if (!node) { if (hooks.toast) hooks.toast("That gathering node could not be found."); return true; }
      if (a.skills[node.skill].level < node.level || depthOf(state) < node.depth) { if (hooks.toast) hooks.toast("That gathering node is still locked."); return true; }
      if (a.active) {
        if (hooks.toast) hooks.toast(a.active.nodeId === node.id ? "That activity is already running." : "Collect and stop your current activity before switching gathering nodes.");
        return true;
      }
      a.active = { nodeId: node.id, startedAt: now, lastSettledAt: now, totalActions: 0 };
      if (hooks.toast) hooks.toast("Gathering started: " + node.name + ". Your Delver can return later to collect the yield.");
    } else if (collect) {
      settle(state, now);
      var nodeActive = a.active && nodes.find(function (x) { return x.id === a.active.nodeId; });
      var count = nodeActive ? Number(a.active.totalActions) || 0 : 0;
      if (nodeActive) {
        a.active = null;
        if (hooks.toast) hooks.toast(count ? "Gathering collected. " + count + " cycles settled into your Vault." : "Gathering stopped. No complete cycles yet; no materials were produced.");
      }
    } else if (craft) {
      var recipe = recipes.find(function (x) { return x.id === craft.dataset.activityCraft; });
      if (!recipe) { if (hooks.toast) hooks.toast("That recipe is unavailable."); return true; }
      if (depthOf(state) < recipe.depth) { if (hooks.toast) hooks.toast("Descend further to unlock this recipe."); return true; }
      window.DUO_RPG_COMBAT.handleAction(state, recipe.action, { toast: hooks.toast, save: function () {}, render: function () {} });
    }
    if (hooks && hooks.save) hooks.save();
    if (hooks && hooks.render) hooks.render();
    return true;
  }
  function tick(state) {
    state = state || currentState;
    if (!state || !state.activityEngine || !state.activityEngine.active) return;
    var changed = settle(state, Date.now());
    if (changed) window.dispatchEvent(new CustomEvent("duo:activity-settled"));
    if (document.body.getAttribute("data-game-section") !== "activities") return;
    if (changed) {
      Object.keys(skills).forEach(function (id) {
        var card = document.querySelector('[data-activity-skill-card="' + id + '"]');
        if (!card) return;
        var value = xpIntoLevel(state.activityEngine.skills[id].xp);
        var level = card.querySelector("[data-activity-level]"), xpBar = card.querySelector("[data-activity-xp-bar]"), xpText = card.querySelector("[data-activity-xp-text]");
        if (level) level.textContent = "LVL " + value.level;
        if (xpBar) xpBar.style.width = Math.min(100, value.current / value.next * 100) + "%";
        if (xpText) xpText.textContent = value.current.toLocaleString() + " / " + value.next.toLocaleString() + " XP to next level";
      });
      var grid = document.querySelector(".activity-material-grid");
      if (grid) Object.keys(materialNames).forEach(function (id) {
        var count = materialCount(state, id), item = grid.querySelector('[data-activity-material="' + id + '"]');
        if (count > 0 && !item) {
          var empty = grid.querySelector(".activity-empty");
          if (empty) empty.remove();
          item = document.createElement("div"); item.className = "activity-material"; item.dataset.activityMaterial = id;
          var amount = document.createElement("b"); amount.dataset.activityMaterialCount = ""; item.appendChild(amount);
          var name = document.createElement("span"); name.textContent = materialNames[id]; item.appendChild(name); grid.appendChild(item);
        }
        if (item) { var value = item.querySelector("[data-activity-material-count]"); if (value) value.textContent = count.toLocaleString(); }
      });
      nodes.forEach(function (entry) {
        var label = document.querySelector('[data-activity-yield="' + entry.id + '"]');
        if (label) label.textContent = "+" + (entry.yield + Math.floor(Math.max(0, state.activityEngine.skills[entry.skill].level - 1) / 5)) + " " + materialNames[entry.material] + " · +" + entry.xp + " XP / cycle";
      });
    }
    var active = state.activityEngine.active, node = active && nodes.find(function (x) { return x.id === active.nodeId; });
    if (!node) return;
    var p = progress(active, node, Date.now()), bar = document.getElementById("activity-live-bar"), label = document.getElementById("activity-live-time");
    if (bar) bar.style.width = p.pct + "%";
    if (label) label.textContent = fmtTime(p.remaining) + " until next yield";
  }
  window.DUO_ACTIVITY_ENGINE = { ensure: ensure, settle: settle, render: render, renderHotbar: renderHotbar, handleClick: handleClick, awardCraftingXP: awardCraftingXP, tick: tick };
  window.addEventListener("duo:activity-settled", function () {
    if (window.DUO_ACTIVITY_SAVE && typeof window.DUO_ACTIVITY_SAVE === "function") window.DUO_ACTIVITY_SAVE();
  });
  window.setInterval(tick, 1000);
})();