import type { CopyPlugin, ResourcePlugin } from "@greenwood/cli";

type PolyfillsPluginOptions = {
  wc?: boolean;
  dsd?: boolean;
  lit?: boolean;
};

export type PolyfillsPlugin = (
  options?: PolyfillsPluginOptions,
) => Array<ResourcePlugin, CopyPlugin>;

declare module "@greenwood/plugin-polyfills" {
  export const greenwoodPluginPolyfills: PolyfillsPlugin;
}
