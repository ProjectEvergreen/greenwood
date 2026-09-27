import type { AdapterPlugin } from "@greenwood/cli";

export type DenoDeployAdapterOptions = {
  /** Serve Greenwood's public/ files from the dynamic entrypoint. Defaults to true. */
  serveStatic?: boolean;
};

export type DenoDeployAdapter = (options?: DenoDeployAdapterOptions) => [AdapterPlugin];

declare module "@greenwood/plugin-adapter-deno-deploy" {
  export const greenwoodPluginAdapterDenoDeploy: DenoDeployAdapter;
}
