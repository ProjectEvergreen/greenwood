import type { ResourcePlugin } from "@greenwood/cli";

export type ImportJsxPlugin = () => [ResourcePlugin];

declare module "@greenwood/plugin-import-jsx" {
  export const greenwoodPluginImportJsx: ImportJsxPlugin;
}
