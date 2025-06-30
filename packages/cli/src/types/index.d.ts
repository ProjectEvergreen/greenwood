import type { Config } from "./config.d.ts";
import type {
  Page,
  Collection,
  Graph,
  GetContent,
  GetContentByCollection,
  GetContentByRoute,
} from "./content.d.ts";
import type { Compilation, Frontmatter } from "./compilation.d.ts";
import type { ApiRouteHandler } from "./api.d.ts";
import type { SsrRouteHandler, GetBody, GetLayout, GetFrontmatter } from "./ssr.d.ts";
import type {
  PLUGINS,
  PLUGIN_TYPES,
  SERVE_PAGE_OPTIONS,
  ExternalSourcePage,
  Server,
  Resource,
  Plugin,
  AdapterPlugin,
  ContextPlugin,
  CopyPlugin,
  RendererPlugin,
  ResourcePlugin,
  RollupPlugin,
  ServerPlugin,
  SourcePlugin,
} from "./plugins.d.ts";

export type {
  Collection,
  Config,
  Graph,
  Page,
  GetContent,
  GetContentByCollection,
  GetContentByRoute,
  Compilation,
  Frontmatter,
  SERVE_PAGE_OPTIONS,
  ExternalSourcePage,
  Server,
  Resource,
  Plugin,
  AdapterPlugin,
  ContextPlugin,
  CopyPlugin,
  RendererPlugin,
  ResourcePlugin,
  RollupPlugin,
  ServerPlugin,
  SourcePlugin,
  ApiRouteHandler,
  SsrRouteHandler,
  GetBody,
  GetLayout,
  GetFrontmatter,
};

export type CLI_COMMAND = "develop" | "build" | "serve";

declare module "@greenwood/cli" {
  export const run: (CLI_COMMAND) => Promise<void>;
}
