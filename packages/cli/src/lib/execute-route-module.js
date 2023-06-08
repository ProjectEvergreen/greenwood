import { renderToString, renderFromHTML } from 'wc-compiler';

// TODO simplify this API signature (lot of things could be combined)
// - route, label and id could just be the current page
// - scripts is already part of the compilation
async function executeRouteModule({ moduleUrl, compilation, page = {}, prerender = false, htmlContents = null, scripts = [] }) {
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
    const { getTemplate = null, getBody = null, getFrontmatter = null } = module;

    if (module.default) {
      const { html } = await renderToString(new URL(moduleUrl), false);

      data.body = html;
    } else {
      if (getBody) {
        data.body = await getBody(compilation, page);
      }
    }

    if (getTemplate) {
      data.template = await getTemplate(compilation, page);
    }

    if (getFrontmatter) {
      data.frontmatter = await getFrontmatter(compilation, page);
    }
  }

  return data;
}

export { executeRouteModule };