import type { Compilation, Page } from "./compilation.d.ts";

// https://greenwoodjs.dev/docs/reference/plugins-api/#overview
interface Plugin {
  name: string;
  type: 'adapter' | 'context' | 'copy' | 'renderer' | 'resource' | 'rollup' | 'server' | 'source';
  provider: (compilation: Compilation) => any; // could we narrow this further?
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#adapter
export interface AdapterPlugin extends Plugin {
  provider: (compilation: Compilation) => Promise<Function>;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#context
export interface ContextPlugin extends Plugin {
  provider: (compilation: Compilation) => { layouts: Array<URL> };
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#copy
export interface CopyPlugin extends Plugin {
  provider: (compilation: Compilation) => Array<{ from: URL, to: URL }>;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#renderer
export interface RendererPlugin extends Plugin {
  provider: (compilation: Compilation) => { executeModuleUrl: URL };
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#resource
interface Resource {
  compilation?: Compilation;
  options?: object;
  extensions?: Array<string>;
  servePage?: 'static' | 'dynamic';
  shouldResolve?: (url: URL) => Promise<boolean>;
  resolve?: (url: URL) => Promise<URL>;
  shouldServe?: (url: URL) => Promise<boolean>;
  serve?: (url: URL) => Promise<URL>;
  shouldPreIntercept?: (url: URL, request: Request, response: Response) => Promise<boolean>;
  preIntercept?: (url: URL, request: Request, response: Response) => Promise<Response>;
  shouldIntercept?: (url: URL, request: Request, response: Response) => Promise<boolean>;
  intercept?: (url: URL, request: Request, response: Response) => Promise<Response>;
  shouldOptimize?: (url: URL, response: Response) => Promise<boolean>;
  optimize?: (url: URL, response: Response) => Promise<Response>;
}

export interface ResourcePlugin extends Plugin {
  provider: (compilation: Compilation) => Resource;
}


// https://greenwoodjs.dev/docs/reference/plugins-api/#rollup
export interface RollupPlugin extends Plugin {
  /** @type {import('rollup').Plugin} */
  provider: (compilation: Compilation) => Array<Plugin>;
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#server
export interface ServerPlugin extends Plugin {
  provider: (compilation: Compilation) => {
    start: Promise<Function>,
    stop: Promise<Function>
  };
}

// https://greenwoodjs.dev/docs/reference/plugins-api/#source
export interface SourcePlugin extends Plugin {
  provider: (compilation: Compilation) => Array<Page>;
}