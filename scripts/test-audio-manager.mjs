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
