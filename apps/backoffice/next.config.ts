import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  transpilePackages: ['@lobby/shared'],
  // Monorepo: file tracing from the workspace root (OpenNext / Cloudflare Workers).
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

try {
  initOpenNextCloudflareForDev();
} catch {
  // wrangler / .dev.vars assenti: `next dev` resta usabile in Node.
}
