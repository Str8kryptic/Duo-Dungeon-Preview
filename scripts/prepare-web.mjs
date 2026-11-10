import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const output = join(root, 'www');
const capacitorRuntime = join(root, 'node_modules/@capacitor/core/dist/capacitor.js');
const webExtensions = new Set([
  '.html', '.js', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg',
  '.webp', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf'
]);
const assetDirectories = new Set(['assets', 'images', 'fonts', 'icons']);

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.isDirectory()) {
    if (assetDirectories.has(entry.name) && existsSync(join(root, entry.name))) {
      cpSync(join(root, entry.name), join(output, entry.name), { recursive: true });
    }
    continue;
  }

  if (!entry.isFile() || entry.name === 'package.json' || entry.name.endsWith('.lock')) continue;
  if (webExtensions.has(extname(entry.name).toLowerCase())) {
    cpSync(join(root, entry.name), join(output, entry.name));
  }
}

if (!existsSync(join(output, 'index.html'))) {
  throw new Error('Web bundle is missing index.html; refusing to create an incomplete Android app.');
}

for (const required of ['app.js', 'auth.js', 'game-data.js', 'styles.css']) {
  if (!existsSync(join(output, required))) {
    throw new Error('Web bundle is missing required file: ' + required);
  }
}

if (!existsSync(capacitorRuntime)) {
  throw new Error('Capacitor runtime is missing; install dependencies before preparing the Android web bundle.');
}
cpSync(capacitorRuntime, join(output, 'capacitor.js'));

const bundledIndex = join(output, 'index.html');
let bundledHtml = readFileSync(bundledIndex, 'utf8');
const healthBridgeTag = '<script src="health-connect.js?v=20261110androidhealthconnect1"></script>';
if (!bundledHtml.includes(healthBridgeTag)) {
  throw new Error('Android bundle is missing the Health Connect bridge script tag.');
}
if (!bundledHtml.includes('<script src="capacitor.js"></script>')) {
  bundledHtml = bundledHtml.replace(healthBridgeTag, '<script src="capacitor.js"></script>\\n' + healthBridgeTag);
}
writeFileSync(bundledIndex, bundledHtml);

console.log('Prepared Duo Dungeon web bundle in ./www');
