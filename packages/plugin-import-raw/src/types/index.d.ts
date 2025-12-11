import type { ResourcePlugin } from "@greenwood/cli";

type ImportRawPluginOptions = {
  matches?: string[];
  importMapExtensions?: string[];
};

export type ImportRawPlugin = (
  options?: ImportRawPluginOptions,
) => [ResourcePlugin, ResourcePlugin];

declare module "@greenwood/plugin-import-raw" {
  export const greenwoodPluginImportRaw: ImportRawPlugin;
}
