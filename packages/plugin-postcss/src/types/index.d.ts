import type { Plugin } from "@greenwood/cli";

type PostCssPluginOptions = {
  extendConfig?: boolean;
};

export type PostCssPlugin = (options?: PostCssPluginOptions) => Array<Plugin>;

declare module "@greenwood/plugin-postcss" {
  export const greenwoodPluginPostCss: PostCssPlugin;
}
