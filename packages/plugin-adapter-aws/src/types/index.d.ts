import type { Plugin } from "@greenwood/cli";

export type AwsAdapter = () => Array<Plugin>;

declare module "@greenwood/plugin-adapter-aws" {
  export const greenwoodPluginAdapterAws: AwsAdapter;
}
