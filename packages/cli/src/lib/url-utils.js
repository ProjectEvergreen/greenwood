// get the dynamic segments from a dynamic route, e.g. pages/blog/[slug].js
function getDynamicSegmentsFromRoute({ route }) {
  const dynamicRoute = route.replace("[", ":").replace("]", "");
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
    const matchesSegment =
      route !== "/404/" &&
      node.segment &&
      new URLPattern({ pathname: `${config.basePath}${node.segment.pathname}` }).test(
        `https://example.com${route}`,
      );

    if (!matchesSegment) {
      return false;
    }

    // for getStaticPaths routes, only match values enumerated at build time so unknown
    // values 404 in develop and serve alike
    return (
      !node.staticPaths ||
      node.staticPaths.some((staticPath) => {
        const staticRoute = getStaticRouteFromDynamicRoute(staticPath, node.segment, node.route);

        // compare the raw and encoded forms since URL percent-encodes the pathname
        return staticRoute === route || encodeURI(staticRoute) === route;
      })
    );
  });
}

// get params for dynamic routes from URLPattern based segment extraction
function getParamsFromSegment(compilation, segment, route) {
  const groups = new URLPattern({
    pathname: `${compilation.config.basePath}${segment.pathname}`,
  }).exec(`https://example.com${route}`)?.pathname?.groups;

  if (!groups) {
    return groups;
  }

  // URLPattern groups are percent-encoded, so decode them (mirroring graph.js) so params
  // round-trip losslessly to getBody / getStaticParams for non-ASCII / space slugs
  // https://github.com/ProjectEvergreen/greenwood/issues/1713
  return Object.fromEntries(
    Object.entries(groups).map(([key, value]) => {
      try {
        return [key, value === undefined ? value : decodeURIComponent(value)];
      } catch {
        return [key, value];
      }
    }),
  );
}

// get the full route for a static path
function getStaticRouteFromDynamicRoute(dynamicStaticPath, segment, route) {
  return `${route.replace(`[${segment.key}]`, dynamicStaticPath.params[segment.key])}`;
}

// decodeURIComponent throws URIError on a "%" that does not start a valid escape
// sequence (e.g. a frontmatter title like "100% Complete"), so fall back to
// returning the value untouched instead of aborting the whole build
// https://github.com/ProjectEvergreen/greenwood/issues/1709
function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// get the output file href for a static path; the param is encoded when spliced in since
// a raw value containing a literal "%" (e.g. "100%") is an invalid percent-sequence in a
// file URL that makes fs promises / fileURLToPath throw "URIError: URI malformed"
// https://github.com/ProjectEvergreen/greenwood/issues/1713
function getOutputHrefForStaticPath(dynamicStaticPath, segment, outputHref) {
  return outputHref.replace(
    `[${segment.key}]`,
    encodeURIComponent(dynamicStaticPath.params[segment.key]),
  );
}

export {
  getDynamicSegmentsFromRoute,
  getMatchingDynamicApiRoute,
  getParamsFromSegment,
  getMatchingDynamicSsrRoute,
  getStaticRouteFromDynamicRoute,
  safeDecodeURIComponent,
  getOutputHrefForStaticPath,
};
