import type { Plugin } from "@greenwood/cli";

type SUPPORTED_NODE_VERSIONS = "nodejs22.x" | "nodejs20.x" | "nodejs18.x";

type VercelAdapterOptions = {
  runtime?: SUPPORTED_NODE_VERSIONS;
};

export type VercelAdapter = (options?: VercelAdapterOptions) => Array<Plugin>;

declare module "@greenwood/plugin-adapter-vercel" {
  export const greenwoodPluginAdapterVercel: VercelAdapter;
}
