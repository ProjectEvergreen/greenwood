// pages that are pure SSR
function getDynamicPages(compilation) {
  const { config, graph } = compilation;

  // would be nice to do this without the extra conditional (good first issue)
  return graph.filter((page) => {
    let isSsrRoute = page.isSSR && !page.staticPaths && page.prerender !== true;

    if (isSsrRoute && config.prerender && page.prerender !== false) {
      isSsrRoute = false;
    }

    return isSsrRoute;
  });
}

// pages that emit an HTML file
function getStaticPages(compilation) {
  const { config, graph } = compilation;

  return graph.filter(
    (page) =>
      !page.isSSR ||
      (page.isSSR && page.prerender) ||
      (page.isSSR && page.prerender !== false && config.prerender) ||
      page.staticPaths,
  );
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

export { getDynamicPages, getStaticPages, getMatchingPageByRoute };
