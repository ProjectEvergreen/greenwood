import type { RendererPlugin, ResourcePlugin } from "@greenwood/cli";

export type LitRendererPlugin = () => Array<RendererPlugin, ResourcePlugin>;

declare module "@greenwood/plugin-renderer-lit" {
  export const greenwoodPluginRendererLit: LitRendererPlugin;
}
