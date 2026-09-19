// determines whether browser JavaScript should run during the build.
// A page-level value, including an explicit false, takes precedence over the project-wide default.
function shouldPrerender(page, config) {
  return page.prerender ?? config.prerender;
}

// determines whether an SSR route should be exported as HTML instead of bundled for request-time rendering.
// This is intentionally independent from prerender configuration (`shouldPrerender`).
function shouldStaticExport(page, config) {
  return page.staticExport ?? config.staticExport;
}

// Static source pages (HTML, markdown, etc) and getStaticPaths routes always emit HTML.
// Other SSR routes only emit HTML when `staticExport` is enabled for the route or project.
function isStaticPage(page, config) {
  return !page.isSSR || !!page.staticPaths || shouldStaticExport(page, config);
}

// Select SSR routes that still need request-time route bundles.
function getDynamicPages(compilation) {
  const { config, graph } = compilation;

  return graph.filter((page) => page.isSSR && !isStaticPage(page, config));
}

// Select every page that should emit an HTML file during the static render phase.
function getStaticPages(compilation) {
  const { config, graph } = compilation;

  return graph.filter((page) => isStaticPage(page, config));
}

// Select every page whose browser JavaScript should be executed during the build. Whether these
// pages emit HTML or remain runtime SSR routes is decided separately.
function getPrerenderPages(compilation) {
  const { config, graph } = compilation;

  return graph.filter((page) => shouldPrerender(page, config));
}

// get a page by route; including getStaticPaths or dynamic SSR pages
// not sure if there's a better way to filter through all the possible matches in one-shot?
function getMatchingPageByRoute(compilation, route) {
  const { graph, config } = compilation;

  const exactMatch = graph.find((page) => page.route === route);

  if (exactMatch) {
    return exactMatch;
  }

  const staticParamsMatch = graph.find(
    (page) =>
      page.hasStaticParams &&
      page.staticPaths.find((path) => {
        const { segment } = page;
        const staticRoute = route.replace(`[${segment.key}]`, path.params[segment.key]);

        return `${config.basePath}${staticRoute}` === route;
      }),
  );

  if (staticParamsMatch) {
    return staticParamsMatch;
  }

  const dynamicMatch = graph.find(
    (page) =>
      page.segment &&
      new URLPattern({ pathname: `${config.basePath}${page.segment.pathname}` }).test(
        `https://example.com${route}`,
      ),
  );

  if (dynamicMatch) {
    return dynamicMatch;
  }
}

export {
  getDynamicPages,
  getStaticPages,
  getPrerenderPages,
  getMatchingPageByRoute,
  isStaticPage,
  shouldPrerender,
  shouldStaticExport,
};
