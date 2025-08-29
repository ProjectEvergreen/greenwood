/*
 *
 * Manages web standard resource related operations for HTML and markdown.
 * This is a Greenwood default plugin.
 *
 */
import fs from "node:fs/promises";
import { getPageLayout, getAppLayout, getGreenwoodScripts } from "../../lib/layout-utils.js";
import { requestAsObject } from "../../lib/resource-utils.js";
import { Worker } from "node:worker_threads";
import { parse } from "node-html-parser";

class StandardHtmlResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = [".html"];
    this.contentType = "text/html";
  }

  async shouldServe(url, request) {
    const { protocol, pathname } = url;
    const hasMatchingPageRoute = this.compilation.graph.find((node) => node.route === pathname);
    const isSPA = this.compilation.graph.find((node) => node.isSPA) && pathname.indexOf(".") < 0;

    return (
      protocol.startsWith("http") &&
      (hasMatchingPageRoute || (isSPA && request.headers.get("Accept").indexOf("text/html") >= 0))
    );
  }

  async serve(url, request) {
    const { config, context } = this.compilation;
    const { userWorkspace } = context;
    const { pathname } = url;
    const isSpaRoute = this.compilation.graph.find((node) => node.isSPA);
    const matchingRoute = this.compilation.graph.find((node) => node.route === pathname) || {};
    const { pageHref } = matchingRoute;
    const filePath =
      !matchingRoute.external && pageHref
        ? new URL(pageHref).pathname.replace(userWorkspace.pathname, "./")
        : "";
    const isHtmlContent = (filePath || "").split(".").pop() === "html";
    let body = "";
    let ssrBody;
    // final contents to return from the plugin
    let html = "";

    if (isHtmlContent) {
      body = await fs.readFile(new URL(pageHref), "utf-8");
    } else if (matchingRoute.servePage === "static") {
      const customStaticPageFormatPlugins = config.plugins
        .filter((plugin) => plugin.type === "resource" && !plugin.isGreenwoodDefaultPlugin)
        .map((plugin) => plugin.provider(this.compilation))
        .filter((plugin) => plugin.servePage === "static");

      for (const plugin of customStaticPageFormatPlugins) {
        if (await plugin.shouldServe(url, request)) {
          const response = await plugin.serve(url, request);

          body = await response.text();

          break;
        }
      }
    } else if (matchingRoute.isSSR) {
      const routeModuleLocationUrl = new URL(pageHref);
      const routeWorkerUrl = this.compilation.config.plugins
        .find((plugin) => plugin.type === "renderer")
        .provider().executeModuleUrl;
      const req = await requestAsObject(request);

      await new Promise((resolve, reject) => {
        const worker = new Worker(new URL("../../lib/ssr-route-worker.js", import.meta.url));

        worker.on("message", (result) => {
          if (result.body) {
            ssrBody = result.body;
          }

          resolve();
        });
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });

        worker.postMessage({
          executeModuleUrl: routeWorkerUrl.href,
          moduleUrl: routeModuleLocationUrl.href,
          compilation: JSON.stringify(this.compilation),
          page: JSON.stringify(matchingRoute),
          request: req,
          contentOptions: JSON.stringify({
            body: true,
          }),
        });
      });
    }

    if (matchingRoute.external) {
      body = matchingRoute.body;
    } else if (ssrBody) {
      body = ssrBody;
    }

    if (isSpaRoute) {
      html = await fs.readFile(new URL(isSpaRoute.pageHref), "utf-8");
    } else {
      const mergedPageLayoutContents = await getPageLayout(body, this.compilation, matchingRoute);
      const mergedAppLayoutContents = await getAppLayout(
        mergedPageLayoutContents,
        this.compilation,
        matchingRoute,
      );

      html = mergedAppLayoutContents;
    }

    html = await getGreenwoodScripts(html, this.compilation);

    return new Response(html, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }

  async shouldOptimize(url, response) {
    return response.headers.get("Content-Type")?.indexOf(this.contentType) >= 0;
  }

  async optimize(url, response) {
    const { optimization, basePath } = this.compilation.config;
    const { pathname } = url;
    const pageResources = this.compilation.graph.find((page) => page.route === pathname).resources;
    let body = await response.text();

    const root = parse(body, {
      blockTextElements: {
        noscript: false,
        pre: false,
      },
    });

    for (const pageResource of pageResources) {
      const keyedResource = this.compilation.resources.get(pageResource);
      const { contents, src, type, optimizationAttr, optimizedFileContents, optimizedFileName } =
        keyedResource;

      if (src) {
        if (type === "script") {
          const tag = root
            .querySelectorAll("script")
            .find((script) => script.getAttribute("src") === src);

          if (!optimizationAttr && (optimization === "default" || optimization === "none")) {
            const optimizedFilePath = `${basePath}/${optimizedFileName}`;

            body = body.replace(src, optimizedFilePath);
            body = body.replace(
              "<head>",
              `
              <head>
              <link rel="modulepreload" href="${optimizedFilePath}" as="script">
            `,
            );
          } else if (optimizationAttr === "inline" || optimization === "inline") {
            const isModule = tag.rawAttrs.indexOf('type="module') >= 0 ? ' type="module"' : "";

            body = body.replace(
              `<script ${tag.rawAttrs}></script>`,
              `
              <script ${isModule}>
                ${optimizedFileContents.replace(/\.\//g, `${basePath}/`).replace(/\$/g, "$$$")}
              </script>
            `,
            );
          } else if (optimizationAttr === "static" || optimization === "static") {
            body = body.replace(`<script ${tag.rawAttrs}></script>`, "");
          }
        } else if (type === "link") {
          const tag = root
            .querySelectorAll("link")
            .find((link) => link.getAttribute("href") === src);

          if (optimizationAttr !== "inline" && optimization !== "inline") {
            const optimizedFilePath = `${basePath}/${optimizedFileName}`;

            body = body.replace(src, optimizedFilePath);
            body = body.replace(
              "<head>",
              `
              <head>
              <link rel="preload" href="${optimizedFilePath}" as="style" crossorigin="anonymous"></link>
            `,
            );
          } else if (optimizationAttr === "inline" || optimization === "inline") {
            // https://github.com/ProjectEvergreen/greenwood/issues/810
            // when pre-rendering, puppeteer normalizes everything to <link .../>
            // but if not using pre-rendering, then it could come out as <link ...></link>
            // not great, but best we can do for now until #742
            body = body
              .replace(
                `<link ${tag.rawAttrs}>`,
                `
              <style>
                ${optimizedFileContents}
              </style>
            `,
              )
              .replace(
                `<link ${tag.rawAttrs}/>`,
                `
              <style>
                ${optimizedFileContents}
              </style>
            `,
              );
          }
        }
      } else {
        if (type === "script") {
          const tag = root
            .querySelectorAll("script")
            .find((script) => script.innerHTML === contents);

          if (optimizationAttr === "static" || optimization === "static") {
            body = body.replace(
              `<script ${tag.rawAttrs}>${contents.replace(/\.\//g, "/").replace(/\$/g, "$$$")}</script>`,
              "",
            );
          } else if (optimizationAttr === "none") {
            body = body.replace(
              contents,
              contents.replace(/\.\//g, `${basePath}/`).replace(/\$/g, "$$$"),
            );
          } else {
            body = body.replace(
              contents,
              optimizedFileContents.replace(/\.\//g, `${basePath}/`).replace(/\$/g, "$$$"),
            );
          }
        } else if (type === "style") {
          body = body.replace(contents, optimizedFileContents);
        }
      }
    }

    return new Response(body);
  }
}

const greenwoodPluginStandardHtml = {
  type: "resource",
  name: "plugin-standard-html",
  provider: (compilation) => new StandardHtmlResource(compilation),
};

export { greenwoodPluginStandardHtml };
