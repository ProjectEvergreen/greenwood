import type { AdapterPlugin } from "@greenwood/cli";

type SUPPORTED_NODE_VERSIONS = "nodejs24.x" | "nodejs22.x" | "nodejs20.x";

type VercelAdapterOptions = {
  runtime?: SUPPORTED_NODE_VERSIONS;
};

export type VercelAdapter = (options?: VercelAdapterOptions) => [AdapterPlugin];

declare module "@greenwood/plugin-adapter-vercel" {
  export const greenwoodPluginAdapterVercel: VercelAdapter;
}
