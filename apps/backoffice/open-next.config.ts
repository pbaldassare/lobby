import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/** Cache in-memory sul Worker: niente R2 obbligatorio al primo deploy. */
export default defineCloudflareConfig();
