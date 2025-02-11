import type { Plugin, SERVE_PAGE_OPTIONS } from "@greenwood/cli/src/types/index.d.ts";

type TypeScriptPluginOptions = {
  extendConfig?: boolean;
  servePage?: SERVE_PAGE_OPTIONS;
};

export type TypeScriptPlugin = (options?: TypeScriptPluginOptions) => Array<Plugin>;
