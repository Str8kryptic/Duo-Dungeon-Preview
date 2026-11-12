(function () {
  "use strict";
  if (window.DUO_AUDIO) return;

  var MANIFEST_URL = "https://xuxwwpfeenaaxzfspiiq.supabase.co/storage/v1/object/public/game-audio/manifests/audio-manifest.json";
  var PREF_KEY = "duo-dungeon-audio-v1";
  var prefs = { enabled: true, volume: 0.35 };
  try {
    var saved = JSON.parse(localStorage.getItem(PREF_KEY) || "null");
    if (saved && typeof saved.enabled === "boolean") prefs.enabled = saved.enabled;
    if (saved && Number.isFinite(Number(saved.volume))) prefs.volume = Math.max(0, Math.min(1, Number(saved.volume)));
  } catch (error) {}

  var audio = new Audio();
  audio.preload = "none";
  audio.loop = true;
  audio.volume = prefs.volume;
  audio.setAttribute("playsinline", "");
  var tracks = {};
  var currentKey = "";
  var unlocked = false;
  var manifestReady = false;
  var panel;
  var status;

  function persist() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (error) {}
    updateControls();
  }
  function updateControls() {
    if (!panel) return;
    var toggle = panel.querySelector("[data-audio-toggle]");
    var slider = panel.querySelector("[data-audio-volume]");
    var label = panel.querySelector("[data-audio-label]");
    if (toggle) {
      toggle.textContent = prefs.enabled ? "♫ Music on" : "♫ Music off";
      toggle.setAttribute("aria-pressed", String(prefs.enabled));
    }
    if (slider) slider.value = String(Math.round(prefs.volume * 100));
    if (label) label.textContent = tracks[currentKey] ? tracks[currentKey].title : "Dungeon soundtrack";
    if (status) status.textContent = !manifestReady ? "Loading soundtrack…" : (prefs.enabled ? (unlocked ? "Ready" : "Tap to begin") : "Muted");
  }
  function fadeTo(target, duration, done) {
    var start = audio.volume;
    var began = performance.now();
    function step(now) {
      var t = Math.min(1, (now - began) / duration);
      audio.volume = start + (target - start) * t;
      if (t < 1) requestAnimationFrame(step);
      else if (done) done();
    }
    requestAnimationFrame(step);
  }
  function play(key) {
    var track = tracks[key];
    if (!track || !prefs.enabled || !unlocked) return;
    if (currentKey === key && !audio.paused) return;
    var wasPlaying = !audio.paused;
    function start() {
      currentKey = key;
      audio.src = track.publicUrl;
      audio.load();
      var seek = function () {
        audio.removeEventListener("loadedmetadata", seek);
        var offset = Number(track.startOffsetSeconds) || 0;
        if (offset > 0 && Number.isFinite(audio.duration) && offset < audio.duration) {
          try { audio.currentTime = offset; } catch (error) {}
        }
        audio.volume = wasPlaying ? 0 : prefs.volume;
        var result = audio.play();
        if (result && typeof result.then === "function") {
          result.then(function () { if (wasPlaying) fadeTo(prefs.volume, 900); updateControls(); })
            .catch(updateControls);
        }
      };
      audio.addEventListener("loadedmetadata", seek, { once: true });
    }
    if (wasPlaying) fadeTo(0, 500, start);
    else start();
    updateControls();
  }
  function detectTrack() {
    var active = document.querySelector(".main-nav [data-page].active");
    var page = active && active.getAttribute("data-page");
    var text = ((document.querySelector("#app") || document.body).innerText || "").toLowerCase();
    if (!page && /login|sign in|create account|forgot password/.test(text)) return "login";
    if (page === "facilities") {
      var facilityMap = [
        ["goblin exchange", "exchange"], ["ember forge", "forge"],
        ["veiled apothecary", "apothecary"], ["companion sanctuary", "companions"],
        ["relic archive", "archive"], ["warden armory", "armory"],
        ["step treasury", "treasury"], ["crawler vault", "vault"]
      ];
      for (var i = 0; i < facilityMap.length; i++) {
        if (text.indexOf(facilityMap[i][0]) !== -1) return facilityMap[i][1];
      }
    }
    return page ? "exploration" : "login";
  }
  function syncTrack() {
    var next = detectTrack();
    if (next !== currentKey && unlocked && prefs.enabled) play(next);
  }
  function loadManifest() {
    return fetch(MANIFEST_URL, { cache: "no-cache" }).then(function (response) {
      if (!response.ok) throw new Error("Audio manifest request failed: " + response.status);
      return response.json();
    }).then(function (manifest) {
      if (!manifest || !Array.isArray(manifest.tracks)) throw new Error("Audio manifest is invalid");
      manifest.tracks.forEach(function (entry) {
        if (!entry || !entry.id || !entry.playback || !/^https:\/\//.test(entry.publicUrl || "")) return;
        tracks[entry.playback] = {
          id: entry.id,
          title: entry.title || entry.id,
          publicUrl: entry.publicUrl,
          startOffsetSeconds: entry.startOffsetSeconds || 0
        };
      });
      manifestReady = true;
      updateControls();
      if (unlocked && prefs.enabled) play(detectTrack());
    }).catch(function (error) {
      manifestReady = false;
      if (status) status.textContent = "Soundtrack unavailable";
      console.error("[DUO_AUDIO] Manifest load failed", error);
    });
  }
  function buildControls() {
    if (document.getElementById("duo-audio-controls")) return;
    var style = document.createElement("style");
    style.textContent = "#duo-audio-controls{position:fixed;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:9998;display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid rgba(193,155,94,.5);border-radius:12px;background:rgba(16,12,22,.94);color:#ead8b4;box-shadow:0 8px 28px #0008;font:12px/1.2 system-ui,sans-serif;max-width:min(94vw,340px)}#duo-audio-controls button{border:1px solid #947344;border-radius:8px;background:#211927;color:#f2dfbd;padding:8px 10px;font:inherit}#duo-audio-controls label{display:flex;align-items:center;gap:5px}#duo-audio-controls input{width:74px;accent-color:#c49a58}#duo-audio-controls [data-audio-label]{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@media(max-width:420px){#duo-audio-controls{right:8px;bottom:calc(8px + env(safe-area-inset-bottom));gap:6px;padding:6px}#duo-audio-controls [data-audio-label]{display:none}}";
    document.head.appendChild(style);
    panel = document.createElement("div");
    panel.id = "duo-audio-controls";
    panel.innerHTML = '<button type="button" data-audio-toggle aria-label="Toggle dungeon music">♫ Music on</button><span data-audio-label>Dungeon soundtrack</span><label aria-label="Music volume">◖<input data-audio-volume type="range" min="0" max="100" step="1" value="35"></label><span data-audio-status></span>';
    document.body.appendChild(panel);
    status = panel.querySelector("[data-audio-status]");
    panel.querySelector("[data-audio-toggle]").addEventListener("click", function () {
      unlocked = true;
      if (prefs.enabled) {
        prefs.enabled = false;
        fadeTo(0, 300, function () { audio.pause(); });
      } else {
        prefs.enabled = true;
        audio.volume = prefs.volume;
        play(currentKey || detectTrack());
      }
      persist();
    });
    panel.querySelector("[data-audio-volume]").addEventListener("input", function (event) {
      prefs.volume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
      audio.volume = prefs.volume;
      persist();
    });
    updateControls();
  }
  window.DUO_AUDIO = {
    tracks: tracks,
    play: play,
    stop: function () { audio.pause(); currentKey = ""; updateControls(); },
    setEnabled: function (enabled) {
      prefs.enabled = !!enabled;
      if (!prefs.enabled) fadeTo(0, 300, function () { audio.pause(); });
      else if (unlocked) play(currentKey || detectTrack());
      persist();
    },
    setVolume: function (value) {
      prefs.volume = Math.max(0, Math.min(1, Number(value)));
      audio.volume = prefs.volume;
      persist();
    },
    getState: function () {
      return { enabled: prefs.enabled, volume: prefs.volume, track: currentKey, unlocked: unlocked, manifestReady: manifestReady };
    }
  };
  document.addEventListener("pointerdown", function () {
    if (unlocked) return;
    unlocked = true;
    if (prefs.enabled && manifestReady) play(detectTrack());
    updateControls();
  }, { once: true, passive: true });
  document.addEventListener("keydown", function () {
    if (unlocked) return;
    unlocked = true;
    if (prefs.enabled && manifestReady) play(detectTrack());
    updateControls();
  }, { once: true });
  document.addEventListener("click", function (event) {
    if (event.target.closest && event.target.closest(".main-nav [data-page]")) setTimeout(syncTrack, 100);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) audio.pause();
    else if (prefs.enabled && currentKey && unlocked) play(currentKey);
  });
  audio.addEventListener("error", updateControls);
  buildControls();
  loadManifest();
  var observer = new MutationObserver(syncTrack);
  var root = document.getElementById("app");
  if (root) observer.observe(root, { childList: true, subtree: true, characterData: true });
  var nav = document.querySelector(".main-nav");
  if (nav) observer.observe(nav, { attributes: true, subtree: true, attributeFilter: ["class"] });
  syncTrack();
})();