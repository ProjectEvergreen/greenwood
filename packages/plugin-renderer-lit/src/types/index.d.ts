import type { Plugin } from "@greenwood/cli";

export type LitRendererPlugin = () => Array<Plugin>;

declare module "@greenwood/plugin-renderer-lit" {
  export const greenwoodPluginRendererLit: LitRendererPlugin;
}
