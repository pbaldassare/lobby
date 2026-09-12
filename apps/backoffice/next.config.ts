import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  transpilePackages: ['@lobby/shared'],
  // Monorepo: file tracing from the workspace root (OpenNext / Cloudflare Pages).
  outputFileTracingRoot: path.join(__dirname, '../..'),
  // Chiavi publishable (RLS). Così `next build` su Pages Git non resta senza env.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      'https://mjzjracjadlybvdttgto.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qempyYWNqYWRseWJ2ZHR0Z3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTI0NTIsImV4cCI6MjA5NzcyODQ1Mn0.BH1NHibXiMYLUt5GUah40C_sMwzGdZ5q7X7eBNEAzeo',
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

try {
  initOpenNextCloudflareForDev();
} catch {
  // wrangler / .dev.vars assenti: `next dev` resta usabile in Node.
}
