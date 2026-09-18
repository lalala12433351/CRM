/**
 * Copies the durable multi-tenant JSON store into dist/.data so
 * `npm run build:local` / deploy bundles ship with CRM data.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const candidates = [
  path.join(process.env.LOCALAPPDATA || '', 'PixbeCrm', 'data', 'multi_tenant_store.json'),
  path.join(root, '.data', 'multi_tenant_store.json'),
].filter((p) => p && fs.existsSync(p));

if (!candidates.length) {
  console.warn('[copy-store-to-dist] No multi_tenant_store.json found — skipping');
  process.exit(0);
}

let source = candidates[0];
let bestMtime = 0;
for (const p of candidates) {
  try {
    const m = fs.statSync(p).mtimeMs;
    if (m >= bestMtime) {
      bestMtime = m;
      source = p;
    }
  } catch {}
}

const destDir = path.join(root, 'dist', '.data');
const dest = path.join(destDir, 'multi_tenant_store.json');
const repoDir = path.join(root, '.data');
const repoDest = path.join(repoDir, 'multi_tenant_store.json');

fs.mkdirSync(destDir, { recursive: true });
fs.mkdirSync(repoDir, { recursive: true });
fs.copyFileSync(source, dest);
if (path.resolve(source) !== path.resolve(repoDest)) {
  fs.copyFileSync(source, repoDest);
}

const sizeKb = Math.round(fs.statSync(dest).size / 1024);
console.log(`[copy-store-to-dist] ${source} → dist/.data/multi_tenant_store.json (${sizeKb} KB)`);
