import type { ResourcePlugin } from "@greenwood/cli";

type Options = {
  servePages?: boolean;
};

export type ImportJsxPlugin = (options?: Options) => [ResourcePlugin];

declare module "@greenwood/plugin-import-jsx" {
  export const greenwoodPluginImportJsx: ImportJsxPlugin;
}
