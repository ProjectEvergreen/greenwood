import { renderToString, renderFromHTML } from "wc-compiler";

async function executeRouteModule({
  moduleUrl,
  compilation,
  page = {},
  prerender = false,
  htmlContents = null,
  scripts = [],
  request,
  contentOptions = {},
}) {
  const data = {
    layout: null,
    body: null,
    frontmatter: null,
    html: null,
  };

  if (prerender) {
    const scriptURLs = scripts.map((scriptFile) => new URL(scriptFile));
    const { html } = await renderFromHTML(htmlContents, scriptURLs);

    data.html = html;
  } else {
    const module = await import(moduleUrl).then((module) => module);
    const { body, layout, frontmatter } = contentOptions;
    const {
      prerender = false,
      getLayout = null,
      getBody = null,
      getFrontmatter = null,
      isolation,
    } = module;

    if (body) {
      if (module.default) {
        const { html } = await renderToString(new URL(moduleUrl), false, { request, compilation });

        data.body = html;
      } else if (getBody) {
        data.body = await getBody(compilation, page, request);
      }
    }

    if (layout) {
      // TODO can this just be managed from the call site?
      // support dynamic layouts that are just custom elements
      if (!getLayout && !data.body && !page.isSSR && module.default) {
        const { html } = await renderToString(new URL(moduleUrl), false, { request, compilation });

        data.layout = html;
      } else if (getLayout) {
        data.layout = await getLayout(compilation, page);
      }
    }

    if (frontmatter && getFrontmatter) {
      data.frontmatter = await getFrontmatter(compilation, page);
    }

    // TODO cant we get these from just pulling from the file during the graph phase?
    // https://github.com/ProjectEvergreen/greenwood/issues/991
    data.prerender = prerender;
    data.isolation = isolation;
  }

  return data;
}

export { executeRouteModule };
