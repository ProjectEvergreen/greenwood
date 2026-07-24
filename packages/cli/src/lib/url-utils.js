// get the dynamic segments from a dynamic route, e.g. pages/blog/[slug].js
function getDynamicSegmentsFromRoute({ route }) {
  // convert every bracket pair so a nested route doesn't leak a literal "[..]" into the URLPattern
  // https://github.com/ProjectEvergreen/greenwood/issues/1719
  const dynamicRoute = route.replace(/\[([^\]]+)\]/g, ":$1");
  // derive the key from the bracket in the route itself; stripping the extension substring
  // mangles params whose name contains it (e.g. [json].js -> "onjs", [posts].ts)
  // https://github.com/ProjectEvergreen/greenwood/issues/1719
  const segmentKey = route.match(/\[([^\]]+)\]/)?.[1] ?? "";

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
