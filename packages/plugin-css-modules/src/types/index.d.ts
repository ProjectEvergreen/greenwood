import type { ResourcePlugin } from "@greenwood/cli";

export type CssModulesPlugin = () => [ResourcePlugin, ResourcePlugin];

declare module "@greenwood/plugin-css-modules" {
  export const greenwoodPluginCssModules: CssModulesPlugin;
}
