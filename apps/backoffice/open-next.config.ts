import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/** Cache in-memory su Cloudflare Pages: niente R2 obbligatorio al primo deploy. */
export default defineCloudflareConfig();
