import type { AdapterPlugin, ContextPlugin, CopyPlugin, RendererPlugin, ResourcePlugin, RollupPlugin, ServerPlugin, SourcePlugin } from "./plugins.d.ts";

// https://greenwoodjs.dev/docs/reference/configuration/
export type Config = {
  activeContent: boolean,
  basePath: string,
  devServer: {
    extensions: Array<string>,
    hud: boolean,
    port: number,
    host: string,
  };
  isolation: boolean,
  layoutsDirectory: string,
  optimization: 'default' | 'inline' | 'none' | 'static',
  markdown: {
    plugins: Array<string>
  },
  pagesDirectory: string,
  plugins: [AdapterPlugin | ContextPlugin | CopyPlugin | RendererPlugin | ResourcePlugin | RollupPlugin | ServerPlugin | SourcePlugin],
  polyfills: {
    importAttributes: null | Array<'css' | 'json'>,
    importMaps: boolean
  },
  port: number,
  prerender: boolean,
  staticRouter: boolean,
  workspace: URL | string
}