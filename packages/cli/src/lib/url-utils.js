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

function getMatchingDynamicApiRoute(apis, pathname) {
  return Array.from(apis.keys()).find((key) => {
    const route = apis.get(key);
    return (
      route.segment &&
      new URLPattern({ pathname: `${route.segment.pathname}*` }).test(
        `https://example.com${pathname}`,
      )
    );
  });
}

function getMatchingDynamicSsrRoute(graph, pathname) {
  return graph.find((node) => {
    return (
      (pathname !== "/404/") !== "/404/" &&
      node.segment &&
      new URLPattern({ pathname: node.segment.pathname }).test(`https://example.com${pathname}`)
    );
  });
}

function getParamsFromSegment(segment, pathname) {
  return new URLPattern({ pathname: segment.pathname }).exec(`https://example.com${pathname}`)
    .pathname.groups;
}

export {
  getDynamicSegmentsFromRoute,
  getMatchingDynamicApiRoute,
  getParamsFromSegment,
  getMatchingDynamicSsrRoute,
};
