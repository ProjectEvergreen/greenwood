/*
 *
 * Manages routing to API routes.
 *
 */
import { requestAsObject } from "../../lib/resource-utils.js";
import { getMatchingDynamicApiRoute, getParamsFromSegment } from "../../lib/url-utils.js";
import { Worker } from "node:worker_threads";

class ApiRoutesResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
  }

  async shouldServe(url) {
    const { basePath } = this.compilation.config;
    const { protocol, pathname } = url;

    if (!protocol.startsWith("http") || !pathname.startsWith(`${basePath}/api/`)) {
      return;
    }

    const matchingRouteWithSegment = getMatchingDynamicApiRoute(
      this.compilation.manifest.apis,
      pathname,
    );

    return matchingRouteWithSegment || this.compilation.manifest.apis.has(pathname);
  }

  async serve(url, request) {
    const { pathname } = url;
    const matchingRouteWithSegment = getMatchingDynamicApiRoute(
      this.compilation.manifest.apis,
      pathname,
    );
    const api = this.compilation.manifest.apis.get(matchingRouteWithSegment ?? pathname);
    const apiUrl = new URL(api.pageHref);
    const href = apiUrl.href;
    const params =
      matchingRouteWithSegment && api.segment
        ? getParamsFromSegment(api.segment, pathname)
        : undefined;

    if (process.env.__GWD_COMMAND__ === "develop") {
      const workerUrl = new URL("../../lib/api-route-worker.js", import.meta.url);
      const req = await requestAsObject(request);

      const response = await new Promise((resolve, reject) => {
        const worker = new Worker(workerUrl);

        worker.on("message", (result) => {
          resolve(result);
        });
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });

        worker.postMessage({ href, request: req, params });
      });
      const { headers, body, status, statusText } = response;

      return new Response(status === 204 ? null : body, {
        headers: new Headers(headers),
        status,
        statusText,
      });
    } else {
      const { handler } = await import(href);

      return await handler(request, { params });
    }
  }
}

const greenwoodApiRoutesPlugin = {
  type: "resource",
  name: "plugin-api-routes",
  provider: (compilation) => new ApiRoutesResource(compilation),
};

export { greenwoodApiRoutesPlugin };
