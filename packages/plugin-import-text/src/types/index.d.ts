import type { ResourcePlugin } from "@greenwood/cli";

type ImportTextPluginOptions = {
  matches?: string[];
  importMapExtensions?: string[];
};

export type ImportTextPlugin = (
  options?: ImportTextPluginOptions,
) => [ResourcePlugin, ResourcePlugin];

declare module "@greenwood/plugin-import-text" {
  export const greenwoodPluginImportText: ImportTextPlugin;
}
