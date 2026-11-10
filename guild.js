(function(root){
"use strict";
function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function dayKey(date){return date||new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0")+"-"+String(new Date().getDate()).padStart(2,"0")}
function weekKey(day){var d=new Date(day+"T12:00:00");var offset=(d.getDay()+6)%7;d.setDate(d.getDate()-offset);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function hash(text){var h=2166136261;for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
var dailyPools=[
 [{type:"steps",target:2500,title:"A WALK IN THE WILDS",description:"Record 2,500 verified steps today.",coins:100,xp:65},{type:"steps",target:4000,title:"THE LONG WAY ROUND",description:"Record 4,000 verified steps today.",coins:150,xp:100},{type:"steps",target:6000,title:"NO SHORTCUTS",description:"Record 6,000 verified steps today.",coins:225,xp:150}],
 [{type:"kills",target:1,title:"CLEAR THE RUBBLE",description:"Defeat 1 monster in the Hunt.",coins:100,xp:75},{type:"kills",target:2,title:"PROBLEM SOLVER",description:"Defeat 2 monsters in the Hunt.",coins:160,xp:120},{type:"kills",target:3,title:"MONSTER MANAGEMENT",description:"Defeat 3 monsters in the Hunt.",coins:220,xp:165}],
 [{type:"crafts",target:1,title:"A LITTLE ALCHEMY",description:"Craft 1 item at the Sanctum.",coins:125,xp:90},{type:"crafts",target:2,title:"WORKSHOP REGULAR",description:"Craft 2 items at the Sanctum.",coins:200,xp:145},{type:"crafts",target:3,title:"MASTER CRAFTER",description:"Craft 3 items at the Sanctum.",coins:250,xp:185}]
];
var weeklyPools=[
 [{type:"steps",target:18000,title:"MILES BEFORE MIMICS",description:"Record 18,000 verified steps this week.",coins:650,xp:450},{type:"steps",target:25000,title:"THE WEEKLY MARCH",description:"Record 25,000 verified steps this week.",coins:900,xp:650},{type:"steps",target:35000,title:"THE LONG DESCENT",description:"Record 35,000 verified steps this week.",coins:1250,xp:900}],
 [{type:"kills",target:10,title:"THE CLEANUP CREW",description:"Defeat 10 monsters this week.",coins:700,xp:500},{type:"kills",target:15,title:"LOCAL MENACE",description:"Defeat 15 monsters this week.",coins:950,xp:700},{type:"kills",target:20,title:"MONSTER UNION NOTICE",description:"Defeat 20 monsters this week.",coins:1300,xp:950}],
 [{type:"crafts",target:3,title:"GUILD QUARTERMASTER",description:"Craft 3 items this week.",coins:750,xp:550},{type:"crafts",target:5,title:"MASTER OF THE WORKBENCH",description:"Craft 5 items this week.",coins:1050,xp:800},{type:"crafts",target:7,title:"SUPPLY CHAIN LEGEND",description:"Craft 7 items this week.",coins:1400,xp:1050}]
];
function choose(pool,seed){var out=[];for(var i=0;i<pool.length;i++){var options=pool[i],pick=hash(seed+":"+i)%options.length;out.push(Object.assign({id:(i+1)+"-"+pick},options[pick]))}return out}
function ensure(state,day){
 day=dayKey(day);state.guildStats=state.guildStats&&typeof state.guildStats==="object"?state.guildStats:{kills:0,crafts:0};
 state.guildStats.kills=Math.max(0,Number(state.guildStats.kills)||0);state.guildStats.crafts=Math.max(0,Number(state.guildStats.crafts)||0);
 state.guild=state.guild&&typeof state.guild==="object"?state.guild:{};
 if(!state.guild.daily||state.guild.daily.period!==day)state.guild.daily={period:day,startKills:state.guildStats.kills,startCrafts:state.guildStats.crafts,claimed:[],contracts:choose(dailyPools,day+":"+state.number)};
 var wk=weekKey(day);
 if(!state.guild.weekly||state.guild.weekly.period!==wk)state.guild.weekly={period:wk,startKills:state.guildStats.kills,startCrafts:state.guildStats.crafts,startSteps:Math.max(0,Number(state.stepLifetime)||0),claimed:[],contracts:choose(weeklyPools,wk+":"+state.number)};
 return state.guild;
}
function progress(state,period,contract){
 var record=period==="weekly"?state.guild.weekly:state.guild.daily,amount=0;
 if(contract.type==="steps")amount=period==="weekly"?Math.max(0,(Number(state.stepLifetime)||0)-record.startSteps):(state.stepDate===record.period?Number(state.stepsToday)||0:0);
 if(contract.type==="kills")amount=Math.max(0,(Number(state.guildStats&&state.guildStats.kills)||0)-record.startKills);
 if(contract.type==="crafts")amount=Math.max(0,(Number(state.guildStats&&state.guildStats.crafts)||0)-record.startCrafts);
 return Math.min(contract.target,amount);
}
function claim(state,period,id,day){
 ensure(state,day);var record=period==="weekly"?state.guild.weekly:period==="daily"?state.guild.daily:null;
 if(!record)return {ok:false,reason:"Unknown contract period."};
 var contract=record.contracts.find(function(c){return c.id===id});
 if(!contract)return {ok:false,reason:"That contract is no longer on the board."};
 if(record.claimed.indexOf(id)>=0)return {ok:false,reason:"That reward has already been claimed."};
 var amount=progress(state,period,contract);
 if(amount<contract.target)return {ok:false,reason:"Contract objectives are not complete yet."};
 record.claimed.push(id);state.coins=(Number(state.coins)||0)+contract.coins;state.xp=(Number(state.xp)||0)+contract.xp;
 return {ok:true,title:contract.title,coins:contract.coins,xp:contract.xp};
}
function contractCard(state,period,c){
 var record=period==="weekly"?state.guild.weekly:state.guild.daily,done=progress(state,period,c),complete=done>=c.target,claimed=record.claimed.indexOf(c.id)>=0,pct=Math.round(done/c.target*100);
 return '<article class="guild-contract '+(claimed?"is-claimed":complete?"is-complete":"")+'"><div class="guild-contract-top"><span class="guild-contract-type">'+(period==="daily"?"DAILY CONTRACT":"WEEKLY COMMISSION")+'</span><span class="guild-contract-status">'+(claimed?"REWARDED":complete?"OBJECTIVE CLEAR":"IN PROGRESS")+'</span></div><h3>'+esc(c.title)+'</h3><p>'+esc(c.description)+'</p><div class="guild-contract-progress"><div><span>PROGRESS</span><b>'+done.toLocaleString()+' / '+c.target.toLocaleString()+'</b></div><div class="bar"><span style="width:'+pct+'%"></span></div></div><div class="guild-contract-footer"><span>◈ '+c.coins.toLocaleString()+' COINS <i>·</i> ✦ '+c.xp.toLocaleString()+' XP</span><button class="action '+(complete&&!claimed?"primary":"")+'" data-guild-claim="'+period+':'+c.id+'" '+(!complete||claimed?"disabled":"")+'>'+(claimed?"CLAIMED":complete?"CLAIM REWARD":"LOCKED")+'</button></div></article>';
}
function render(state,day){
 var guild=ensure(state,day),dailyDone=guild.daily.claimed.length,weeklyDone=guild.weekly.claimed.length,dailyReady=guild.daily.contracts.filter(function(c){return progress(state,"daily",c)>=c.target&&guild.daily.claimed.indexOf(c.id)<0}).length,weeklyReady=guild.weekly.contracts.filter(function(c){return progress(state,"weekly",c)>=c.target&&guild.weekly.claimed.indexOf(c.id)<0}).length;
 return '<div class="rpg-page guild-page"><section class="guild-hero"><div class="guild-hero-sigil">✦</div><div class="eyebrow">THE ADVENTURER\'S GUILD · OFFICIAL CONTRACT OFFICE</div><h1>THE GUILD HALL</h1><p>Take contracts. Earn your keep. Become a local legend—or at least a less expensive problem.</p><div class="guild-hero-stats"><div><b>'+dailyDone+'/3</b><small>DAILY CLAIMED</small></div><div><b>'+weeklyDone+'/3</b><small>WEEKLY CLAIMED</small></div><div><b>'+Number(state.guildStats.kills||0).toLocaleString()+'</b><small>GUILD ELIMINATIONS</small></div></div></section><section class="guild-board"><div class="guild-board-heading"><div><div class="eyebrow">REFRESHES AT LOCAL MIDNIGHT</div><h2>DAILY CONTRACTS</h2></div><span class="guild-ready-count">'+dailyReady+' READY</span></div>'+guild.daily.contracts.map(function(c){return contractCard(state,"daily",c)}).join("")+'</section><section class="guild-board weekly"><div class="guild-board-heading"><div><div class="eyebrow">NEW COMMISSIONS EVERY MONDAY</div><h2>WEEKLY COMMISSIONS</h2></div><span class="guild-ready-count">'+weeklyReady+' READY</span></div>'+guild.weekly.contracts.map(function(c){return contractCard(state,"weekly",c)}).join("")+'</section><section class="guild-notice"><b>THE GUILD REGISTRAR</b><p>“Contracts rotate automatically. Progress is tied to your crawler’s verified steps, monster victories, and crafted items. Rewards can only be claimed once. Yes, I know you were going to ask.”</p></section></div>';
}
var api={ensure:ensure,progress:progress,claim:claim,render:render,weekKey:weekKey};
if(root)root.DUO_GUILD=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:null);
