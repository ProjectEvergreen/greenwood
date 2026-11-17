/*
 *
 * Manages web standard resource related operations for HTML and markdown.
 * This is a Greenwood default plugin.
 *
 */
import fs from "node:fs/promises";
import fm from "front-matter";
import { getPageLayout, getAppLayout, getGreenwoodScripts } from "../../lib/layout-utils.js";
import { requestAsObject } from "../../lib/resource-utils.js";
import { getMatchingDynamicSsrRoute, getParamsFromSegment } from "../../lib/url-utils.js";
import { getMatchingPageByRoute } from "../../lib/graph-utils.js";
import { Worker } from "node:worker_threads";
import { parseHtml, createHtmlElement, setHtmlText } from "../../lib/html-utils.js";

class StandardHtmlResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["html"];
    this.contentType = "text/html";
  }

  async shouldServe(url, request) {
    const { protocol, pathname } = url;
    const hasMatchingPageRoute = this.compilation.graph.find((node) => node.route === pathname);
    const isSPA = this.compilation.graph.find((node) => node.isSPA) && pathname.indexOf(".") < 0;
    const matchingRouteWithSegment = getMatchingDynamicSsrRoute(this.compilation, pathname);

    return (
      protocol.startsWith("http") &&
      (hasMatchingPageRoute ||
        matchingRouteWithSegment ||
        (isSPA && request.headers.get("Accept").indexOf("text/html") >= 0))
    );
  }

  async serve(url, request) {
    const { config, context } = this.compilation;
    const { userWorkspace } = context;
    const { pathname } = url;
    const isSpaRoute = this.compilation.graph.find((node) => node.isSPA);
    const matchingRouteWithSegment = getMatchingDynamicSsrRoute(this.compilation, pathname);
    const matchingRoute =
      this.compilation.graph.find((node) => node.route === pathname) ??
      matchingRouteWithSegment ??
      {};
    const params = matchingRoute.segment
      ? getParamsFromSegment(this.compilation, matchingRoute.segment, pathname)
      : undefined;
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
      try {
        body = await fs.readFile(new URL(pageHref), "utf-8");
      } catch (e) {
        // in development the graph is only generated once, so a matching page may since be deleted
        if (e.code === "ENOENT" && process.env.__GWD_COMMAND__ === "develop") {
          return new Response(null, { status: 404 });
        }

        throw e;
      }

      // purge frontmatter data from HTML files that only have a `<body>` tag
      // frontmatter outside of an <html> tag will get ignored by node-html-parser
      if (body.trim().startsWith("---")) {
        // strip only the leading frontmatter block via the same parser that reads its
        // attributes, so a later `---` in the body isn't greedily matched and deleted
        // https://github.com/ProjectEvergreen/greenwood/issues/1711
        body = fm(body).body;
      }
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
    } else if (matchingRoute.isSSR || matchingRouteWithSegment?.isSSR) {
      const routeModuleLocationUrl = new URL(pageHref ?? matchingRouteWithSegment?.pageHref);
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
          page: JSON.stringify(matchingRouteWithSegment ?? matchingRoute),
          request: req,
          contentOptions: JSON.stringify({
            body: true,
          }),
          params: params ? JSON.stringify(params) : params,
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
      const mergedPageLayoutContents = await getPageLayout(
        body,
        this.compilation,
        matchingRoute,
        params,
      );
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
    const pageResources = getMatchingPageByRoute(this.compilation, pathname).resources;
    const root = parseHtml(await response.text());
    // Capture original identities before mutating nodes, including repeated resources.
    const tags = root.querySelectorAll("script, link, style").map((tag) => ({
      tag,
      type: tag.localName,
      src: tag.getAttribute(tag.localName === "link" ? "href" : "src"),
      contents: tag.innerHTML,
    }));

    for (const pageResource of pageResources) {
      const { contents, src, type, optimizationAttr, optimizedFileContents, optimizedFileName } =
        this.compilation.resources.get(pageResource);
      const matches = tags.filter(
        (entry) =>
          entry.type === type &&
          (type !== "link" || entry.tag.getAttribute("rel") === "stylesheet") &&
          (src ? entry.src === src : !entry.src && entry.contents === contents),
      );

      for (const { tag } of matches) {
        if (src && type === "script") {
          if (!optimizationAttr && (optimization === "default" || optimization === "none")) {
            const optimizedFilePath = `${basePath}/${optimizedFileName}`;

            tag.setAttribute("src", optimizedFilePath);
            root.querySelector("head")?.prepend(
              createHtmlElement("link", {
                rel: "modulepreload",
                href: optimizedFilePath,
                as: "script",
              }),
            );
          } else if (optimizationAttr === "inline" || optimization === "inline") {
            const attributes = tag.getAttribute("type")?.startsWith("module")
              ? { type: "module" }
              : {};

            tag.replaceWith(
              createHtmlElement(
                "script",
                attributes,
                optimizedFileContents.replace(/\.\//g, () => `${basePath}/`),
              ),
            );
          } else if (optimizationAttr === "static" || optimization === "static") {
            tag.remove();
          }
        } else if (src && type === "link") {
          if (optimizationAttr !== "inline" && optimization !== "inline") {
            const optimizedFilePath = `${basePath}/${optimizedFileName}`;

            tag.setAttribute("href", optimizedFilePath);
            root.querySelector("head")?.prepend(
              createHtmlElement("link", {
                rel: "preload",
                href: optimizedFilePath,
                as: "style",
                crossorigin: "anonymous",
              }),
            );
          } else {
            tag.replaceWith(createHtmlElement("style", {}, optimizedFileContents));
          }
        } else if (type === "script") {
          if (optimizationAttr === "static" || optimization === "static") {
            tag.remove();
          } else {
            const script = optimizationAttr === "none" ? contents : optimizedFileContents;

            setHtmlText(
              tag,
              script.replace(/\.\//g, () => `${basePath}/`),
            );
          }
        } else if (type === "style") {
          setHtmlText(tag, optimizedFileContents);
        }
      }
    }

    return new Response(root.toString());
  }
}

const greenwoodPluginStandardHtml = {
  type: "resource",
  name: "plugin-standard-html",
  provider: (compilation) => new StandardHtmlResource(compilation),
};

export { greenwoodPluginStandardHtml };
