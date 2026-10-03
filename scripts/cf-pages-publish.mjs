#!/usr/bin/env node
/**
 * Optional wrangler 4 Direct Upload during a Pages Git build.
 *
 * The staged `_worker.js/` trampoline already survives wrangler 3.114.17
 * (it rebundles only index.js; app.js stays an external module). A token
 * is no longer required for a working site. If one is set, we still
 * publish with wrangler 4 as a faster extra path, then exit 0 so the
 * Git job stays green.
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
  process.exit(0);
}

const env = { ...process.env, CLOUDFLARE_API_TOKEN: token };
if (accountId.trim()) {
  env.CLOUDFLARE_ACCOUNT_ID = accountId;
}

console.log('Publishing .pages-dist with wrangler 4 Direct Upload');
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
