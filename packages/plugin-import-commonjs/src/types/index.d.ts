import type { ResourcePlugin, RollupPlugin } from "@greenwood/cli";

export type ImportCommonJSPlugin = () => [ResourcePlugin, RollupPlugin];

declare module "@greenwood/plugin-import-commonjs" {
  export const greenwoodPluginImportCommonJs: ImportCommonJSPlugin;
}
