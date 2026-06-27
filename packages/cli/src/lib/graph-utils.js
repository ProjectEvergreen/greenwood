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
function getMatchingPageByRoute(compilation, route) {
  const { graph, config } = compilation;

  return graph.find((page) => {
    return (
      // exact match
      page.route === route ||
      // dynamic route
      (page.segment &&
        new URLPattern({ pathname: `${config.basePath}${page.segment.pathname}` }).test(
          `https://example.com${route}`,
        )) ||
      // getStaticPaths
      (page.hasStaticParams &&
        page.staticPaths.find((path) => {
          const { segment } = page;
          const staticRoute = route.replace(`[${segment.key}]`, path.params[segment.key]);

          return `${config.basePath}${staticRoute}` === route;
        }))
    );
  });
}

export { getDynamicPages, getStaticPages, getMatchingPageByRoute };
