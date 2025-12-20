// https://greenwoodjs.dev/docs/pages/server-rendering/
import type { Compilation, Frontmatter } from "./compilation.js";
import type { Page } from "./content.js";

type Params = {
  props: object;
};

type ConstructorProps = {
  compilation: Compilation;
  request: Request;
  params?: Params;
};

// would be nice if we could enforce the user is using `extends HTMLElement`
export type SsrRouteHandler = {
  constructor?({ compilation, request, params }: ConstructorProps): void;
};

export type GetBody = (
  compilation: Compilation,
  page: Page,
  request: Request,
  params: Params,
) => Promise<string>;
export type GetLayout = (
  compilation: Compilation,
  page: Page,
  request: Request,
  params: Params,
) => Promise<string>;
export type GetFrontmatter = (compilation: Compilation, page: Page) => Promise<Frontmatter>;
