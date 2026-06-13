import { renderToString, renderFromHTML } from "wc-compiler";

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
    staticPaths: null,
    hasStaticParams: null,
  };

  if (prerender) {
    const scriptURLs = scripts.map((scriptFile) => new URL(scriptFile));
    const { html } = await renderFromHTML(htmlContents, scriptURLs);

    data.html = html;
  } else {
    const module = await import(moduleUrl).then((module) => module);
    const { body, layout, frontmatter, statics } = contentOptions;
    const {
      prerender = null,
      getLayout = null,
      getBody = null,
      getFrontmatter = null,
      isolation,
    } = module;

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
        const { html } = await renderToString(new URL(moduleUrl), false, {
          request,
          compilation,
          params,
        });

        data.body = html;
      } else if (getBody) {
        data.body = await getBody(compilation, page, request, params);
      }
    }

    if (layout) {
      // support dynamic layouts that are just custom elements vs calls to getLayout
      if (!getLayout && !data.body && !page.isSSR && module.default) {
        const { html } = await renderToString(new URL(moduleUrl), false, {
          compilation,
          page,
          params,
        });

        data.layout = html;
      } else if (getLayout) {
        data.layout = await getLayout(compilation, page, request, params);
      }
    }

    if (frontmatter && getFrontmatter) {
      data.frontmatter = await getFrontmatter(compilation, page);
    }

    data.prerender = prerender;
    data.isolation = isolation;
  }

  return data;
}

export { executeRouteModule };
