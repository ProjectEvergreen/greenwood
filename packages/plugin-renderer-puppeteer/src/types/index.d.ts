import type { ResourcePlugin, RendererPlugin, ServerPlugin } from "@greenwood/cli";

export type PuppeteerRendererPlugin = () => Array<ResourcePlugin, ServerPlugin, RendererPlugin>;

declare module "@greenwood/plugin-renderer-puppeteer" {
  export const greenwoodPluginRendererPuppeteer: PuppeteerRendererPlugin;
}
