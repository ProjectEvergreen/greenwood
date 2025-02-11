import type { Plugin } from "@greenwood/cli/src/types/index.d.ts";

type SUPPORTED_NODE_VERSIONS = "nodejs22.x" | "nodejs20.x" | "nodejs18.x";

type VercelAdapterOptions = {
  runtime?: SUPPORTED_NODE_VERSIONS;
};

export type VercelAdapter = (options?: VercelAdapterOptions) => Array<Plugin>;
