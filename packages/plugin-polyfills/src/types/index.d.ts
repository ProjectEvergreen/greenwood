import type { Plugin } from "@greenwood/cli";

type PolyfillsPluginOptions = {
  wc?: boolean;
  dsd?: boolean;
  lit?: boolean;
};

export type PolyfillsPlugin = (options: PolyfillsPluginOptions) => Array<Plugin>;

declare module "@greenwood/plugin-polyfills" {
  export const greenwoodPluginPolyfills: PolyfillsPlugin;
}
