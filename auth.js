(function(){
"use strict";
var PROJECT_URL="https://cbndsdcotvnfkhfjrxst.supabase.co",PUBLISHABLE_KEY="sb_publishable_u3ynHgfpCFq0EVEbmnLufQ_s7C-_rwj";
var SAVE_KEY="duo-dungeon-save-v2",CLAIM_KEY="duo-dungeon-claim-guest",client=null,user=null,mode="pending",initialSave=null,crawlerNumber=null,resolveReady,staySignedIn=true;
var ready=new Promise(function(resolve){resolveReady=resolve});
var root=document.createElement("div");root.className="auth-overlay";root.id="auth-overlay";
root.innerHTML='<section class="auth-card"><h1 class="auth-title">DUO DUNGEON</h1><p class="auth-sub">YOUR NEXT QUESTIONABLE DECISION AWAITS</p><div class="auth-buttons"><button type="button" data-mode="signup" class="active">CREATE ACCOUNT</button><button type="button" data-mode="login">LOG IN</button></div><form id="auth-form"><label for="auth-email">EMAIL ADDRESS</label><input id="auth-email" type="email" autocomplete="email" required placeholder="crawler@example.com"><label for="auth-password">PASSWORD</label><input id="auth-password" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"><label class="stay-label"><input id="stay-signed-in" type="checkbox" checked> <span><b>Stay signed in on this device</b><small>Uncheck on a shared or public device.</small></span></label><button class="auth-wide primary" id="auth-submit" type="submit">CREATE ACCOUNT</button></form><p class="auth-message" id="auth-message">Create an account to protect your crawler, or enter as a guest.</p><div class="auth-divider">OR</div><button type="button" class="auth-wide" id="guest-button">CONTINUE AS GUEST</button><button type="button" class="auth-wide" id="auth-back" style="display:none">BACK TO GAME</button><button type="button" class="auth-wide" id="auth-signout" style="display:none">SIGN OUT</button><p class="auth-small">Guest progress stays on this device until you create an account.</p></section>';
document.body.appendChild(root);
var form=root.querySelector("#auth-form"),msg=root.querySelector("#auth-message"),submit=root.querySelector("#auth-submit"),guest=root.querySelector("#guest-button"),back=root.querySelector("#auth-back"),signout=root.querySelector("#auth-signout"),stay=root.querySelector("#stay-signed-in"),currentMode="signup",busy=false;
function message(t){msg.textContent=t}
function setBusy(v){busy=v;submit.disabled=v;guest.disabled=v;submit.style.opacity=v?".6":"1"}
function readLocal(){try{var x=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function fresh(){return {name:"",number:100000+Math.floor(Math.random()*900000),coins:250,dust:0,folds:0,today:0,xp:0,bag:[],gear:{}}}
async function persist(save){
 if(!user||!client)return;
 var payload=JSON.parse(JSON.stringify(save));
 var result=await client.from("player_saves").upsert({user_id:user.id,save_data:payload,updated_at:new Date().toISOString()},{onConflict:"user_id"});
 if(result.error){console.error("Duo Dungeon save failed:",result.error.message);message("Save warning: "+result.error.message)}
 if(payload.name)await client.from("player_profiles").update({display_name:String(payload.name).slice(0,20),updated_at:new Date().toISOString()}).eq("id",user.id);
}
async function loadAccount(u,afterSignup){
 user=u;mode="account";
 var p=await client.from("player_profiles").select("crawler_number,display_name").eq("id",u.id).single();
 if(p.error)throw p.error;crawlerNumber=p.data.crawler_number;
 var r=await client.from("player_saves").select("save_data").eq("user_id",u.id).maybeSingle();
 if(r.error)throw r.error;
 if(r.data&&r.data.save_data){initialSave=r.data.save_data;localStorage.removeItem(CLAIM_KEY)}
 else{
  var claim=localStorage.getItem(CLAIM_KEY)==="1",guestSave=claim?readLocal():null;
  initialSave=guestSave||fresh();
  if(guestSave&&guestSave.number){
   var up=await client.from("player_profiles").update({crawler_number:guestSave.number,display_name:String(guestSave.name||"NEW CRAWLER").slice(0,20),updated_at:new Date().toISOString()}).eq("id",u.id).select("crawler_number").maybeSingle();
   if(!up.error&&up.data)crawlerNumber=up.data.crawler_number;
  }
  initialSave.number=crawlerNumber;await persist(initialSave);localStorage.removeItem(CLAIM_KEY);
 }
 root.classList.add("hidden");resolveReady();
 if(afterSignup){window.location.href=new URL("setup.html",window.location.href).href;return}
 if(new URLSearchParams(location.search).get("welcome")==="1"){window.location.replace(new URL("setup.html",window.location.href).href);return}
 if(window.__DUO_APP_READY__)window.location.reload();
}
async function finishGuest(){mode="guest";user=null;initialSave=null;root.classList.add("hidden");resolveReady()}
function open(){
 root.classList.remove("hidden");var signed=!!user;
 back.style.display=signed||mode==="guest"?"block":"none";guest.style.display=signed||mode==="guest"?"none":"block";
 signout.style.display=signed?"block":"none";
 if(signed){message("Signed in as "+user.email+". Your progress is saved to your account.");submit.style.display="none";form.style.display="none";root.querySelector(".auth-buttons").style.display="none"}
 else{submit.style.display="block";form.style.display="block";root.querySelector(".auth-buttons").style.display="grid"}
}
window.DUO_AUTH={ready:ready,get user(){return user},get mode(){return mode},get initialSave(){return initialSave},get crawlerNumber(){return crawlerNumber},persist:persist,open:open};
root.querySelectorAll("[data-mode]").forEach(function(b){b.addEventListener("click",function(){currentMode=b.dataset.mode;root.querySelectorAll("[data-mode]").forEach(function(x){x.classList.toggle("active",x===b)});submit.textContent=currentMode==="signup"?"CREATE ACCOUNT":"LOG IN";root.querySelector("#auth-password").autocomplete=currentMode==="signup"?"new-password":"current-password";message(currentMode==="signup"?"Choose an email and password. We'll send a confirmation email if verification is enabled.":"Welcome back, crawler. Enter your credentials.")})});
stay.addEventListener("change",function(){staySignedIn=!!stay.checked});guest.addEventListener("click",finishGuest);back.addEventListener("click",function(){root.classList.add("hidden")});
signout.addEventListener("click",async function(){if(client){await client.auth.signOut()}user=null;mode="pending";window.location.reload()});
form.addEventListener("submit",async function(e){
 e.preventDefault();if(busy||!client)return;var email=root.querySelector("#auth-email").value.trim(),password=root.querySelector("#auth-password").value;setBusy(true);message("Contacting the dungeon registrar…");
 try{
  if(currentMode==="signup"){
   if(readLocal())localStorage.setItem(CLAIM_KEY,"1");
   var signup=await client.auth.signUp({email:email,password:password,options:{emailRedirectTo:new URL("./?welcome=1",window.location.href).href}});
   if(signup.error)throw signup.error;
   if(signup.data.session){await loadAccount(signup.data.user,true)}
   else{message("Check your email to confirm your account. Your guest progress will be claimed when you return and log in on this device.")}
  }else{var login=await client.auth.signInWithPassword({email:email,password:password});if(login.error)throw login.error;await loadAccount(login.data.user)}
 }catch(err){message(err&&err.message?err.message:"Authentication failed. Please try again.")}finally{setBusy(false)}
});
async function boot(){
 try{
  if(!window.supabase||!window.supabase.createClient)throw new Error("The account service did not load. Refresh and try again.");
  client=window.supabase.createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:{getItem:function(k){return (staySignedIn?localStorage:sessionStorage).getItem(k)},setItem:function(k,v){(staySignedIn?localStorage:sessionStorage).setItem(k,v)},removeItem:function(k){localStorage.removeItem(k);sessionStorage.removeItem(k)}}}});
  var session=await client.auth.getSession();if(session.error)throw session.error;
  if(session.data.session){await loadAccount(session.data.session.user)}else{mode="pending";root.classList.remove("hidden")}
 }catch(e){mode="guest";initialSave=null;root.classList.remove("hidden");message("Account service unavailable: "+e.message+". You can still continue as a guest.");resolveReady()}
}
boot();
})();