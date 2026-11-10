(function () {
  "use strict";

  var capacitor = window.Capacitor;
  var nativeAndroid = !!(capacitor && capacitor.isNativePlatform && capacitor.isNativePlatform()
    && capacitor.getPlatform && capacitor.getPlatform() === "android");
  var plugin = nativeAndroid && capacitor.registerPlugin
    ? capacitor.registerPlugin("Health")
    : null;

  async function requirePlugin() {
    if (!nativeAndroid || !plugin) {
      throw new Error("Android Health Connect is available only in the Duo Dungeon Android app.");
    }
    if (capacitor.isPluginAvailable && !capacitor.isPluginAvailable("Health")) {
      throw new Error("The Android Health Connect module is not installed in this build. Update the Development app and try again.");
    }
  }

  async function status() {
    if (!nativeAndroid || !plugin) {
      return { available: false, authorized: false, nativeAndroid: false, reason: "Open Duo Dungeon in the Android app to connect Health Connect." };
    }
    try {
      await requirePlugin();
      var availability = await plugin.isAvailable();
      if (!availability || !availability.available) {
        return { available: false, authorized: false, nativeAndroid: true, reason: availability && availability.reason || "Health Connect is unavailable or needs an update." };
      }
      var permission = await plugin.checkAuthorization({ read: ["steps"], write: [] });
      var authorized = !!(permission && Array.isArray(permission.readAuthorized) && permission.readAuthorized.indexOf("steps") >= 0);
      return { available: true, authorized: authorized, nativeAndroid: true, reason: authorized ? "" : "Allow Duo Dungeon to read your step total in Health Connect." };
    } catch (error) {
      return { available: false, authorized: false, nativeAndroid: true, reason: error && error.message || "Could not check Health Connect." };
    }
  }

  async function connect() {
    await requirePlugin();
    var availability = await plugin.isAvailable();
    if (!availability || !availability.available) {
      throw new Error(availability && availability.reason || "Health Connect is unavailable. Install or update it, then try again.");
    }
    var permission = await plugin.requestAuthorization({ read: ["steps"], write: [] });
    var authorized = !!(permission && Array.isArray(permission.readAuthorized) && permission.readAuthorized.indexOf("steps") >= 0);
    if (!authorized) throw new Error("Step access was not granted. You can enable it later in Health Connect settings.");
    return status();
  }

  async function today() {
    await requirePlugin();
    var permission = await plugin.checkAuthorization({ read: ["steps"], write: [] });
    if (!permission || !Array.isArray(permission.readAuthorized) || permission.readAuthorized.indexOf("steps") < 0) {
      throw new Error("Health Connect step permission is missing or was revoked. Reconnect to continue.");
    }
    var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var result = await plugin.queryAggregated({
      dataType: "steps",
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      bucket: "day",
      aggregation: "sum"
    });
    var samples = result && Array.isArray(result.samples) ? result.samples : [];
    var total = samples.reduce(function (sum, sample) {
      var value = sample && sample.values && Number.isFinite(Number(sample.values.sum))
        ? Number(sample.values.sum)
        : Number(sample && sample.value || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    return {
      total: Math.max(0, Math.floor(total)),
      date: now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0"),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  async function showPrivacyPolicy() {
    await requirePlugin();
    return plugin.showPrivacyPolicy();
  }

  async function openSettings() {
    await requirePlugin();
    return plugin.openHealthConnectSettings();
  }

  window.DUO_HEALTH_CONNECT = {
    isNativeAndroid: nativeAndroid,
    status: status,
    connect: connect,
    today: today,
    showPrivacyPolicy: showPrivacyPolicy,
    openSettings: openSettings
  };
})();
