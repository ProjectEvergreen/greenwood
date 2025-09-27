import type { ResourcePlugin } from "@greenwood/cli";

type PostCssPluginOptions = {
  extendConfig?: boolean;
};

export type PostCssPlugin = (options?: PostCssPluginOptions) => [ResourcePlugin];

declare module "@greenwood/plugin-postcss" {
  export const greenwoodPluginPostCss: PostCssPlugin;
}
