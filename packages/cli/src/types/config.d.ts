import type { PLUGIN_TYPES } from "./plugins.d.ts";

// https://greenwoodjs.dev/docs/reference/configuration/
export type Config = {
  activeContent?: boolean,
  basePath?: string,
  devServer?: {
    extensions?: string[],
    hud?: boolean,
    port?: number,
    host?: string,
  };
  isolation?: boolean,
  layoutsDirectory?: string,
  optimization?: 'default' | 'inline' | 'none' | 'static',
  markdown?: {
    plugins?: string[]
  },
  pagesDirectory?: string,
  plugins?: Array<PLUGIN_TYPES | Array<PLUGIN_TYPES>>,
  polyfills?: {
    importAttributes?: null | Array<'css' | 'json'>,
    importMaps?: boolean
  },
  port?: number,
  prerender?: boolean,
  staticRouter?: boolean,
  workspace?: URL | string
}