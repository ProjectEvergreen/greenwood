import type { Plugin } from "@greenwood/cli";

type BabelPluginOptions = {
  extendConfig?: boolean;
};

export type BabelPlugin = (options?: BabelPluginOptions) => Array<Plugin>;

declare module "@greenwood/plugin-babel" {
  export const greenwoodPluginBabel: BabelPlugin;
}
