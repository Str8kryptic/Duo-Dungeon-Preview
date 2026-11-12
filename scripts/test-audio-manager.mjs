import assert from "node:assert/strict";
import fs from "node:fs";

const manager = fs.readFileSync(new URL("../audio-manager.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(manager, /game-audio\/manifests\/audio-manifest\.json/);
assert.match(manager, /entry\.publicUrl/);
assert.match(manager, /entry\.playback/);
assert.match(manager, /startOffsetSeconds/);
assert.match(manager, /new Audio\(\)/);
assert.match(manager, /audio\.loop\s*=\s*true/);
assert.match(manager, /visibilitychange/);
assert.match(manager, /localStorage/);
assert.match(manager, /new MutationObserver/);
assert.match(html, /audio-manager\.js/);
console.log("Supabase audio manifest integration checks passed.");

const playFunction = manager.slice(manager.indexOf("function play(key)"), manager.indexOf("function detectTrack()"));
assert.match(playFunction, /audio\.addEventListener\("loadedmetadata", seek, \{ once: true \}\);[\s\S]*?audio\.load\(\);[\s\S]*?var result = audio\.play\(\);/);
assert.match(manager, /authOverlay && !authOverlay\.classList\.contains\("hidden"\)/);
assert.match(manager, /observer\.observe\(authOverlay/);

const auth = fs.readFileSync(new URL("../auth.js", import.meta.url), "utf8");
assert.doesNotMatch(auth, /id="stay-signed-in"/);
assert.doesNotMatch(auth, /staySignedIn/);
assert.match(auth, /getItem:function\(k\)\{return sessionStorage\.getItem\(k\)\}/);
assert.match(auth, /setItem:function\(k,v\)\{sessionStorage\.setItem\(k,v\)\}/);
assert.match(manager, /function attemptAutoplay\(\)/);
assert.match(manager, /event\.target\.id === "auth-email"/);
assert.match(manager, /unlocked = false;[\s\S]*?Playback was blocked/);
console.log("Session-only auth and browser autoplay fallback checks passed.");
