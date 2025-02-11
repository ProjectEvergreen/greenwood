import type { Plugin } from "@greenwood/cli/src/types/index.d.ts";

type PolyfillsPluginOptions = {
  wc?: boolean;
  dsd?: boolean;
  lit?: boolean;
};

export type PolyfillsPlugin = (options: PolyfillsPluginOptions) => Array<Plugin>;
