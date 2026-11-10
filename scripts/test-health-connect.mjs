import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../health-connect.js', import.meta.url), 'utf8');
let authorized = false;
let authorizationOptions = null;
let aggregateOptions = null;
const plugin = {
  async isAvailable() { return { available: true }; },
  async checkAuthorization() { return { readAuthorized: authorized ? ['steps'] : [], readDenied: authorized ? [] : ['steps'], writeAuthorized: [], writeDenied: [] }; },
  async requestAuthorization(options) {
    authorizationOptions = options;
    authorized = true;
    return { readAuthorized: ['steps'], readDenied: [], writeAuthorized: [], writeDenied: [] };
  },
  async queryAggregated(options) {
    aggregateOptions = options;
    return { samples: [{ value: 1250, values: { sum: 1250 } }, { value: 375, values: { sum: 375 } }] };
  },
  async showPrivacyPolicy() { return true; },
  async openHealthConnectSettings() { return true; },
};
const window = {
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'android',
    isPluginAvailable: (name) => name === 'Health',
    registerPlugin: (name) => { assert.equal(name, 'Health'); return plugin; },
  },
};
runInNewContext(source, { window, Intl, Date, Number, Math, String, Error, Promise });
const health = window.DUO_HEALTH_CONNECT;
assert.equal(health.isNativeAndroid, true);
let status = await health.status();
assert.equal(status.available, true);
assert.equal(status.authorized, false);
status = await health.connect();
assert.equal(status.authorized, true);
assert.deepEqual(JSON.parse(JSON.stringify(authorizationOptions)), { read: ['steps'], write: [] });
const reading = await health.today();
assert.equal(reading.total, 1625);
assert.match(reading.date, /^\\d{4}-\\d{2}-\\d{2}$/);
assert.equal(typeof reading.timeZone, 'string');
assert.equal(aggregateOptions.dataType, 'steps');
assert.equal(aggregateOptions.bucket, 'day');
assert.equal(aggregateOptions.aggregation, 'sum');
assert.equal(new Date(aggregateOptions.startDate).getHours(), 0);
console.log('Health Connect bridge tests passed: Android-only, READ_STEPS only, daily aggregate, local date/time zone.');

const browserWindow = { Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' } };
runInNewContext(source, { window: browserWindow, Intl, Date, Number, Math, String, Error, Promise });
const browserStatus = await browserWindow.DUO_HEALTH_CONNECT.status();
assert.equal(browserStatus.nativeAndroid, false);
assert.equal(browserStatus.available, false);
console.log('Browser guard test passed: web pages cannot request Health Connect access.');
