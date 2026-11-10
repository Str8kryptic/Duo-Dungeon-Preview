import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve('android/app/build/intermediates/merged_manifest');
if (!existsSync(root)) throw new Error('Merged Android manifest directory was not found after the APK build.');

const manifests = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && entry.name === 'AndroidManifest.xml') manifests.push(path);
  }
}
walk(root);
if (!manifests.length) throw new Error('No merged Android manifest was found.');

const permissions = new Set();
for (const path of manifests) {
  const xml = readFileSync(path, 'utf8');
  for (const match of xml.matchAll(/android:name=["'](android\.permission\.health\.[A-Z_]+)["']/g)) {
    permissions.add(match[1]);
  }
}
const expected = 'android.permission.health.READ_STEPS';
const actual = [...permissions].sort();
if (actual.length !== 1 || actual[0] !== expected) {
  throw new Error('Unexpected Health Connect permissions in merged manifest: ' + actual.join(', '));
}
console.log('Verified least-privilege Health Connect manifest: READ_STEPS only.');
