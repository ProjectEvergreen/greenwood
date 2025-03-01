import type { Plugin } from "@greenwood/cli";

export type PuppeteerRendererPlugin = () => Array<Plugin>;

declare module "@greenwood/plugin-renderer-puppeteer" {
  export const greenwoodPluginRendererPuppeteer: PuppeteerRendererPlugin;
}
