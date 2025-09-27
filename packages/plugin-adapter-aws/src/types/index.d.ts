import type { AdapterPlugin } from "@greenwood/cli";

export type AwsAdapter = () => [AdapterPlugin];

declare module "@greenwood/plugin-adapter-aws" {
  export const greenwoodPluginAdapterAws: AwsAdapter;
}
