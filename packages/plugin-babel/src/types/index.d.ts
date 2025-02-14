import type { Plugin } from "@greenwood/cli/src/types/index.d.ts";

type BabelPluginOptions = {
  extendConfig?: boolean;
};

export type BabelPlugin = (options?: BabelPluginOptions) => Array<Plugin>;
