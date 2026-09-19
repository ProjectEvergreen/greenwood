import type { CopyPlugin, ResourcePlugin } from "@greenwood/cli";

export type RssPluginOptions = {
  title: string;
  link: string;
  description: string;
  collection?: string;
  filename?: string;
  maxItems?: number;
};

export type RssPlugin = (options: RssPluginOptions) => [CopyPlugin, ResourcePlugin];

declare module "@greenwood/plugin-rss" {
  export const greenwoodPluginRss: RssPlugin;
}
