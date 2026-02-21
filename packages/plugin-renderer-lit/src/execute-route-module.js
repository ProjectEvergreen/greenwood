import { render } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
import { html, literal, unsafeStatic } from "lit/static-html.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

async function executeRouteModule({
  moduleUrl,
  compilation,
  page,
  prerender,
  htmlContents,
  scripts,
  contentOptions = {},
}) {
  const data = {
    layout: null,
    body: null,
    frontmatter: null,
    html: null,
    hydration: false,
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
    const { body, layout, frontmatter } = contentOptions;
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

    if (body) {
      // TODO: update caveats and document SSR pages on the website
      if (module.default) {
        // for the Lit implementation, we render the custom element programmatically
        // and then extract the contents of the `<template>`
        const tagName = `${page.id}-page`;
        const tagNameLiteral = literal`${unsafeStatic(tagName)}`;
        const pageTemplate = html`<${tagNameLiteral}></${tagNameLiteral}>`;

        customElements.define(tagName, module.default);

        // TODO: constructor props / dynamic routing
        const ssrResult = render(pageTemplate);
        const ssrContent = await collectResult(ssrResult);
        const ssrContentsMatch =
          /<template shadowroot="open" shadowrootmode="open">(.*.)<\/template>/s;

        data.body = ssrContent.match(ssrContentsMatch)[1];
      } else if (getBody) {
        const templateResult = await getBody(compilation, page, data.pageData);

        data.body = await collectResult(render(templateResult));
      }
    }

    if (layout && getLayout) {
      const templateResult = await getLayout(compilation, page);

      data.layout = await collectResult(render(templateResult));
    }

    if (frontmatter && getFrontmatter) {
      data.frontmatter = await getFrontmatter(compilation, page);
    }
  }

  return data;
}

export { executeRouteModule };
