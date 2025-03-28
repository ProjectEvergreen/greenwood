/*
 *
 * Manages routing to API routes.
 *
 */
import { requestAsObject } from "../../lib/resource-utils.js";
import { Worker } from "worker_threads";

class ApiRoutesResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
  }

  async shouldServe(url) {
    const { protocol, pathname } = url;

    return protocol.startsWith("http") && this.compilation.manifest.apis.has(pathname);
  }

  async serve(url, request) {
    const api = this.compilation.manifest.apis.get(url.pathname);
    const apiUrl = new URL(api.pageHref);
    const href = apiUrl.href;

    if (process.env.__GWD_COMMAND__ === "develop") {
      const workerUrl = new URL("../../lib/api-route-worker.js", import.meta.url);
      const req = await requestAsObject(request);

      // eslint-disable-next-line no-async-promise-executor
      const response = await new Promise(async (resolve, reject) => {
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

        worker.postMessage({ href, request: req });
      });
      const { headers, body, status, statusText } = response;

      return new Response(status === 204 ? null : body, {
        headers: new Headers(headers),
        status,
        statusText,
      });
    } else {
      const { handler } = await import(href);

      return await handler(request);
    }
  }
}

const greenwoodApiRoutesPlugin = {
  type: "resource",
  name: "plugin-api-routes",
  provider: (compilation) => new ApiRoutesResource(compilation),
};

export { greenwoodApiRoutesPlugin };
