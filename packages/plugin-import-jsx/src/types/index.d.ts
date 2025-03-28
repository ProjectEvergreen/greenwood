import type { ResourcePlugin } from "@greenwood/cli";

export type ImportJsxPlugin = () => Array<PlugResourcePluginn>;

declare module "@greenwood/plugin-import-jsx" {
  export const greenwoodPluginImportJsx: ImportJsxPlugin;
}
