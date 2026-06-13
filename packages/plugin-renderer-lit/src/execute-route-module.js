// order matters here - https://github.com/thescientist13/lit-ssr-css-modules/pull/3
import "@lit-labs/ssr-dom-shim/register-css-hook.js";
const { render, LitElementRenderer } = await import("@lit-labs/ssr");
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
import { html, literal, unsafeStatic } from "lit/static-html.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

async function executeRouteModule({
  moduleUrl,
  compilation,
  page = {},
  prerender = false,
  htmlContents = null,
  scripts = [],
  request,
  params = {},
  contentOptions = {},
}) {
  const data = {
    layout: null,
    body: null,
    frontmatter: null,
    html: null,
    hydration: false,
    staticPaths: null,
    hasStaticParams: null,
  };

  // prerender static content
  if (prerender) {
    for (const script of scripts) {
      await import(script);
    }

    const templateResult = html`${unsafeHTML(htmlContents)}`;

    data.html = await collectResult(render(templateResult));
  } else {
    const module = await import(moduleUrl).then((module) => module);
    const { body, layout, frontmatter, statics } = contentOptions;
    const {
      getLayout = null,
      getBody = null,
      getFrontmatter = null,
      isolation = true,
      hydration = true,
    } = module;

    if (isolation) {
      data.isolation = true;
    }

    if (hydration) {
      data.hydration = true;
    }

    if (statics && module.getStaticPaths) {
      data.staticPaths = await module.getStaticPaths();
    }

    if (statics && module.getStaticParams) {
      data.hasStaticParams = true;
    }

    if (params) {
      if (page.staticPaths) {
        const staticPaths = page.staticPaths ?? [];

        if (page.hasStaticParams) {
          const initParams = {
            ...params,
            ...staticPaths.find(
              (staticPath) => staticPath.params[page.segment.key] === params[page.segment.key],
            ),
          };

          const staticParams = module.getStaticParams
            ? await module.getStaticParams(initParams)
            : {};

          params = {
            ...params,
            ...staticParams,
          };
        }
      }
    }

    if (body) {
      if (module.default) {
        // for the Lit implementation, we render the custom element programmatically
        // and then extract the contents of the `<template>`
        const tagName = `${page.id}-page`;
        const tagNameLiteral = literal`${unsafeStatic(tagName)}`;
        // since Lit does not support passing data to the `constructor` have to map params to attributes for now
        const attributes =
          Object.entries(params).length > 0
            ? Object.entries(params)
                // literal object attributes need to be JSON stringified for Lit
                // https://github.com/lit/lit/discussions/2714#discussioncomment-2521396
                .map(
                  ([key, value]) =>
                    `${key}='${typeof value === "object" ? JSON.stringify(value) : value}'`,
                )
                .join(" ")
            : "";
        const litAttributes = literal`${unsafeStatic(attributes)}`;
        const pageTemplate = html`<${tagNameLiteral} ${litAttributes}"></${tagNameLiteral}>`;

        customElements.define(tagName, module.default);

        // only enable when default export is a LitElement
        // TODO: provide options for additional tag names from config
        // https://github.com/ProjectEvergreen/greenwood/issues/1687
        LitElementRenderer.renderOptions.push((element) =>
          element.localName === tagName ? { connectedCallback: true } : undefined,
        );

        // TODO: support disabling SSR on a per element basis from config
        // https://github.com/ProjectEvergreen/greenwood/issues/1687
        // LitElementRenderer.renderOptions.push((element) =>
        //   element.localName === 'my-element' ? {disableSsr: true} : undefined
        // );

        const ssrResult = render(pageTemplate);
        const ssrContent = await collectResult(ssrResult);
        const ssrContentsMatch =
          /<template shadowroot="open" shadowrootmode="open">(.*.)<\/template>/s;

        data.body = ssrContent.match(ssrContentsMatch)[1];
      } else if (getBody) {
        const templateResult = await getBody(compilation, page, request, params);

        data.body = await collectResult(render(templateResult));
      }
    }

    if (layout) {
      // support dynamic layouts that are just custom elements vs calls to getLayout
      if (!getLayout && !data.body && !page.isSSR && module.default) {
        // for the Lit implementation, we render the custom element programmatically
        // and then extract the contents of the `<template>`
        const tagName = `${page.id}-layout`;
        const tagNameLiteral = literal`${unsafeStatic(tagName)}`;
        // since Lit does not support passing data to the `constructor` have to map params to attributes for now
        const attributes =
          Object.entries(params).length > 0
            ? Object.entries(params)
                // literal object attributes need to be JSON stringified for Lit
                // https://github.com/lit/lit/discussions/2714#discussioncomment-2521396
                .map(
                  ([key, value]) =>
                    `${key}='${typeof value === "object" ? JSON.stringify(value) : value}'`,
                )
                .join(" ")
            : "";
        const litAttributes = literal`${unsafeStatic(attributes)}`;
        const layoutTemplate = html`<${tagNameLiteral} ${litAttributes}"></${tagNameLiteral}>`;

        customElements.define(tagName, module.default);

        // only enable when default export is a LitElement
        // TODO: provide options for additional tag names from config
        LitElementRenderer.renderOptions.push((element) =>
          element.localName === tagName ? { connectedCallback: true } : undefined,
        );

        // TODO: support disabling SSR on a per element basis from config
        // LitElementRenderer.renderOptions.push((element) =>
        //   element.localName === 'my-element' ? {disableSsr: true} : undefined
        // );

        const ssrResult = render(layoutTemplate);
        const ssrContent = await collectResult(ssrResult);
        const ssrContentsMatch =
          /<template shadowroot="open" shadowrootmode="open">(.*.)<\/template>/s;

        data.layout = ssrContent.match(ssrContentsMatch)[1];
      } else if (getLayout) {
        const templateResult = await getLayout(compilation, page, request, params);

        data.layout = await collectResult(render(templateResult));
      }
    }

    if (frontmatter && getFrontmatter) {
      data.frontmatter = await getFrontmatter(compilation, page);
    }
  }

  return data;
}

export { executeRouteModule };
