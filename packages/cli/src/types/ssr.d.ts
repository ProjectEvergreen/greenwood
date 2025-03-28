// https://greenwoodjs.dev/docs/pages/server-rendering/
import type { Compilation, Frontmatter } from "./compilation.js";
import type { Page } from "./content.js";

// would be nice if we could enforce the user is using `extends HTMLElement`
export type SsrRouteHandler = {
  constructor?(compilation: Compilation, request: Request): string;
};

export type GetBody = (compilation: Compilation, page: Page, request: Request) => Promise<string>;
export type GetLayout = (compilation: Compilation, route: string) => Promise<string>;
export type GetFrontmatter = (compilation: Compilation, route: string) => Promise<Frontmatter>;
