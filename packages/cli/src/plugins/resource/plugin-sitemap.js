/*
 *
 * Serves a dynamic sitemap during development from a sitemap.xml.(js|ts) module
 * in the user's workspace.
 *
 * This is a Greenwood default plugin.
 *
 */
import { requestAsObject } from "../../lib/resource-utils.js";
import { Worker } from "node:worker_threads";

class SitemapResource {
  constructor(compilation) {
    this.compilation = compilation;
  }

  async shouldServe(url) {
    const { sitemap } = this.compilation.manifest;

    return (
      process.env.__GWD_COMMAND__ === "develop" && !!sitemap && url.pathname === sitemap.route
    );
  }

  async serve(url, request) {
    const { sitemap } = this.compilation.manifest;
    const workerUrl = new URL("../../lib/sitemap-route-worker.js", import.meta.url);
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

      worker.postMessage({
        href: sitemap.pageHref,
        request: req,
        compilation: JSON.stringify(this.compilation),
      });
    });
    const { headers, body, status, statusText } = response;

    return new Response(status === 204 ? null : body, {
      headers: new Headers(headers),
      status,
      statusText,
    });
  }
}

const greenwoodPluginSitemap = {
  type: "resource",
  name: "plugin-sitemap",
  provider: (compilation) => new SitemapResource(compilation),
};

export { greenwoodPluginSitemap };
