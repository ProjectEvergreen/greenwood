import type { PLUGINS } from "./plugins.d.ts";

// https://greenwoodjs.dev/docs/reference/configuration/
export type Config = {
  activeContent?: boolean;
  basePath?: string;
  devServer?: {
    extensions?: string[];
    hud?: boolean;
    port?: number;
    proxy?: {
      [key: string]: string;
    };
  };
  isolation?: boolean;
  layoutsDirectory?: string;
  optimization?: "default" | "inline" | "none" | "static";
  pagesDirectory?: string;
  plugins?: Array<PLUGINS | Array<PLUGINS>>;
  polyfills?: {
    importAttributes?: null | Array<"css" | "json">;
    importMaps?: boolean;
  };
  port?: number;
  prerender?: boolean;
  staticRouter?: boolean;
  useTsc?: boolean;
  workspace?: URL | string;
};
