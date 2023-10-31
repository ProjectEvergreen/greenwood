import { renderToString, renderFromHTML } from 'wc-compiler';

async function executeRouteModule({ moduleUrl, compilation, page = {}, prerender = false, htmlContents = null, scripts = [], request }) {
  const data = {
    template: null,
    body: null,
    frontmatter: null,
    html: null
  };

  if (prerender) {
    const scriptURLs = scripts.map(scriptFile => new URL(scriptFile));
    const { html } = await renderFromHTML(htmlContents, scriptURLs);

    data.html = html;
  } else {
    const module = await import(moduleUrl).then(module => module);
    const { prerender = false, getTemplate = null, getBody = null, getFrontmatter = null } = module;

    if (module.default) {
      const { html } = await renderToString(new URL(moduleUrl), false, request);

      data.body = html;
    } else {
      if (getBody) {
        data.body = await getBody(compilation, page, request);
      }
    }

    if (getTemplate) {
      data.template = await getTemplate(compilation, page);
    }

    if (getFrontmatter) {
      data.frontmatter = await getFrontmatter(compilation, page);
    }

    data.prerender = prerender;
  }

  return data;
}

export { executeRouteModule };