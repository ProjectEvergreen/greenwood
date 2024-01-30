import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { html } from 'lit';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

async function executeRouteModule({ moduleUrl, compilation, page, prerender, htmlContents, scripts }) {
  const data = {
    template: null,
    body: null,
    frontmatter: null,
    html: null
    // hydrate: false,
    // pageData: {}
  };

  // prerender static content
  if (prerender) {
    for (const script of scripts) {
      await import(script);
    }

    const templateResult = html`${unsafeHTML(htmlContents)}`;

    data.html = await collectResult(render(templateResult));
  } else {
    const module = await import(moduleUrl).then(module => module);
    const { getTemplate = null, getBody = null, getFrontmatter = null, isolation = true } = module;

    // TODO cant we get these from just pulling from the file during the graph phase?
    // https://github.com/ProjectEvergreen/greenwood/issues/991
    if (isolation) {
      data.isolation = true;
    }

    // if (hydration) {
    //   data.hydrate = true;
    // }

    // if (loader) {
    //   data.pageData = await loader(); // request, compilation, etc can go here
    //   console.log(data.pageData);
    // }

    if (getBody) {
      const templateResult = await getBody(compilation, page, data.pageData);

      data.body = await collectResult(render(templateResult));
    }

    if (getTemplate) {
      const templateResult = await getTemplate(compilation, page);

      data.template = await collectResult(render(templateResult));
    }

    if (getFrontmatter) {
      data.frontmatter = await getFrontmatter(compilation, page);
    }
  }

  return data;
}

export { executeRouteModule };