// determines whether browser JavaScript should run during the build
// page-level config takes precedence over project-level config
function shouldPrerender(page, config) {
  return page.prerender ?? config.prerender;
}

// determines whether an SSR route should be exported as static HTML instead of an SSR bundle
// page-level config takes precedence over project-level config
function shouldStaticExport(page, config) {
  return page.staticExport ?? config.staticExport;
}

// determines whether a page should emit static HTML during the static render phase
// page-level config takes precedence over project-level config
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

// Select every page whose browser JavaScript should be executed during the build.
function getPrerenderPages(compilation) {
  const { config, graph } = compilation;

  return graph.filter((page) => shouldPrerender(page, config));
}

// get a page by route; including getStaticPaths or dynamic SSR pages
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
