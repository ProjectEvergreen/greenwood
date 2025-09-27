import type { ResourcePlugin, RollupPlugin } from "@greenwood/cli";

type BabelPluginOptions = {
  extendConfig?: boolean;
};

export type BabelPlugin = (options?: BabelPluginOptions) => [ResourcePlugin, RollupPlugin];

declare module "@greenwood/plugin-babel" {
  export const greenwoodPluginBabel: BabelPlugin;
}
