(function(){
"use strict";
if(window.__DUO_BACK_NAV__)return;window.__DUO_BACK_NAV__=true;
var stack=[],current={page:"home",facility:""},root=document.getElementById("app");
function routeKey(r){return r.page+"|"+(r.facility||"")}
function button(label,kind){var b=document.createElement("button");b.type="button";b.className="duo-back-button "+kind;b.setAttribute("data-duo-back","");b.setAttribute("aria-label","Go back");b.textContent="← "+label;return b}
function goRoute(r){if(!r)return;if(r.page==="facility"){var f=document.querySelector('[data-fac="'+CSS.escape(r.facility)+'"]');if(f){f.click();return}}var p=document.querySelector('.main-nav [data-page="'+CSS.escape(r.page)+'"]');if(p){p.click();return}var home=document.querySelector('.main-nav [data-page="home"]');if(home)home.click()}
function pushRoute(next){if(routeKey(next)===routeKey(current))return;stack.push({page:current.page,facility:current.facility});current=next}
document.addEventListener("click",function(e){
 var p=e.target.closest("[data-page]");if(p){pushRoute({page:p.dataset.page,facility:""});return}
 var f=e.target.closest("[data-fac]");if(f){pushRoute({page:"facility",facility:f.dataset.fac});return}
},true);
function backFromPage(){var previous=stack.pop();if(previous){current=previous;goRoute(previous)}else{current={page:"home",facility:""};goRoute(current)}}
function ensurePageBack(){
 if(!root)return;var isHome=routeKey(current)==="home|";var old=root.querySelector(":scope > .duo-page-backbar");if(isHome){if(old)old.remove();return}
 if(old)return;var bar=document.createElement("div");bar.className="duo-page-backbar";var b=button("BACK","page");b.addEventListener("click",backFromPage);bar.appendChild(b);root.insertBefore(bar,root.firstChild);
}
function ensureDialogBack(dialog){
 if(!dialog||!dialog.open||dialog.querySelector("[data-duo-back]"))return;
 var b=button("BACK","dialog");b.addEventListener("click",function(){if(dialog.open&&typeof dialog.close==="function")dialog.close();else dialog.removeAttribute("open")});
 dialog.appendChild(b);
}
function ensureOverlayBack(el){
 if(!el||el.querySelector("[data-duo-back]"))return;
 var b=button("BACK","overlay");b.addEventListener("click",function(){el.remove()});el.appendChild(b);
}
function scan(){
 if(root){ensurePageBack()}
 document.querySelectorAll("dialog[open]").forEach(ensureDialogBack);
 ["#section-guide-popover","#first-descent-panel"].forEach(function(sel){var el=document.querySelector(sel);if(el)ensureOverlayBack(el)});
}
var observer=new MutationObserver(scan);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["open"]});
document.addEventListener("duo:page-rendered",scan);window.addEventListener("pageshow",scan);scan();
window.DUO_BACK_NAV={back:backFromPage,scan:scan};
})();