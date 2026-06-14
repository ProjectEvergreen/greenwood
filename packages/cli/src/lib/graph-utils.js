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

function getStaticPages(compilation) {
  return compilation.graph.filter((page) => {
    let isStaticRoute = !page.isSSR || page.staticPaths || page.prerender === true;

    if (page.isSSR && compilation.config.prerender && page.prerender !== false) {
      isStaticRoute = true;
    }

    return isStaticRoute;
  });
}

export { getDynamicPages, getStaticPages };
