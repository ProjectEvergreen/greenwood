import type { Plugin } from "@greenwood/cli";

export type NetlifyAdapter = () => Array<Plugin>;

declare module "@greenwood/plugin-adapter-netlify" {
  export const greenwoodPluginAdapterNetlify: NetlifyAdapter;
}
