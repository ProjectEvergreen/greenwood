import type { AdapterPlugin } from "@greenwood/cli";

export type CloudflareAdapterOptions = {
  /** Overrides settings discovered in the workspace's Wrangler config file. */
  wrangler?: {
    /** Compatibility date for isolated route Workers. Defaults to the Wrangler config value. */
    compatibilityDate?: string;
    /** Compatibility flags for isolated route Workers. Defaults to the Wrangler config value. */
    compatibilityFlags?: string[];
    assets?: {
      /** Static asset binding name. Defaults to the Wrangler config value, or ASSETS. */
      binding?: string;
    };
  };
};

export type CloudflareAdapter = (options?: CloudflareAdapterOptions) => [AdapterPlugin];

declare module "@greenwood/plugin-adapter-cloudflare" {
  export const greenwoodPluginAdapterCloudflare: CloudflareAdapter;
}
