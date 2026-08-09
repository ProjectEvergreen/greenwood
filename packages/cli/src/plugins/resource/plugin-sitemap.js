/*
 *
 * Serves the sitemap during development, either from a dynamic sitemap.xml.(js|ts) module
 * in the user's workspace or from a static sitemap.xml when both exist.
 *
 * This is a Greenwood default plugin.
 *
 */
import fs from "node:fs/promises";
import { requestAsObject, mapJsonReplacer } from "../../lib/resource-utils.js";
import { Worker } from "node:worker_threads";

class SitemapResource {
  constructor(compilation) {
    this.compilation = compilation;
  }

  async shouldServe(url) {
    // the custom loader (loader.js) provides no manifest when instantiating resource plugins
    const { sitemap } = this.compilation.manifest ?? {};

    // a static sitemap.xml gets resolved to its workspace file URL before serving,
    // so match on the resolved location to win out over generic file serving
    return (
      process.env.__GWD_COMMAND__ === "develop" &&
      !!sitemap &&
      (url.pathname === sitemap.route || (!!sitemap.static && url.href === sitemap.pageHref))
    );
  }

  async serve(url, request) {
    const { sitemap } = this.compilation.manifest;

    // a static sitemap.xml takes precedence over a dynamic module when both exist
    if (sitemap.static) {
      return new Response(await fs.readFile(new URL(sitemap.pageHref), "utf-8"), {
        headers: new Headers({
          "Content-Type": "text/xml",
        }),
      });
    }

    const workerUrl = new URL("../../lib/api-route-worker.js", import.meta.url);
    const req = await requestAsObject(request);

    const response = await new Promise((resolve, reject) => {
      const worker = new Worker(workerUrl);

      worker.once("message", (result) => {
        resolve(result);
        worker.terminate();
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
        compilation: JSON.stringify(this.compilation, mapJsonReplacer),
      });
    });
    const { headers, body, status, statusText } = response;

    // null-body statuses cannot take a body per the Fetch spec
    return new Response([204, 205, 304].includes(status) ? null : body, {
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
