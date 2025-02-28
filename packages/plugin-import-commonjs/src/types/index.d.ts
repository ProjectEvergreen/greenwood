import type { Plugin } from "@greenwood/cli";

export type ImportCommonJSPlugin = () => Array<Plugin>;

declare module "@greenwood/plugin-import-commonjs" {
  export const greenwoodPluginImportCommonJs: ImportCommonJSPlugin;
}
