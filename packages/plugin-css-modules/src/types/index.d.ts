import type { Plugin } from "@greenwood/cli";

export type CssModulesPlugin = () => Array<Plugin>;

declare module "@greenwood/plugin-css-modules" {
  export const greenwoodPluginCssModules: CssModulesPlugin;
}
