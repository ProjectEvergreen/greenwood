import type { Plugin, SERVE_PAGE_OPTIONS } from "@greenwood/cli";

type TypeScriptPluginOptions = {
  extendConfig?: boolean;
  servePage?: SERVE_PAGE_OPTIONS;
};

export type TypeScriptPlugin = (options?: TypeScriptPluginOptions) => Array<Plugin>;

declare module "@greenwood/plugin-typescript" {
  export const greenwoodPluginTypeScript: TypeScriptPlugin;
}
