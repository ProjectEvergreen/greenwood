import type { Compilation } from "./compilation.d.ts";
import type { Page } from "./content.d.ts";

// https://greenwoodjs.dev/docs/reference/plugins-api/#overview

// TODO why wont this work on the interface?
type PLUGIN_TYPES =
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
  name: string;
  type: string;
  provider: (compilation: Compilation) => unknown; // TODO could we narrow this further?
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#adapter
export interface AdapterPlugin extends Plugin {
  provider: (compilation: Compilation) => Promise<Function>;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#context
export interface ContextPlugin extends Plugin {
  provider: (compilation: Compilation) => { layouts: URL[] };
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#copy
export interface CopyPlugin extends Plugin {
  provider: (compilation: Compilation) => Promise<{ from: URL; to: URL }[]>;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#renderer
export interface RendererPlugin extends Plugin {
  provider: (compilation: Compilation) => { executeModuleUrl: URL } | { customUrl: URL };
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#resource
export type SERVE_PAGE_OPTIONS = "static" | "dynamic";

type Resource = {
  extensions?: string[];
  servePage?: SERVE_PAGE_OPTIONS;
  shouldResolve?: (url: URL) => Promise<boolean>;
  resolve?: (url: URL) => Promise<Request>;
  shouldServe?: (url: URL) => Promise<boolean>;
  serve?: (url: URL) => Promise<Response>;
  shouldPreIntercept?: (url: URL, request: Request, response: Response) => Promise<boolean>;
  preIntercept?: (url: URL, request: Request, response: Response) => Promise<Response>;
  shouldIntercept?: (url: URL, request: Request, response: Response) => Promise<boolean>;
  intercept?: (url: URL, request: Request, response: Response) => Promise<Response>;
  shouldOptimize?: (url: URL, response: Response) => Promise<boolean>;
  optimize?: (url: URL, response: Response) => Promise<Response>;
};

export interface ResourcePlugin extends Plugin {
  provider: (compilation: Compilation) => Resource;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#rollup
export interface RollupPlugin extends Plugin {
  /** @type {import('rollup').Plugin} */
  provider: (compilation: Compilation) => Plugin[];
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#server
type Server = {
  start: () => Promise<any>;
  stop?: () => Promise<any>;
};

export interface ServerPlugin extends Plugin {
  provider: (compilation: Compilation) => Server;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#source
export interface SourcePlugin extends Plugin {
  provider: (compilation: Compilation) => Page[];
}
