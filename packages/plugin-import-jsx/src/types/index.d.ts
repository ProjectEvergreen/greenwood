import type { ResourcePlugin } from "@greenwood/cli";

export type ImportJsxPlugin = () => Array<ResourcePlugin>;

declare module "@greenwood/plugin-import-jsx" {
  export const greenwoodPluginImportJsx: ImportJsxPlugin;
}
