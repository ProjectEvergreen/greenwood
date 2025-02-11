import type { Plugin } from "@greenwood/cli/src/types/index.d.ts";

type PostCssPluginOptions = {
  extendConfig?: boolean;
};

export type PostCssPlugin = (options?: PostCssPluginOptions) => Array<Plugin>;
