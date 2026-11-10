import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
const context={window:{},module:{exports:{}},Date,Math};
runInNewContext(readFileSync(new URL("../guild.js",import.meta.url),"utf8"),context);
const Guild=context.window.DUO_GUILD;
assert.ok(Guild,"Guild module should expose its API");
const player={number:123456,coins:250,xp:0,stepDate:"2026-11-10",stepsToday:0,stepLifetime:10000,guildStats:{kills:4,crafts:1}};
Guild.ensure(player,"2026-11-10");
assert.equal(player.guild.daily.contracts.length,3);
assert.equal(player.guild.weekly.contracts.length,3);
const first=player.guild.daily.contracts[0];
const same={number:123456,coins:250,xp:0,stepDate:"2026-11-10",stepsToday:0,stepLifetime:10000,guildStats:{kills:4,crafts:1}};
Guild.ensure(same,"2026-11-10");
assert.deepEqual(JSON.parse(JSON.stringify(player.guild.daily.contracts)),JSON.parse(JSON.stringify(same.guild.daily.contracts)),"Daily board should be stable for a crawler and date");
if(first.type==="steps"){player.stepsToday=first.target;assert.equal(Guild.progress(player,"daily",first),first.target)}
else if(first.type==="kills"){player.guildStats.kills+=first.target;assert.equal(Guild.progress(player,"daily",first),first.target)}
else{player.guildStats.crafts+=first.target;assert.equal(Guild.progress(player,"daily",first),first.target)}
const reward=Guild.claim(player,"daily",first.id,"2026-11-10");
assert.equal(reward.ok,true,"Completed contract should be claimable");
assert.equal(player.coins,250+first.coins);
assert.equal(player.xp,first.xp);
assert.equal(Guild.claim(player,"daily",first.id,"2026-11-10").ok,false,"Contract reward must not be claimable twice");
const previous=player.guild.daily;
Guild.ensure(player,"2026-11-11");
assert.notEqual(player.guild.daily.period,previous.period,"Daily board should rotate at local midnight");
assert.equal(player.guild.daily.claimed.length,0);
const weekly=player.guild.weekly,weeklyContract=weekly.contracts.find(c=>c.type==="steps");
player.stepLifetime=weekly.startSteps+weeklyContract.target;
assert.equal(Guild.progress(player,"weekly",weeklyContract),weeklyContract.target,"Weekly verified-step progress should use lifetime delta");
const weekBefore=player.guild.weekly.period;
Guild.ensure(player,"2026-11-16");
assert.notEqual(player.guild.weekly.period,weekBefore,"Weekly commissions should rotate on Monday");
assert.equal(player.guild.weekly.claimed.length,0);
const html=Guild.render(player,"2026-11-16");
assert.match(html,/THE GUILD HALL/);
assert.match(html,/DAILY CONTRACTS/);
assert.match(html,/WEEKLY COMMISSIONS/);
console.log("Adventurer's Guild tests passed.");
