import type { AdapterPlugin } from "@greenwood/cli";

export type AwsAdapter = () => Array<AdapterPlugin>;

declare module "@greenwood/plugin-adapter-aws" {
  export const greenwoodPluginAdapterAws: AwsAdapter;
}
