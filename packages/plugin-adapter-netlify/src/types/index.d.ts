import type { AdapterPlugin } from "@greenwood/cli";

export type NetlifyAdapter = () => [AdapterPlugin];

declare module "@greenwood/plugin-adapter-netlify" {
  export const greenwoodPluginAdapterNetlify: NetlifyAdapter;
}
