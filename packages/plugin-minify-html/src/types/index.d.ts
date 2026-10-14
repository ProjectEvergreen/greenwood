import type { ResourcePlugin } from "@greenwood/cli";

export type MinifyHtmlPluginOptions = {
  ignoreCustomComments?: RegExp[];
};

export type MinifyHtmlPlugin = (options?: MinifyHtmlPluginOptions) => [ResourcePlugin];

declare module "@greenwood/plugin-minify-html" {
  export const greenwoodPluginMinifyHtml: MinifyHtmlPlugin;
}
