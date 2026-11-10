import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const output = join(root, 'www');
const webExtensions = new Set([
  '.html', '.js', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg',
  '.webp', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf'
]);
const assetDirectories = new Set(['assets', 'images', 'fonts', 'icons']);
const excludedDirectories = new Set([
  '.git', '.github', 'node_modules', 'www', 'android', 'ios', 'scripts'
]);

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

console.log('Prepared Duo Dungeon web bundle in ./www');
