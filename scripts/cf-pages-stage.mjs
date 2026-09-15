#!/usr/bin/env node
/**
 * Converte l'output OpenNext in Pages advanced mode:
 * static assets + `_worker.js/index.js` (bundle wrangler 4) + `_routes.json`.
 *
 * Il bundle wrangler 4 inlinea `@cloudflare/unenv-preset` (Error 1101
 * se manca). Pages Git ricompila con wrangler 3.114.17 e il runtime
 * risponde 500: vedi `cf-pages-publish.mjs`.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backofficeRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../apps/backoffice',
);
const repoRoot = path.resolve(backofficeRoot, '../..');
const src = path.join(backofficeRoot, '.open-next');
const dest = path.join(backofficeRoot, '.pages-dist');
const workerSrc = path.join(src, 'worker.js');
const assetsSrc = path.join(src, 'assets');
const bundleDir = path.join(backofficeRoot, '.wrangler-prebundle');
const bundleConfig = path.join(backofficeRoot, '.wrangler-prebundle.jsonc');

if (!fs.existsSync(workerSrc)) {
  console.error('Missing OpenNext output: apps/backoffice/.open-next/worker.js');
  process.exit(1);
}
if (!fs.existsSync(assetsSrc)) {
  console.error('Missing OpenNext output: apps/backoffice/.open-next/assets');
  process.exit(1);
}

const wranglerJs = path.join(repoRoot, 'node_modules/wrangler/bin/wrangler.js');
if (!fs.existsSync(wranglerJs)) {
  console.error('Missing wrangler: run npm ci at the repo root');
  process.exit(1);
}

fs.writeFileSync(
  bundleConfig,
  `${JSON.stringify(
    {
      name: 'lobby',
      main: workerSrc,
      compatibility_date: '2025-04-01',
      compatibility_flags: ['nodejs_compat', 'global_fetch_strictly_public'],
    },
    null,
    2,
  )}\n`,
);

fs.rmSync(bundleDir, { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
    wranglerJs,
    'deploy',
    '--dry-run',
    '--outdir',
    bundleDir,
    '--config',
    bundleConfig,
  ],
  { cwd: backofficeRoot, stdio: 'inherit' },
);

const bundledWorker = path.join(bundleDir, 'worker.js');
if (!fs.existsSync(bundledWorker)) {
  console.error('Wrangler dry-run did not write .wrangler-prebundle/worker.js');
  process.exit(1);
}

const NODE_BUILTINS = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'diagnostics_channel',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'sys',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib',
];
// Wrangler Workers bundle leaves some Node builtins unprefixed.
// Pages `no_bundle` only allows `node:` / `cloudflare:` specifiers.
const nodeFrom = new RegExp(
  `(\\b(?:import|export)\\b[^;\\n]*?\\sfrom\\s+)["'](?!node:|cloudflare:)(${NODE_BUILTINS.join('|')})(/[^"']*)?["']`,
  'g',
);
const nodeBareImport = new RegExp(
  `(\\bimport\\s+)["'](?!node:|cloudflare:)(${NODE_BUILTINS.join('|')})(/[^"']*)?["']`,
  'g',
);
const workerSource = fs
  .readFileSync(bundledWorker, 'utf8')
  .replace(nodeFrom, '$1"node:$2$3"')
  .replace(nodeBareImport, '$1"node:$2$3"')
  .replace(/\n\/\/# sourceMappingURL=worker\.js\.map\s*$/u, '\n');

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(assetsSrc, dest, { recursive: true });

const workerDir = path.join(dest, '_worker.js');
fs.mkdirSync(workerDir, { recursive: true });
fs.writeFileSync(path.join(workerDir, 'index.js'), workerSource);
fs.writeFileSync(
  path.join(dest, '.assetsignore'),
  '_worker.js\n_routes.json\n',
);

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

const stagedWorker = path.join(dest, '_worker.js', 'index.js');
if (!fs.existsSync(stagedWorker) || !fs.statSync(path.join(dest, '_worker.js')).isDirectory()) {
  console.error('Expected _worker.js/index.js (pre-bundled module directory)');
  process.exit(1);
}
if (workerSource.includes('from "@cloudflare/unenv-preset')) {
  console.error(
    'Staged worker still imports @cloudflare/unenv-preset (Error 1101 at runtime)',
  );
  process.exit(1);
}

fs.rmSync(bundleConfig, { force: true });

console.log(`Staged Cloudflare Pages output at ${dest}`);
