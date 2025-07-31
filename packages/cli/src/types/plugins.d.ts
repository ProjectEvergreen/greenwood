import type { Compilation, Frontmatter } from "./compilation.d.ts";
import type { Page } from "./content.d.ts";
import type { Plugin as TRollupPlugin } from "rollup";

// https://greenwoodjs.dev/docs/reference/plugins-api/#overview
export type PLUGIN_TYPES =
  | "adapter"
  | "context"
  | "copy"
  | "renderer"
  | "resource"
  | "rollup"
  | "server"
  | "source";

export type PLUGINS =
  | AdapterPlugin
  | ContextPlugin
  | CopyPlugin
  | RendererPlugin
  | ResourcePlugin
  | RollupPlugin
  | ServerPlugin
  | SourcePlugin;

export interface Plugin {
  name?: string;
  type: PLUGIN_TYPES;
  provider: (compilation: Compilation) => unknown;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#adapter
export interface AdapterPlugin extends Plugin {
  type: Extract<PLUGIN_TYPES, "adapter">;
  provider: (compilation: Compilation) => Promise<Function>;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#context
export interface ContextPlugin extends Plugin {
  type: Extract<PLUGIN_TYPES, "context">;
  provider: (compilation: Compilation) => { layouts: URL[] };
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#copy
export interface CopyPlugin extends Plugin {
  type: Extract<PLUGIN_TYPES, "copy">;
  provider: (compilation: Compilation) => Promise<{ from: URL; to: URL }[]>;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#renderer
export interface RendererPlugin extends Plugin {
  type: Extract<PLUGIN_TYPES, "renderer">;
  provider: (compilation: Compilation) => { executeModuleUrl: URL } | { customUrl: URL };
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#resource
export type SERVE_PAGE_OPTIONS = "static" | "dynamic";

export type Resource = {
  extensions?: string[];
  servePage?: SERVE_PAGE_OPTIONS;
  shouldResolve?: (url: URL) => Promise<boolean>;
  resolve?: (url: URL) => Promise<Request>;
  shouldServe?: (url: URL, request: Request) => Promise<boolean>;
  serve?: (url: URL, request: Request) => Promise<Response>;
  shouldPreIntercept?: (url: URL, request: Request, response: Response) => Promise<boolean>;
  preIntercept?: (url: URL, request: Request, response: Response) => Promise<Response>;
  shouldIntercept?: (url: URL, request: Request, response: Response) => Promise<boolean>;
  intercept?: (url: URL, request: Request, response: Response) => Promise<Response>;
  shouldOptimize?: (url: URL, response: Response) => Promise<boolean>;
  optimize?: (url: URL, response: Response) => Promise<Response>;
};

export interface ResourcePlugin extends Plugin {
  type: Extract<PLUGIN_TYPES, "resource">;
  provider: (compilation: Compilation) => Resource;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#rollup
export interface RollupPlugin extends Plugin {
  type: Extract<PLUGIN_TYPES, "rollup">;
  provider: (compilation: Compilation) => TRollupPlugin[];
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#server
export type Server = {
  start: () => Promise<any>;
  stop?: () => Promise<any>;
};

export interface ServerPlugin extends Plugin {
  type: Extract<PLUGIN_TYPES, "server">;
  provider: (compilation: Compilation) => Server;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#source
export type ExternalSourcePage = Frontmatter & {
  body: string;
  route: string;
  id?: string;
};

export interface SourcePlugin extends Plugin {
  type: Extract<PLUGIN_TYPES, "source">;
  provider: (compilation: Compilation) => () => Promise<ExternalSourcePage[]>;
}
