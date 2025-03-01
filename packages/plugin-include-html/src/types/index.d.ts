import type { Plugin } from "@greenwood/cli";

export type IncludeHtmlPlugin = () => Array<Plugin>;

declare module "@greenwood/plugin-include-html" {
  export const greenwoodPluginIncludeHTML: IncludeHtmlPlugin;
}
