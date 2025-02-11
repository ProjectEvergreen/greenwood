import type { Plugin } from "@greenwood/cli/src/types/index.d.ts";

type SUPPORTED_NODE_VERSIONS = "nodejs22.x" | "nodejs20.x" | "nodejs18.x";

type ImportRawPluginOptions = {
  matches?: string[];
};

export type ImportRawPlugin = (options?: ImportRawPluginOptions) => Array<Plugin>;
