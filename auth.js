(function(){
"use strict";
var PROJECT_URL="https://xuxwwpfeenaaxzfspiiq.supabase.co",PUBLISHABLE_KEY="sb_publishable_h_Dw5OeqfUQ856jYriSMRg_iFg-_pzS";
var SAVE_KEY="duo-dungeon-save-v2",CLAIM_KEY="duo-dungeon-claim-guest",IDLE_KEY="duo-dungeon-last-active-v1",IDLE_LIMIT=60*60*1000,client=null,user=null,mode="pending",initialSave=null,crawlerNumber=null,saveRevision=null,saveBlocked=false,persistQueue=Promise.resolve(),resolveReady,idleTimer=null,lastActivityWrite=0;
// Persist the Supabase session across refreshes; expire it after one hour without activity.
function safeStorageGet(key){try{return localStorage.getItem(key)}catch(e){return null}}
function safeStorageRemove(key){try{localStorage.removeItem(key)}catch(e){}}
function readLastActivity(){return Number(safeStorageGet(IDLE_KEY))||0}
function stopIdleSignOut(){if(idleTimer){clearTimeout(idleTimer);idleTimer=null}}
function scheduleIdleSignOut(){stopIdleSignOut();if(!user)return;var last=readLastActivity();if(!last){writeLastActivity();return}var remaining=IDLE_LIMIT-(Date.now()-last);if(remaining<=0){expireIdleSession();return}idleTimer=setTimeout(expireIdleSession,remaining+50)}
function writeLastActivity(){var now=Date.now();if(now-lastActivityWrite<10000)return;lastActivityWrite=now;try{localStorage.setItem(IDLE_KEY,String(now))}catch(e){}scheduleIdleSignOut()}
async function expireIdleSession(){stopIdleSignOut();if(!user)return;var elapsed=Date.now()-readLastActivity();if(elapsed<IDLE_LIMIT){scheduleIdleSignOut();return}try{if(client)await client.auth.signOut({scope:"local"})}catch(e){console.warn("Idle session cleanup failed:",e)}user=null;mode="pending";initialSave=null;saveRevision=null;saveBlocked=false;try{localStorage.removeItem(IDLE_KEY)}catch(e){}root.classList.remove("hidden");configureDevLogin("Your session ended after one hour without activity. Sign in again to continue.");resolveReady()}
function startIdleSessionWatch(){if(!user)return;if(!readLastActivity())writeLastActivity();scheduleIdleSignOut()}
["pointerdown","keydown","touchstart","scroll"].forEach(function(type){document.addEventListener(type,function(){if(user)writeLastActivity()},{passive:true})});
window.addEventListener("storage",function(e){if(e.key===IDLE_KEY&&user)scheduleIdleSignOut()});
var ready=new Promise(function(resolve){resolveReady=resolve});
var DEV_PREVIEW=location.hostname==="str8kryptic.github.io"&&location.pathname.startsWith("/Duo-Dungeon-Preview"),DEV_ADMIN_EMAIL="frankwood.fmw@icloud.com";
function configureDevLogin(notice){
 if(!DEV_PREVIEW)return;
 var signupTab=root.querySelector('[data-mode="signup"]'),loginTab=root.querySelector('[data-mode="login"]');
 if(signupTab)signupTab.style.display="none";
 if(loginTab){loginTab.classList.add("active");}
 currentMode="login";
 if(submit){submit.textContent="LOG IN";submit.style.display="block";}
 if(form){form.style.display="block";var password=form.querySelector("#auth-password");if(password)password.autocomplete="current-password";}
 /* Keep the guest action visible in the art; finishGuest still enforces the private Dev restriction. */
 if(root.querySelector(".auth-buttons"))root.querySelector(".auth-buttons").style.gridTemplateColumns="1fr";
 if(notice&&!/private development build.*authorized developer account/i.test(notice))message(notice);
}
function devAccountAllowed(u){return !DEV_PREVIEW||!!(u&&String(u.email||"").trim().toLowerCase()===DEV_ADMIN_EMAIL);}
function denyDevAccount(){
 user=null;mode="pending";initialSave=null;
 if(client)client.auth.signOut().catch(function(err){console.error("Could not sign out unauthorized Development session:",err)});
 root.classList.remove("hidden");
 configureDevLogin("This is a private Development build. Sign in with the authorized developer account to continue.");
}
var root=document.createElement("div");root.className="auth-overlay";root.id="auth-overlay";
root.innerHTML='<section class="auth-card"><video class="auth-login-v2-art" autoplay muted loop playsinline preload="auto" poster="https://xuxwwpfeenaaxzfspiiq.supabase.co/storage/v1/object/public/public-assets/Login/Backgrounds/LoginV2.png" aria-label="Animated Duo Dungeon login background"><source src="https://xuxwwpfeenaaxzfspiiq.supabase.co/storage/v1/object/public/public-assets/Login/Backgrounds/LoginV3.mp4" type="video/mp4"></video><button type="button" class="auth-v2-orb" id="auth-v2-orb" aria-label="Ask the Orb"><canvas class="assistant-orb-live" data-ai-orb aria-hidden="true"></canvas></button><section class="auth-v2-live"><form id="auth-form" autocomplete="off"><div class="auth-v2-field auth-v2-email"><label class="sr-only" for="auth-email">Email address</label><input id="auth-email" type="email" name="delver-login-email" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" inputmode="email" required aria-label="Email address"></div><div class="auth-v2-field auth-v2-password"><label class="sr-only" for="auth-password">Password</label><input id="auth-password" type="password" name="delver-login-password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" minlength="12" required aria-label="Password"></div><button class="auth-v2-submit" id="auth-submit" type="submit" aria-label="Log in"></button></form><div class="auth-v2-feedback" id="auth-message" role="status" aria-live="polite"></div><div class="auth-buttons"><button type="button" data-mode="signup">CREATE ACCOUNT</button><button type="button" data-mode="login" class="active">LOG IN</button></div><button type="button" class="auth-v2-resend" id="auth-resend" style="display:none" disabled aria-label="Resend confirmation email"></button><button type="button" class="auth-v2-forgot" id="auth-forgot" style="display:none">FORGOT PASSWORD?</button><button type="button" class="auth-v2-guest" id="guest-button" aria-label="Guest Sign-In">GUEST SIGN-IN</button><button type="button" class="auth-v2-back" id="auth-back" style="display:none">BACK TO GAME</button><button type="button" class="auth-v2-signout" id="auth-signout" style="display:none">SIGN OUT</button><p class="auth-small">Guest progress stays on this device until you create an account.</p></section></section>';
document.body.appendChild(root);

// LoginV3 playback state: retain the poster until a decoded frame is actually available.
var loginBackgroundVideo=root.querySelector("video.auth-login-v2-art");
var loginBackgroundStatus=root.querySelector("#auth-message");
if(loginBackgroundVideo){
  var loginVideoSource=loginBackgroundVideo.querySelector("source");
  var loginVideoUrl="https://xuxwwpfeenaaxzfspiiq.supabase.co/storage/v1/object/public/public-assets/Login/Backgrounds/LoginV3.mp4?v=20261115c";
  if(loginVideoSource)loginVideoSource.src=loginVideoUrl;
  loginBackgroundVideo.setAttribute("poster","https://xuxwwpfeenaaxzfspiiq.supabase.co/storage/v1/object/public/public-assets/Login/Backgrounds/LoginV2.png");
  loginBackgroundVideo.muted=true;
  loginBackgroundVideo.defaultMuted=true;
  loginBackgroundVideo.playsInline=true;
  loginBackgroundVideo.loop=true;
  function loginVideoStatus(text){if(loginBackgroundStatus)loginBackgroundStatus.textContent=text;}
  loginVideoStatus("Waking the dungeon…");
  loginBackgroundVideo.addEventListener("loadedmetadata",function(){
    console.info("[Duo Dungeon LoginV3] Metadata loaded.",{duration:loginBackgroundVideo.duration,videoWidth:loginBackgroundVideo.videoWidth,videoHeight:loginBackgroundVideo.videoHeight});
    loginVideoStatus("Animation ready — starting…");
  });
  loginBackgroundVideo.addEventListener("loadeddata",function(){
    console.info("[Duo Dungeon LoginV3] First decoded frame loaded.",{readyState:loginBackgroundVideo.readyState});
    loginVideoStatus("Animation frame loaded.");
  });
  loginBackgroundVideo.addEventListener("canplay",function(){
    console.info("[Duo Dungeon LoginV3] Can play.");
    loginVideoStatus("Animation ready.");
  });
  loginBackgroundVideo.addEventListener("playing",function(){
    console.info("[Duo Dungeon LoginV3] Playback started.");
    loginVideoStatus("");
  });
  loginBackgroundVideo.addEventListener("waiting",function(){
    console.warn("[Duo Dungeon LoginV3] Waiting for video data.");
    loginVideoStatus("The animation is buffering…");
  });
  loginBackgroundVideo.addEventListener("stalled",function(){
    console.warn("[Duo Dungeon LoginV3] Video download stalled.",{networkState:loginBackgroundVideo.networkState,readyState:loginBackgroundVideo.readyState,currentSrc:loginBackgroundVideo.currentSrc});
    loginVideoStatus("The animation download stalled.");
  });
  loginBackgroundVideo.addEventListener("error",function(){
    var mediaError=loginBackgroundVideo.error;
    var details={code:mediaError?mediaError.code:null,message:mediaError?mediaError.message:"Unknown media error",networkState:loginBackgroundVideo.networkState,readyState:loginBackgroundVideo.readyState,currentSrc:loginBackgroundVideo.currentSrc};
    console.error("[Duo Dungeon LoginV3] Video failed.",details);
    loginVideoStatus("Animation unavailable (video error "+details.code+").");
  });
  function startLoginVideoFromGesture(){
    if(!loginBackgroundVideo.paused)return;
    loginBackgroundVideo.play().then(function(){
      console.info("[Duo Dungeon LoginV3] Playback started after user gesture.");
    }).catch(function(error){
      console.warn("[Duo Dungeon LoginV3] User-initiated playback failed.",error);
      loginVideoStatus("Animation could not start: "+(error&&error.name?error.name:"playback error")+".");
    });
  }
  // In-app browsers sometimes suppress autoplay; allow the first tap anywhere on the login shell to start it.
  root.addEventListener("pointerdown",startLoginVideoFromGesture,{passive:true});
  loginBackgroundVideo.load();
  loginBackgroundVideo.play().catch(function(error){
    console.warn("[Duo Dungeon LoginV3] Autoplay blocked.",error);
    loginVideoStatus("Tap anywhere to start the animated background.");
  });
  window.setTimeout(function(){
    if(loginBackgroundVideo.paused&&loginBackgroundVideo.readyState<2){
      loginVideoStatus("Animation hasn't loaded yet. Check video access or encoding.");
      console.warn("[Duo Dungeon LoginV3] No decoded frame after 8 seconds.",{networkState:loginBackgroundVideo.networkState,readyState:loginBackgroundVideo.readyState,currentSrc:loginBackgroundVideo.currentSrc});
    }
  },8000);
}

var form=root.querySelector("#auth-form"),msg=root.querySelector("#auth-message"),submit=root.querySelector("#auth-submit"),guest=root.querySelector("#guest-button"),back=root.querySelector("#auth-back"),signout=root.querySelector("#auth-signout"),currentMode=DEV_PREVIEW?"login":"signup",busy=false,resendEmail="",resendTimer=null;var resend=root.querySelector("#auth-resend"),forgot=root.querySelector("#auth-forgot");
function message(t){msg.textContent=t}
var loginOrb=root.querySelector("#auth-v2-orb");
if(loginOrb)loginOrb.addEventListener("click",function(){message("Impressive. You found the Orb. Now try logging in before demanding answers.");});
function mountLoginOrb(){if(window.DUO_ORB&&root.querySelector("canvas[data-ai-orb]"))window.DUO_ORB.mount(root)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountLoginOrb,{once:true});else mountLoginOrb();
function armResend(email){resendEmail=email;var deadline=Date.now()+120000;try{localStorage.setItem("duo-dungeon-resend-email",email);localStorage.setItem("duo-dungeon-resend-deadline",String(deadline))}catch(e){}resend.style.display="block";if(resendTimer)clearInterval(resendTimer);function tick(){var remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000)),m=Math.floor(remaining/60),s=String(remaining%60).padStart(2,"0");resend.textContent=remaining>0?"RESEND CONFIRMATION IN "+m+":"+s:"RESEND CONFIRMATION EMAIL";resend.disabled=remaining>0;if(remaining===0&&resendTimer){clearInterval(resendTimer);resendTimer=null}}tick();if(deadline>Date.now())resendTimer=setInterval(tick,1000)}function restoreResend(){try{var savedEmail=localStorage.getItem("duo-dungeon-resend-email"),deadline=Number(safeStorageGet("duo-dungeon-resend-deadline"));if(savedEmail&&deadline){resendEmail=savedEmail;resend.style.display="block";if(resendTimer)clearInterval(resendTimer);function tick(){var remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000)),m=Math.floor(remaining/60),s=String(remaining%60).padStart(2,"0");resend.textContent=remaining>0?"RESEND CONFIRMATION IN "+m+":"+s:"RESEND CONFIRMATION EMAIL";resend.disabled=remaining>0;if(remaining===0&&resendTimer){clearInterval(resendTimer);resendTimer=null}}tick();if(deadline>Date.now())resendTimer=setInterval(tick,1000)}}catch(e){}}
function setBusy(v){busy=v;submit.disabled=v;guest.disabled=v;submit.style.opacity=v?".6":"1"}
restoreResend();
document.addEventListener("visibilitychange",function(){if(!document.hidden&&resendEmail){var deadline=Number(localStorage.getItem("duo-dungeon-resend-deadline"));if(deadline){if(resendTimer)clearInterval(resendTimer);resendTimer=null;var remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));resend.disabled=remaining>0;var m=Math.floor(remaining/60),s=String(remaining%60).padStart(2,"0");resend.textContent=remaining>0?"RESEND CONFIRMATION IN "+m+":"+s:"RESEND CONFIRMATION EMAIL";if(remaining>0)resendTimer=setInterval(function(){var left=Math.max(0,Math.ceil((deadline-Date.now())/1000));var mm=Math.floor(left/60),ss=String(left%60).padStart(2,"0");resend.textContent=left>0?"RESEND CONFIRMATION IN "+mm+":"+ss:"RESEND CONFIRMATION EMAIL";resend.disabled=left>0;if(left===0&&resendTimer){clearInterval(resendTimer);resendTimer=null}},1000)}}});
function readLocal(){try{var x=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function readLegacy(){try{var x=JSON.parse(localStorage.getItem("duo-dungeon-save-v1")||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function migrateLegacy(old){if(!old)return null;var data=window.DUO_DATA||{},folds=Math.max(0,Number(old.folds)||0),earned=(data.achievements||[]).filter(function(x){return folds>=Number(x.at||Infinity)}),lifeCoins=earned.reduce(function(n,x){return n+Number(x.coins||0)},0),lifeXP=earned.reduce(function(n,x){return n+Number(x.xp||0)},0),inventory=Array.isArray(old.inventory)?old.inventory:[],gear=old.equipped&&typeof old.equipped==="object"?old.equipped:{},materials=old.materials&&typeof old.materials==="object"?old.materials:{};return {name:String(old.playerName||old.name||"").slice(0,20),number:Number(old.crawlerNumber||old.number)||100000+Math.floor(Math.random()*900000),coins:Math.max(0,folds*2+lifeCoins+Number(old.bankedDailyCoins||0)+Number(old.bonusCoins||0)-Number(old.spentCoins||0)),xp:Math.max(0,folds*10+lifeXP+Number(old.bankedDailyXP||0)+Number(old.bonusXP||0)),dust:Number(materials.hingeDust||0),bag:inventory.map(function(x){return typeof x==="string"?x:x&&x.id}).filter(Boolean),gear:{weapon:gear.weapon||null,armor:gear.armor||null,companion:gear.companion||null,title:gear.title||null},materials:{hingeDust:Number(materials.hingeDust||0),mimicShards:Number(materials.mimicShards||0),dragonScales:Number(materials.dragonScales||0),herbs:Number(materials.herbs||0)},relics:Object.keys(old.relics||{}).filter(function(k){return !!old.relics[k]}),upgrades:old.upgrades||{},activePotions:Array.isArray(old.activePotions)?old.activePotions:[],companionXP:Number(old.companionXP||0),title:String(gear.title||""),stepsToday:0,healthStepsToday:0,stepDate:"",stepLifetime:0,legacyArchive:{version:1,folds:folds,todayFolds:Number(old.todayFolds||0),dayKey:String(old.dayKey||""),earned:Array.isArray(old.earned)?old.earned:[],dailyClaimed:Array.isArray(old.dailyClaimed)?old.dailyClaimed:[],fullSave:old}}}
function fresh(){return {name:"",number:100000+Math.floor(Math.random()*900000),coins:250,dust:0,xp:0,bag:[],gear:{},bankedSteps:10000,starterReserveGranted:true,dailyReserveBaseline:10000,dailyStepsEarned:0,dailyStepsBanked:0,dailyStepsSpent:0}}
async function persist(save){
 if(!user||!client||saveBlocked)return;
 if(!navigator.onLine){mode="account-offline";return;}
 var targetUser=user,payload=JSON.parse(JSON.stringify(save));
 persistQueue=persistQueue.then(async function(){
  if(!user||user.id!==targetUser.id||!client||saveBlocked)return;
  var now=new Date().toISOString(),result;
  if(saveRevision===null){
   result=await client.from("player_saves").insert({user_id:targetUser.id,save_data:payload,revision:1,updated_at:now}).select("revision").maybeSingle();
   if(!result.error&&result.data)saveRevision=Number(result.data.revision);
  }else{
   var expected=saveRevision;
   result=await client.from("player_saves").update({save_data:payload,revision:expected+1,updated_at:now}).eq("user_id",targetUser.id).eq("revision",expected).select("revision").maybeSingle();
   if(!result.error&&result.data)saveRevision=Number(result.data.revision);
   else if(!result.error&&!result.data){
    saveBlocked=true;
    message("Save conflict detected. Your newer server progress was protected; reload the game to continue.");
    console.warn("Duo Dungeon save revision conflict; stale write was blocked.");
    return;
   }
  }
  if(result.error){mode="account-offline";console.error("Duo Dungeon save failed:",result.error.message);message("Save warning: your progress is stored on this device and will sync when the connection returns.");return}
  try{localStorage.setItem(OFFLINE_SAVE_PREFIX+targetUser.id,JSON.stringify(payload));localStorage.setItem(OFFLINE_BASE_PREFIX+targetUser.id,JSON.stringify(payload))}catch(storageError){}
  if(payload.name&&user&&user.id===targetUser.id)await client.from("player_profiles").update({display_name:String(payload.name).slice(0,20),updated_at:now}).eq("id",targetUser.id);
 }).catch(function(error){console.error("Duo Dungeon save queue failed:",error);message("Save warning: your latest changes could not be saved.")});
 return persistQueue;
}
async function loadAccount(u,afterSignup){
 if(!devAccountAllowed(u)){denyDevAccount();return}
 user=u;mode="account";
 var p=await client.from("player_profiles").select("crawler_number,display_name").eq("id",u.id).single();
 if(p.error)throw p.error;crawlerNumber=p.data.crawler_number;
 var r=await client.from("player_saves").select("save_data,revision").eq("user_id",u.id).maybeSingle();
 if(r.error)throw r.error;
 if(r.data&&r.data.save_data){initialSave=r.data.save_data;saveRevision=Number(r.data.revision||0);saveBlocked=false;safeStorageRemove(CLAIM_KEY)}
 else{
  var claim=safeStorageGet(CLAIM_KEY)==="1",guestSave=claim?readLocal():null,legacySave=!guestSave?migrateLegacy(readLegacy()):null;
  initialSave=guestSave||legacySave||fresh();saveRevision=null;saveBlocked=false;
  if(guestSave&&guestSave.number){
   var up=await client.from("player_profiles").update({crawler_number:guestSave.number,display_name:String(guestSave.name||"NEW DELVER").slice(0,20),updated_at:new Date().toISOString()}).eq("id",u.id).select("crawler_number").maybeSingle();
   if(up.error){if(up.error.code==="23505")throw new Error("That Delver name or number is already in use. Choose a different identity.");throw up.error}if(up.data)crawlerNumber=up.data.crawler_number;
  }
  initialSave.number=crawlerNumber;await persist(initialSave);localStorage.removeItem(CLAIM_KEY);
 }
 try{localStorage.setItem(OFFLINE_SAVE_PREFIX+user.id,JSON.stringify(initialSave));localStorage.setItem(OFFLINE_BASE_PREFIX+user.id,JSON.stringify(initialSave))}catch(storageError){}
 startIdleSessionWatch();root.classList.add("hidden");resolveReady();
 if(afterSignup){window.location.href=new URL("setup.html",window.location.href).href;return}
 if(new URLSearchParams(location.search).get("welcome")==="1"){window.location.replace(new URL("setup.html",window.location.href).href);return}
 if(window.__DUO_APP_READY__)window.location.reload();
}
async function finishGuest(){if(DEV_PREVIEW){configureDevLogin("Guest access is disabled in the private Development build. Sign in with the authorized developer account.");return}mode="guest";user=null;initialSave=readLocal()||migrateLegacy(readLegacy());if(initialSave&&!readLocal())try{localStorage.setItem(SAVE_KEY,JSON.stringify(initialSave))}catch(e){}root.classList.add("hidden");resolveReady()}
function showPasswordRecovery(){root.classList.remove("hidden");root.innerHTML='<section class="auth-card"><h1 class="auth-title">PASSWORD RESCUE</h1><p class="auth-sub">THE DUNGEON HAS NO IDEA WHAT YOUR PASSWORD WAS. NEITHER DO WE.</p><form id="recovery-form"><label for="recovery-password">NEW PASSWORD</label><input id="recovery-password" type="password" minlength="12" autocomplete="new-password" required placeholder="At least 12 characters"><label for="recovery-confirm">CONFIRM NEW PASSWORD</label><input id="recovery-confirm" type="password" minlength="12" autocomplete="new-password" required placeholder="Enter it again"><button class="auth-wide primary" type="submit">SAVE NEW PASSWORD</button></form><p class="auth-message" id="recovery-message">Choose a new password. Preferably one your future self can remember.</p></section>';var rf=root.querySelector("#recovery-form"),rm=root.querySelector("#recovery-message");rf.addEventListener("submit",async function(e){e.preventDefault();var p=root.querySelector("#recovery-password"),q=root.querySelector("#recovery-confirm"),btn=rf.querySelector("button");if(p.value.length<12){rm.textContent="At least 12 characters. The dungeon has standards. Barely.";return}if(p.value!==q.value){rm.textContent="Those passwords do not match. Even the goblins noticed.";return}btn.disabled=true;rm.textContent="Updating your credentials…";try{var result=await client.auth.updateUser({password:p.value});if(result.error)throw result.error;rm.textContent="Password updated. Your memory has been restored. Try not to lose it before the next boss fight.";p.value="";q.value="";await loadAccount(result.data.user||user)}catch(err){rm.textContent=err&&err.message?err.message:"Could not update your password. Please try again.";btn.disabled=false}})}
function open(){
 root.classList.remove("hidden");var signed=!!user;
 back.style.display=signed||mode==="guest"?"block":"none";guest.style.display=signed||mode==="guest"?"none":"block";
 signout.style.display=signed?"block":"none";
 if(signed){message("Signed in as "+user.email+". Your progress is saved to your account.");submit.style.display="none";form.style.display="none";resend.style.display="none";root.querySelector(".auth-buttons").style.display="none"}
 else{submit.style.display="block";form.style.display="block";root.querySelector(".auth-buttons").style.display="grid";forgot.style.display=currentMode==="login"?"block":"none"}
}
window.DUO_AUTH={ready:ready,get user(){return user},get mode(){return mode},get initialSave(){return initialSave},get crawlerNumber(){return crawlerNumber},persist:persist,syncStepRewards:async function(total,date,timeZone){if(!client||!user)throw new Error("Sign in to sync Health steps.");var targetUser=user;await persistQueue;if(!user||user.id!==targetUser.id)throw new Error("Your signed-in account changed before step sync. Please try again.");var result=await client.functions.invoke("step-reward-sync",{body:{total:total,date:date,timeZone:timeZone}});if(result.error)throw result.error;var data=result.data;if(!data||!data.accepted||!data.saveData||!Number.isSafeInteger(Number(data.currentRevision)))throw new Error(data&&data.error?data.error:"The secure step sync returned an incomplete save. No local rewards were applied.");if(!user||user.id!==targetUser.id)throw new Error("Your signed-in account changed during step sync. Reload before continuing.");saveRevision=Number(data.currentRevision);initialSave=data.saveData;saveBlocked=false;return data},renameCrawlerName:async function(name){if(!user||!client)return true;var r=await client.from("player_profiles").update({display_name:String(name).trim().slice(0,20),updated_at:new Date().toISOString()}).eq("id",user.id).select("id").single();if(r.error){if(r.error.code==="23505")throw new Error("That Delver name is already taken. The dungeon only has room for one.");throw r.error}return true},updateCrawlerNumber:async function(number){if(!user||!client)return true;var r=await client.from("player_profiles").update({crawler_number:Number(number),updated_at:new Date().toISOString()}).eq("id",user.id).select("crawler_number").single();if(r.error){if(r.error.code==="23505")throw new Error("That Delver number is already assigned. Try another roll.");throw r.error}crawlerNumber=r.data.crawler_number;return true},open:open,updateStepPlatform:async function(platform){if(!client||!user)throw new Error("Sign in to change your step-sync method.");if(platform!=="apple_health"&&platform!=="health_connect")throw new Error("Choose Apple Health or Android Health Connect.");var r=await client.auth.updateUser({data:{step_platform:platform}});if(r.error)throw r.error;if(!r.data||!r.data.user)throw new Error("The registrar did not return the updated account preference.");user=r.data.user;return user},developerDashboard:async function(){if(!client||!user)throw new Error("Sign in to use developer tools.");return await client.functions.invoke("dev-admin-dashboard")},previewGameUpdate:async function(payload){if(!client||!user)throw new Error("Sign in to publish updates.");return await client.functions.invoke("dev-publish-update",{body:Object.assign({},payload,{action:"preview"})})},sendTestGameUpdate:async function(payload){if(!client||!user)throw new Error("Sign in to send a test update.");return await client.functions.invoke("dev-publish-update",{body:Object.assign({},payload,{action:"test"})})},publishGameUpdate:async function(payload){if(!client||!user)throw new Error("Sign in to publish updates.");return await client.functions.invoke("dev-publish-update",{body:Object.assign({},payload,{action:"publish"})})},updateEmail:async function(email){if(!client||!user)throw new Error("Sign in to change your email.");var r=await client.auth.updateUser({email:email});if(r.error)throw r.error;return r.data},updatePassword:async function(password){if(!client||!user)throw new Error("Sign in to change your password.");var r=await client.auth.updateUser({password:password});if(r.error)throw r.error;return r.data},deleteAccount:async function(password,confirmation){if(!client||!user)throw new Error("Sign in before deleting your account.");if(typeof password!=="string"||!password||confirmation!=="DELETE")throw new Error("Enter your current password and type DELETE to confirm.");await persistQueue;var result=await client.functions.invoke("delete-account",{body:{password:password,confirmation:confirmation}});if(result.error)throw new Error(result.data&&result.data.error?result.data.error:result.error.message||"Account deletion failed.");if(!result.data||result.data.success!==true)throw new Error(result.data&&result.data.error?result.data.error:"The account service did not confirm deletion.");saveBlocked=true;user=null;mode="pending";initialSave=null;saveRevision=null;try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(CLAIM_KEY);localStorage.removeItem("sb-xuxwwpfeenaaxzfspiiq-auth-token")}catch(e){}try{await client.auth.signOut({scope:"local"})}catch(e){console.warn("Deleted account session cleanup:",e)}return true},signOut:async function(){stopIdleSignOut();if(client){var r=await client.auth.signOut();if(r.error)throw r.error}user=null;mode="pending";try{localStorage.removeItem(IDLE_KEY)}catch(e){}window.location.reload()}};
root.querySelectorAll("[data-mode]").forEach(function(b){b.addEventListener("click",function(){currentMode=b.dataset.mode;root.querySelectorAll("[data-mode]").forEach(function(x){x.classList.toggle("active",x===b)});submit.textContent=currentMode==="signup"?"CREATE ACCOUNT":"LOG IN";root.querySelector("#auth-password").autocomplete=currentMode==="signup"?"new-password":"current-password";forgot.style.display=currentMode==="login"?"block":"none";message(currentMode==="signup"?"Choose an email and password. We'll send a confirmation email if verification is enabled.":"Welcome back, Delver. Enter your credentials.")})});
forgot.addEventListener("click",async function(){if(busy||!client)return;var email=root.querySelector("#auth-email").value.trim();if(!email){message("Enter your account email first. The dungeon cannot mail a password reset to a shrug.");root.querySelector("#auth-email").focus();return}setBusy(true);forgot.disabled=true;message("Sending a password rescue flare…");try{var result=await client.auth.resetPasswordForEmail(email,{redirectTo:new URL("./?resetPassword=1",window.location.href).href});if(result.error)throw result.error;message("Password reset email requested. Check your inbox and junk folder. The dungeon has mailed you a second chance.")}catch(err){message(err&&err.message?err.message:"Could not send the reset email. Try again in a moment.")}finally{setBusy(false);forgot.disabled=false}});
guest.addEventListener("click",finishGuest);back.addEventListener("click",function(){root.classList.add("hidden")});
signout.addEventListener("click",async function(){stopIdleSignOut();if(client){await client.auth.signOut()}user=null;mode="pending";try{localStorage.removeItem(IDLE_KEY)}catch(e){}window.location.reload()});
resend.addEventListener("click",async function(){if(busy||!resendEmail)return;setBusy(true);resend.disabled=true;message("Asking the registrar to send another confirmation…");try{var result=await client.auth.resend({type:"signup",email:resendEmail,options:{emailRedirectTo:new URL("./?welcome=1",window.location.href).href}});if(result.error)throw result.error;message("Another confirmation email has been requested. Check your inbox and junk folder.");armResend(resendEmail)}catch(err){message(err&&err.message?err.message:"Could not resend the confirmation email. Try logging in if the account may already be confirmed.");resend.disabled=false;resend.textContent="TRY RESENDING"}finally{setBusy(false)}});
form.addEventListener("submit",async function(e){
 e.preventDefault();if(busy||!client)return;if(DEV_PREVIEW&&currentMode!=="login"){currentMode="login";submit.textContent="LOG IN";}var email=root.querySelector("#auth-email").value.trim(),password=root.querySelector("#auth-password").value;setBusy(true);message("Contacting the dungeon registrar…");
 try{
  if(currentMode==="signup"){
   if(readLocal())localStorage.setItem(CLAIM_KEY,"1");
   var signup=await client.auth.signUp({email:email,password:password,options:{emailRedirectTo:new URL("./?welcome=1",window.location.href).href}});
   if(signup.error)throw signup.error;
   if(signup.data.session){await loadAccount(signup.data.user,true)}
   else{message("Your signup was received. If the confirmation email does not arrive, you can request another one here after the short cooldown. Your guest progress will be claimed when you return and log in on this device.");armResend(email)}
  }else{var login=await client.auth.signInWithPassword({email:email,password:password});if(login.error)throw login.error;await loadAccount(login.data.user)}
 }catch(err){message(err&&err.message?err.message:"Authentication failed. Please try again.")}finally{setBusy(false)}
});
var recoveryHandled=false;
function enterPasswordRecovery(session){
 if(recoveryHandled||!session||!session.user)return;
 recoveryHandled=true;user=session.user;mode="recovery";showPasswordRecovery();
}
var OFFLINE_SAVE_PREFIX="duo-dungeon-save-v2-user-",OFFLINE_BASE_PREFIX="duo-dungeon-offline-base-",offlineSyncInFlight=false;
function offlineSaveFor(userId){try{var raw=localStorage.getItem(OFFLINE_SAVE_PREFIX+userId),value=raw&&JSON.parse(raw);return value&&typeof value==="object"?value:null}catch(e){return null}}
function activateOfflineAccount(account){
 if(!account||!account.user||!devAccountAllowed(account.user))return false;
 var cached=offlineSaveFor(account.user.id);if(!cached)return false;
 user=account.user;mode="account-offline";initialSave=cached;crawlerNumber=Number(cached.number)||null;saveBlocked=false;
 try{if(!localStorage.getItem(OFFLINE_BASE_PREFIX+user.id))localStorage.setItem(OFFLINE_BASE_PREFIX+user.id,JSON.stringify(cached))}catch(e){}
 startIdleSessionWatch();root.classList.add("hidden");message("Offline mode: your cached Delver is available. Gathering will settle locally and sync safely when you reconnect.");resolveReady();return true;
}
async function syncOfflineActivity(){
 if(!navigator.onLine||!user||!client||mode!=="account-offline"||offlineSyncInFlight)return;
 offlineSyncInFlight=true;
 try{
 var target=user,offline=offlineSaveFor(target.id),base=null;
 try{base=JSON.parse(localStorage.getItem(OFFLINE_BASE_PREFIX+target.id)||"null")}catch(e){}
 if(!offline||!base)return;
 for(var attempt=0;attempt<3;attempt++){
  if(!user||user.id!==target.id)return;
  var latest=await client.from("player_saves").select("save_data,revision").eq("user_id",target.id).maybeSingle();
  if(latest.error)throw latest.error;
  var remote=latest.data&&latest.data.save_data?latest.data.save_data:{},revision=Number(latest.data&&latest.data.revision)||0;
  var merged=JSON.parse(JSON.stringify(latest.data&&latest.data.save_data?remote:base));
  function mergeNumberDelta(key){var oldValue=Number(base[key])||0,newValue=Number(offline[key])||0,delta=newValue-oldValue;if(delta!==0)merged[key]=Math.max(0,(Number(merged[key])||0)+delta)}
  function mergeMapDelta(key){var oldMap=base[key]||{},newMap=offline[key]||{},remoteMap=merged[key]||{};Object.keys(newMap).forEach(function(id){var delta=(Number(newMap[id])||0)-(Number(oldMap[id])||0);if(delta!==0)remoteMap[id]=Math.max(0,(Number(remoteMap[id])||0)+delta)});merged[key]=remoteMap}
  function mergeCountedArray(key){var oldList=Array.isArray(base[key])?base[key]:[],newList=Array.isArray(offline[key])?offline[key]:[],remoteList=Array.isArray(merged[key])?merged[key].slice():[],oldCounts={},newCounts={};oldList.forEach(function(id){var k=typeof id==="string"?id:id&&id.id;if(k)oldCounts[k]=(oldCounts[k]||0)+1});newList.forEach(function(id){var k=typeof id==="string"?id:id&&id.id;if(k)newCounts[k]=(newCounts[k]||0)+1});Object.keys(newCounts).forEach(function(k){var add=newCounts[k]-(oldCounts[k]||0);while(add-->0){var item=newList.find(function(v){return (typeof v==="string"?v:v&&v.id)===k});if(item)remoteList.push(JSON.parse(JSON.stringify(item)))}});Object.keys(oldCounts).forEach(function(k){var remove=(oldCounts[k]||0)-(newCounts[k]||0);while(remove-->0){var at=remoteList.findIndex(function(v){return (typeof v==="string"?v:v&&v.id)===k});if(at>=0)remoteList.splice(at,1)}});merged[key]=remoteList}
  ["coins","treasuryMarks"].forEach(mergeNumberDelta);
  mergeMapDelta("materials");
  mergeCountedArray("bag");
  mergeCountedArray("monsterLoot");
  mergeCountedArray("activePotions");
  var oldGearSlots=base.gear||{},newGearSlots=offline.gear||{},remoteGearSlots=merged.gear||{};
  Object.keys(newGearSlots).forEach(function(slot){if(newGearSlots[slot]!==oldGearSlots[slot])remoteGearSlots[slot]=newGearSlots[slot]});
  merged.gear=remoteGearSlots;
  ["upgrades","treasuryUpgrades"].forEach(mergeMapDelta);
  var oldRelics=Array.isArray(base.relics)?base.relics:[],newRelics=Array.isArray(offline.relics)?offline.relics:[];
  merged.relics=Array.isArray(merged.relics)?merged.relics:[];
  newRelics.forEach(function(id){if(oldRelics.indexOf(id)<0&&merged.relics.indexOf(id)<0)merged.relics.push(id)});
  var oldEngine=base.activityEngine||{},newEngine=offline.activityEngine||{},serverEngine=merged.activityEngine||{};
  var skillIds=Object.keys(newEngine.skills||{});
  merged.activityEngine=JSON.parse(JSON.stringify(serverEngine));
  merged.activityEngine.skills=merged.activityEngine.skills||{};
  skillIds.forEach(function(id){
   var oldXp=Number(oldEngine.skills&&oldEngine.skills[id]&&oldEngine.skills[id].xp)||0;
   var newXp=Number(newEngine.skills&&newEngine.skills[id]&&newEngine.skills[id].xp)||0;
   var targetSkill=merged.activityEngine.skills[id]||{};
   targetSkill.xp=Math.max(0,Number(targetSkill.xp)||0)+Math.max(0,newXp-oldXp);
   merged.activityEngine.skills[id]=targetSkill;
  });
  if(newEngine.active)merged.activityEngine.active=JSON.parse(JSON.stringify(newEngine.active));
  else if(oldEngine.active)merged.activityEngine.active=null;
  merged.activityEngine.version=1;
  var oldCombat=base.rpgCombat||{},newCombat=offline.rpgCombat||{},remoteCombat=merged.rpgCombat||{};
  if(newCombat.inventory&&newCombat.inventory.materials){
   remoteCombat.inventory=remoteCombat.inventory||{};remoteCombat.inventory.materials=remoteCombat.inventory.materials||{};
   Object.keys(newCombat.inventory.materials).forEach(function(id){
    var delta=(Number(newCombat.inventory.materials[id])||0)-(Number(oldCombat.inventory&&oldCombat.inventory.materials&&oldCombat.inventory.materials[id])||0);
    if(delta!==0)remoteCombat.inventory.materials[id]=Math.max(0,(Number(remoteCombat.inventory.materials[id])||0)+delta);
   });
   remoteCombat.inventory.gear=Array.isArray(remoteCombat.inventory.gear)?remoteCombat.inventory.gear:[];
   var oldGear=oldCombat.inventory&&Array.isArray(oldCombat.inventory.gear)?oldCombat.inventory.gear:[];
   var newGear=Array.isArray(newCombat.inventory.gear)?newCombat.inventory.gear:[];
   newGear.forEach(function(id){if(oldGear.indexOf(id)<0&&remoteCombat.inventory.gear.indexOf(id)<0)remoteCombat.inventory.gear.push(id)});
   remoteCombat.inventory.potions=Math.max(0,(Number(remoteCombat.inventory.potions)||0)+(Number(newCombat.inventory.potions)||0)-(Number(oldCombat.inventory&&oldCombat.inventory.potions)||0));
   if(Number.isFinite(Number(newCombat.stamina))){var staminaDelta=(Number(newCombat.stamina)||0)-(Number(oldCombat.stamina)||0);var staminaMax=Math.max(0,Number(remoteCombat.maxStamina)||Number(newCombat.maxStamina)||100);remoteCombat.stamina=Math.max(0,Math.min(staminaMax,(Number(remoteCombat.stamina)||0)+staminaDelta));}
   remoteCombat.inventory.consumables=remoteCombat.inventory.consumables||{};
   var oldConsumables=oldCombat.inventory&&oldCombat.inventory.consumables||{},newConsumables=newCombat.inventory.consumables||{};
   Object.keys(newConsumables).forEach(function(id){
    var delta=(Number(newConsumables[id])||0)-(Number(oldConsumables[id])||0);
    if(delta!==0)remoteCombat.inventory.consumables[id]=Math.max(0,(Number(remoteCombat.inventory.consumables[id])||0)+delta);
   });
  }
  var oldCombatGear=oldCombat.equipment||{},newCombatGear=newCombat.equipment||{},remoteCombatGear=remoteCombat.equipment||{};
  Object.keys(newCombatGear).forEach(function(slot){if(newCombatGear[slot]!==oldCombatGear[slot])remoteCombatGear[slot]=newCombatGear[slot]});
  remoteCombat.equipment=remoteCombatGear;
  remoteCombat.upgrades=remoteCombat.upgrades||{};
  var oldCombatUpgrades=oldCombat.upgrades||{},newCombatUpgrades=newCombat.upgrades||{};
  Object.keys(newCombatUpgrades).forEach(function(id){var delta=(Number(newCombatUpgrades[id])||0)-(Number(oldCombatUpgrades[id])||0);if(delta!==0)remoteCombat.upgrades[id]=Math.max(0,(Number(remoteCombat.upgrades[id])||0)+delta)});
  remoteCombat.inventory.lootBoxes=Math.max(0,(Number(remoteCombat.inventory.lootBoxes)||0)+(Number(newCombat.inventory&&newCombat.inventory.lootBoxes)||0)-(Number(oldCombat.inventory&&oldCombat.inventory.lootBoxes)||0));
  merged.rpgCombat=remoteCombat;
  // Merge only newly recorded economy events from the offline save. The
  // underlying currency and inventory deltas retain their existing owners.
  var oldLedger=base.economyLedger||{},newLedger=offline.economyLedger||{},remoteLedger=merged.economyLedger||{};
  var oldLedgerIds={};
  (oldLedger.entries||[]).forEach(function(entry){if(entry&&entry.id)oldLedgerIds[entry.id]=true});
  var ledgerEntries=Array.isArray(remoteLedger.entries)?remoteLedger.entries.slice():[];
  var knownLedgerIds={};
  ledgerEntries.forEach(function(entry){if(entry&&entry.id)knownLedgerIds[entry.id]=true});
  (newLedger.entries||[]).forEach(function(entry){if(entry&&entry.id&&!oldLedgerIds[entry.id]&&!knownLedgerIds[entry.id]){ledgerEntries.push(entry);knownLedgerIds[entry.id]=true}});
  ledgerEntries.sort(function(a,b){return (Number(a.at)||0)-(Number(b.at)||0)});
  merged.economyLedger={version:1,entries:ledgerEntries.slice(-100)};
  var now=new Date().toISOString(),write;
  if(revision===0)write=await client.from("player_saves").insert({user_id:target.id,save_data:merged,revision:1,updated_at:now}).select("revision").maybeSingle();
  else write=await client.from("player_saves").update({save_data:merged,revision:revision+1,updated_at:now}).eq("user_id",target.id).eq("revision",revision).select("revision").maybeSingle();
  if(write.error)throw write.error;
  if(write.data){
   saveRevision=Number(write.data.revision)||revision+1;initialSave=merged;mode="account";
   localStorage.setItem(OFFLINE_SAVE_PREFIX+target.id,JSON.stringify(merged));
   localStorage.setItem(OFFLINE_BASE_PREFIX+target.id,JSON.stringify(merged));
   window.dispatchEvent(new CustomEvent("duo:offline-sync-complete"));
   return true;
  }
 }
 throw new Error("Offline activity sync is waiting for a newer server save. Your local progress remains safe.");
 }finally{offlineSyncInFlight=false;}
}
window.addEventListener("offline",function(){if(user)mode="account-offline"});
window.addEventListener("online",function(){syncOfflineActivity().catch(function(e){console.warn("Duo Dungeon offline activity sync deferred:",e.message)})});
window.addEventListener("focus",function(){if(mode==="account-offline")syncOfflineActivity().catch(function(e){console.warn("Duo Dungeon offline activity sync deferred:",e.message)})});
window.setInterval(function(){if(navigator.onLine&&mode==="account-offline")syncOfflineActivity().catch(function(e){console.warn("Duo Dungeon offline activity sync deferred:",e.message)})},30000);
async function boot(){
 try{
  if(!window.supabase||!window.supabase.createClient)throw new Error("The account service did not load. Refresh and try again.");
  var recoveryUrl=new URLSearchParams(location.search).get("resetPassword")==="1"||new URLSearchParams(location.hash.replace(/^#/,"")).get("type")==="recovery";
  client=window.supabase.createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  // Handle recovery links even when the redirect URL flag is missing or the
  // recovery session is established after the initial page load.
  client.auth.onAuthStateChange(function(event,session){
   if(event==="PASSWORD_RECOVERY")enterPasswordRecovery(session);
  });
  var session=await client.auth.getSession();if(session.error)throw session.error;
  if(recoveryHandled)return;
  if(recoveryUrl&&session.data.session){enterPasswordRecovery(session.data.session);return}
  if(session.data.session){var lastActivity=readLastActivity();if(lastActivity&&Date.now()-lastActivity>=IDLE_LIMIT){await client.auth.signOut({scope:"local"});try{localStorage.removeItem(IDLE_KEY)}catch(e){}mode="pending";root.classList.remove("hidden");configureDevLogin("Your session ended after one hour without activity. Sign in again to continue.");resolveReady();return}await loadAccount(session.data.session.user)}else{mode="pending";if(DEV_PREVIEW)configureDevLogin("Private Development build. Sign in with the authorized developer account.");root.classList.remove("hidden")}
 }catch(e){if(typeof session!=="undefined"&&session&&session.data&&session.data.session&&activateOfflineAccount(session.data.session)){console.warn("Duo Dungeon entered offline account mode:",e.message);return}mode="guest";initialSave=null;configureDevLogin("Account service unavailable: "+e.message+". Sign-in is still available; try again when the account service recovers.");root.classList.remove("hidden");if(!DEV_PREVIEW)message("Account service unavailable: "+e.message+". You can still continue as a guest.");resolveReady()}
}
boot();
})();