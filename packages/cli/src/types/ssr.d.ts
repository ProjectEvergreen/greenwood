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

export type StaticPath = { params: object };
export type StaticParam = Record<string, unknown>;

export type GetStaticPaths = () => Promise<StaticPath[]>;
export type GetStaticParams = ({
  params,
}: InferGetStaticParamsType<StaticPath>) => Promise<StaticParam>;

export type InferGetStaticParamsType<T> = T extends () => Promise<Array<{ params: infer P }>>
  ? P
  : never;
export type InferGetStaticPropsType<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;
