#!/usr/bin/env node
/**
 * Converte l'output OpenNext in Pages advanced mode:
 * static assets + `_worker.js/` (directory di moduli) + `_routes.json`.
 *
 * La directory (non un singolo file) + `no_bundle` evita che Pages Git
 * ricompili OpenNext con wrangler 3.114.17 (500 a runtime).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backofficeRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../apps/backoffice',
);
const src = path.join(backofficeRoot, '.open-next');
const dest = path.join(backofficeRoot, '.pages-dist');
const workerSrc = path.join(src, 'worker.js');
const assetsSrc = path.join(src, 'assets');

if (!fs.existsSync(workerSrc)) {
  console.error('Missing OpenNext output: apps/backoffice/.open-next/worker.js');
  process.exit(1);
}
if (!fs.existsSync(assetsSrc)) {
  console.error('Missing OpenNext output: apps/backoffice/.open-next/assets');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

fs.cpSync(assetsSrc, dest, { recursive: true });

const workerDir = path.join(dest, '_worker.js');
fs.rmSync(workerDir, { recursive: true, force: true });
fs.mkdirSync(workerDir, { recursive: true });

for (const entry of fs.readdirSync(src)) {
  if (entry === 'assets' || entry === 'worker.js') {
    continue;
  }
  fs.cpSync(path.join(src, entry), path.join(workerDir, entry), {
    recursive: true,
  });
}

fs.copyFileSync(workerSrc, path.join(workerDir, 'index.js'));

fs.writeFileSync(
  path.join(dest, '_routes.json'),
  `${JSON.stringify(
    {
      version: 1,
      include: ['/*'],
      exclude: ['/_next/static/*'],
    },
    null,
    2,
  )}\n`,
);

if (fs.existsSync(path.join(dest, '_worker.js')) && !fs.statSync(path.join(dest, '_worker.js')).isDirectory()) {
  console.error('Expected _worker.js to be a directory of modules');
  process.exit(1);
}

console.log(`Staged Cloudflare Pages output at ${dest}`);
