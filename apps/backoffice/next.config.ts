import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  transpilePackages: ['@lobby/shared'],
  // Monorepo: correct file tracing root for Vercel
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
