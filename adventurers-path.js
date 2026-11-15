(function(root){"use strict";
function clamp(v,min,max){return Math.max(min,Math.min(max,Number(v)||0))}
function render(state,day,goalXp,currentLevel,guildApi){
 var descent=state.descent||{},gear=state.gear||{},gearCount=["weapon","armor","companion"].filter(function(slot){return !!gear[slot]}).length;
 var xp=clamp(state.xp,0,Math.max(1,goalXp)),xpPct=clamp(xp/Math.max(1,goalXp)*100,0,100),guildState=null,dailyProgress=0,dailyTargetTotal=0,dailyClaimed=0;
 var kills=Math.max(0,Number(state.guildStats&&state.guildStats.kills)||0),crafts=Math.max(0,Number(state.guildStats&&state.guildStats.crafts)||0);
 if(guildApi&&typeof guildApi.ensure==="function"&&typeof guildApi.progress==="function"){
  guildState=guildApi.ensure(state,day);var contracts=guildState&&guildState.daily&&guildState.daily.contracts||[];
  dailyClaimed=(guildState&&guildState.daily&&guildState.daily.claimed||[]).length;
  contracts.forEach(function(c){var target=Math.max(1,Number(c.target)||1);dailyProgress+=clamp(guildApi.progress(state,"daily",c),0,target);dailyTargetTotal+=target});
 }
 var guildPct=dailyTargetTotal?clamp(dailyProgress/dailyTargetTotal*100,0,100):0;
 var objectives=[
  {icon:"⚑",name:"GUILD COMMISSIONS",desc:"Complete today's contracts through hunts, crafting, and achievements.",value:dailyClaimed+" / 3 CLAIMED · "+Math.round(guildPct)+"% IN PROGRESS",pct:Math.max(dailyClaimed/3*100,guildPct),done:dailyClaimed>=3,cta:"VISIT THE GUILD",route:"guild"},
  {icon:"⚔",name:"HUNT THE DEPTHS",desc:"Defeat monsters to earn their loot, coins, and experience.",value:kills.toLocaleString()+" MONSTERS DEFEATED",pct:clamp(kills/10*100,0,100),done:kills>=10,cta:"ENTER THE HUNT",route:"combat"},
  {icon:"⚒",name:"MASTER THE WORKBENCH",desc:"Craft useful gear and brews at the Sanctum.",value:crafts.toLocaleString()+" ITEMS CRAFTED",pct:clamp(crafts/5*100,0,100),done:crafts>=5,cta:"VISIT THE SANCTUM",route:"facilities"},
  {icon:"◆",name:"READY YOUR LOADOUT",desc:"Fill your weapon, armor, and companion slots.",value:gearCount+" / 3 SLOTS EQUIPPED",pct:gearCount/3*100,done:gearCount===3,cta:"OPEN THE ARMORY",facility:"armory"}
 ];
 var completed=objectives.filter(function(x){return x.done}).length;
 return '<section class="adventurer-path" aria-label="The Adventurer’s Path"><div class="path-heading"><div><span class="eyebrow">YOUR NEXT OBJECTIVES · LIVE PROGRESSION</span><h2>THE ADVENTURER’S PATH</h2><p>The System has prepared a plan. Try not to make it regret that.</p></div><div class="path-score"><b>'+completed+' / '+objectives.length+'</b><small>OBJECTIVES</small></div></div><div class="path-level-track"><div><span>LEVEL '+Number(currentLevel||1)+' PROGRESS</span><b>'+Math.round(xpPct)+'%</b></div><div class="bar"><span style="width:'+xpPct+'%"></span></div></div><div class="path-objective-grid">'+objectives.map(function(x){return '<article class="path-objective '+(x.done?'is-complete':'')+'"><div class="path-objective-top"><span class="path-objective-icon">'+x.icon+'</span><span class="path-objective-status">'+(x.done?'✓ COMPLETE':'IN PROGRESS')+'</span></div><h3>'+x.name+'</h3><p>'+x.desc+'</p><div class="path-objective-progress"><div class="bar"><span style="width:'+x.pct+'%"></span></div><small>'+x.value+'</small></div><button class="path-objective-link" '+(x.facility?'data-fac="'+x.facility+'"':'data-page="'+x.route+'"')+'>'+x.cta+' ↗</button></article>'}).join('')+'</div><div class="path-footer"><span>OBJECTIVES UPDATE AUTOMATICALLY AS YOU PLAY.</span><span>NO EXTRA GRIND. PROBABLY.</span></div></section>';
}
var api={render:render};if(root)root.DUO_ADVENTURERS_PATH=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:null);
