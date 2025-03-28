import type { ResourcePlugin } from "@greenwood/cli";

type SUPPORTED_NODE_VERSIONS = "nodejs22.x" | "nodejs20.x" | "nodejs18.x";

type ImportRawPluginOptions = {
  matches?: string[];
};

export type ImportRawPlugin = (options?: ImportRawPluginOptions) => Array<ResourcePlugin>;

declare module "@greenwood/plugin-import-raw" {
  export const greenwoodPluginImportRaw: ImportRawPlugin;
}
