import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  transpilePackages: ['@lobby/shared'],
  // Monorepo: correct file tracing root for Vercel
  outputFileTracingRoot: path.join(__dirname, '../..'),
  eslint: {
    // Root flat config + next package resolution differ in workspaces; lint via `npm run lint`
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
