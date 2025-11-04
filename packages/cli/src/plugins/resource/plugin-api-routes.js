/*
 *
 * Manages routing to API routes.
 *
 */
import { requestAsObject } from "../../lib/resource-utils.js";
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

    const matchingRouteWithSegment = Array.from(this.compilation.manifest.apis.keys()).find(
      (key) => {
        const route = this.compilation.manifest.apis.get(key);
        return (
          route.segment &&
          new URLPattern({ pathname: `${route.segment.pathname}*` }).test(
            `https://example.com${pathname}`,
          )
        );
      },
    );

    return matchingRouteWithSegment || this.compilation.manifest.apis.has(pathname);
  }

  async serve(url, request) {
    // TODO: this could all probably get refactored...
    const { pathname } = url;
    const matchingRouteWithSegment = Array.from(this.compilation.manifest.apis.keys()).find(
      (key) => {
        const route = this.compilation.manifest.apis.get(key);
        return (
          route.segment &&
          new URLPattern({ pathname: route.segment.pathname }).test(
            `https://example.com${pathname}`,
          )
        );
      },
    );
    const api = this.compilation.manifest.apis.get(matchingRouteWithSegment ?? pathname);
    const apiUrl = new URL(api.pageHref);
    const href = apiUrl.href;
    const props =
      matchingRouteWithSegment && api.segment
        ? new URLPattern({ pathname: api.segment.pathname }).exec(`https://example.com${pathname}`)
            .pathname.groups
        : undefined;
    console.log("API Plugin PROPS to send", { props });

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

        worker.postMessage({ href, request: req, props });
      });
      const { headers, body, status, statusText } = response;

      return new Response(status === 204 ? null : body, {
        headers: new Headers(headers),
        status,
        statusText,
      });
    } else {
      const { handler } = await import(href);

      return await handler(request, props);
    }
  }
}

const greenwoodApiRoutesPlugin = {
  type: "resource",
  name: "plugin-api-routes",
  provider: (compilation) => new ApiRoutesResource(compilation),
};

export { greenwoodApiRoutesPlugin };
