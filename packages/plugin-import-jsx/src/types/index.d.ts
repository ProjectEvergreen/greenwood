import type { Plugin } from "@greenwood/cli";

export type ImportJsxPlugin = () => Array<Plugin>;

declare module "@greenwood/plugin-import-jsx" {
  export const greenwoodPluginImportJsx: ImportJsxPlugin;
}
