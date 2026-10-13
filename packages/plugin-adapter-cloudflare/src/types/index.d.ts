import type { AdapterPlugin } from "@greenwood/cli";

export type CloudflareAdapter = () => [AdapterPlugin];

declare module "@greenwood/plugin-adapter-cloudflare" {
  export const greenwoodPluginAdapterCloudflare: CloudflareAdapter;
}
