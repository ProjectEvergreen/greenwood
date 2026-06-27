// get the dynamic segments from a dynamic route, e.g. pages/blog/[slug].js
function getDynamicSegmentsFromRoute({ route, relativePagePath, extension }) {
  const dynamicRoute = route.replace("[", ":").replace("]", "");
  const segmentKey = relativePagePath
    .split("/")
    [relativePagePath.split("/").length - 1].replace(extension, "")
    .replace("[", "")
    .replace("]", "")
    .replace(".", "");

  return { segmentKey, dynamicRoute };
}

// all API routes
function getMatchingDynamicApiRoute(apis, route) {
  return Array.from(apis.keys()).find((key) => {
    const page = apis.get(key);
    return (
      page.segment &&
      new URLPattern({ pathname: `${page.segment.pathname}*` }).test(`https://example.com${route}`)
    );
  });
}

// pure SSR routes
function getMatchingDynamicSsrRoute(compilation, route) {
  const { graph, config } = compilation;

  return graph.find((node) => {
    return (
      route !== "/404/" &&
      node.segment &&
      new URLPattern({ pathname: `${config.basePath}${node.segment.pathname}` }).test(
        `https://example.com${route}`,
      )
    );
  });
}

// get params for dynamic routes from URLPattern based segment extraction
function getParamsFromSegment(compilation, segment, route) {
  return new URLPattern({ pathname: `${compilation.config.basePath}${segment.pathname}` }).exec(
    `https://example.com${route}`,
  )?.pathname?.groups;
}

// get the full route for a static path
function getStaticRouteFromDynamicRoute(dynamicStaticPath, segment, route) {
  return `${route.replace(`[${segment.key}]`, dynamicStaticPath.params[segment.key])}`;
}

export {
  getDynamicSegmentsFromRoute,
  getMatchingDynamicApiRoute,
  getParamsFromSegment,
  getMatchingDynamicSsrRoute,
  getStaticRouteFromDynamicRoute,
};
