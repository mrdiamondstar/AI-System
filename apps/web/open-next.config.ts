import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Incremental cache (ISR) moves to R2 once the bucket exists; the default
// in-memory cache is fine for first deploys.
export default defineCloudflareConfig({});
