import type { ResourcePlugin, RollupPlugin } from "@greenwood/cli";

type BabelPluginOptions = {
  extendConfig?: boolean;
};

export type BabelPlugin = (options?: BabelPluginOptions) => Array<ResourcePlugin, RollupPlugin>;

declare module "@greenwood/plugin-babel" {
  export const greenwoodPluginBabel: BabelPlugin;
}
