import type { ResourcePlugin } from "@greenwood/cli";

export type IncludeHtmlPlugin = () => Array<ResourcePlugin>;

declare module "@greenwood/plugin-include-html" {
  export const greenwoodPluginIncludeHTML: IncludeHtmlPlugin;
}
