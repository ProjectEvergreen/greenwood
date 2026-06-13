function getDynamicPages(compilation) {
  const { config, graph } = compilation;

  return graph.filter((page) => {
    let isSsrRoute = page.isSSR && !page.staticPaths && page.prerender !== true;

    if (isSsrRoute && config.prerender && page.prerender !== false) {
      isSsrRoute = false;
    }

    return isSsrRoute;
  });
}

export { getDynamicPages };
