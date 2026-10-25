import type { AdapterPlugin } from "@greenwood/cli";

export type CloudflareAdapterOptions = {
  /** Compatibility date for isolated route Workers. Match wrangler.toml when overriding. */
  compatibilityDate?: string;
  /** Compatibility flags for isolated route Workers. Match wrangler.toml when overriding. */
  compatibilityFlags?: string[];
};

export type CloudflareAdapter = (options?: CloudflareAdapterOptions) => [AdapterPlugin];

declare module "@greenwood/plugin-adapter-cloudflare" {
  export const greenwoodPluginAdapterCloudflare: CloudflareAdapter;
}
