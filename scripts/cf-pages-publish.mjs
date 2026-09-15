#!/usr/bin/env node
/**
 * Pages Git ricompila `_worker.js` con wrangler 3.114.17 e il runtime
 * risponde 500 (`Cannot read properties of undefined (reading 'require')`).
 *
 * In un build CF_PAGES, se c'è CLOUDFLARE_API_TOKEN, pubblichiamo con
 * wrangler 4 e falliamo il job Git così wrangler 3 non sovrascrive.
 * Senza token usciamo 0: il check Git resta verde (il sito Pages
 * continuerà a rispondere 500 finché non c'è il token).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isPagesGit = process.env.CF_PAGES === '1';
if (!isPagesGit) {
  process.exit(0);
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(repoRoot, 'apps/backoffice/.pages-dist');
const wranglerJs = path.join(repoRoot, 'node_modules/wrangler/bin/wrangler.js');
const token = process.env.CLOUDFLARE_API_TOKEN ?? '';
const accountId =
  process.env.CLOUDFLARE_ACCOUNT_ID ?? process.env.CF_ACCOUNT_ID ?? '';

if (!fs.existsSync(path.join(dist, '_worker.js'))) {
  console.error('Missing apps/backoffice/.pages-dist/_worker.js — run cf:build first');
  process.exit(1);
}
if (!fs.existsSync(wranglerJs)) {
  console.error('Missing wrangler: run npm ci at the repo root');
  process.exit(1);
}
if (!token.trim()) {
  console.warn(`
Skipping wrangler 4 Direct Upload (CLOUDFLARE_API_TOKEN is not set).

Pages Git will finish with wrangler 3.114.17. The Git check can go green;
that compiler still 500s this OpenNext worker at runtime. To publish a
working site, add Pages → Settings → Environment variables (Build + Production):
  CLOUDFLARE_API_TOKEN   Account → Cloudflare Pages: Edit
  CLOUDFLARE_ACCOUNT_ID  Cloudflare dashboard → Overview
`);
  process.exit(0);
}

const env = { ...process.env, CLOUDFLARE_API_TOKEN: token };
if (accountId.trim()) {
  env.CLOUDFLARE_ACCOUNT_ID = accountId;
}

console.log('Publishing .pages-dist with wrangler 4 (skip Pages Git wrangler 3 compile)');
execFileSync(
  process.execPath,
  [
    wranglerJs,
    'pages',
    'deploy',
    dist,
    '--project-name=lobby',
    '--commit-dirty=true',
  ],
  { cwd: repoRoot, env, stdio: 'inherit' },
);

console.error(`
Wrangler 4 Direct Upload succeeded.

Failing this Pages Git job on purpose so wrangler 3.114.17 does not
recompile _worker.js and overwrite the working deployment with HTTP 500.
The site is already live from the wrangler 4 upload above.
`);
process.exit(1);
