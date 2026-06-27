/*
 *
 *
 * Manages SPA like client side routing for static pages.
 * This is a Greenwood default plugin.
 *
 */
import { checkResourceExists } from "../../lib/resource-utils.js";
import { getStaticPages, getMatchingPageByRoute } from "../../lib/graph-utils.js";
import { getStaticRouteFromDynamicRoute } from "../../lib/url-utils.js";
import fs from "node:fs/promises";

class StaticRouterResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["html"];
    this.contentType = "text/html";
    this.libPath = "@greenwood/router/router.js";
  }

  async shouldResolve(url) {
    return url.pathname.indexOf(this.libPath) >= 0;
  }

  async resolve() {
    const routerUrl = new URL("../../lib/router.js", import.meta.url);

    return new Request(`file://${routerUrl.pathname}`);
  }

  async shouldIntercept(url, request, response) {
    const { pathname, protocol } = url;
    const contentType = response.headers.get("Content-Type") || "";

    return (
      process.env.__GWD_COMMAND__ === "build" &&
      this.compilation.config.staticRouter &&
      !pathname.endsWith("/404/") &&
      protocol === "http:" &&
      contentType.indexOf(this.contentType) >= 0
    );
  }

  async intercept(url, request, response) {
    let body = await response.text();

    body = body.replace(
      "</head>",
      `
      <script type="module" src="/node_modules/@greenwood/cli/src/lib/router.js"></script>\n
      </head>
    `,
    );

    return new Response(body);
  }

  async shouldOptimize(url, response) {
    return (
      this.compilation.config.staticRouter &&
      !url.pathname.endsWith("/404/") &&
      response.headers.get("Content-Type").indexOf(this.contentType) >= 0
    );
  }

  async optimize(url, response) {
    let body = await response.text();
    const { basePath } = this.compilation.config;
    const { pathname } = url;
    const staticPages = getStaticPages(this.compilation);
    const isStaticRoute = getMatchingPageByRoute(
      { graph: staticPages, config: this.compilation.config },
      pathname,
    );
    const { outputDir } = this.compilation.context;
    const partial = body
      .match(/<body>(.*)<\/body>/s)[0]
      .replace("<body>", "")
      .replace("</body>", "");
    const outputPartialDirUrl = new URL(
      `./_routes${url.pathname.replace(basePath, "")}`,
      outputDir,
    );
    const outputPartialDirPathUrl = new URL(
      `file://${outputPartialDirUrl.pathname.split("/").slice(0, -1).join("/").concat("/")}`,
    );
    let currentLayout;
    let routeTags = [];

    staticPages
      .filter((page) => !page.route.endsWith("/404/"))
      .forEach((page) => {
        const { layout, route, staticPaths, segment } = page;

        if (staticPaths && staticPaths.length > 0) {
          staticPaths.forEach((staticPath) => {
            const staticRoute = getStaticRouteFromDynamicRoute(staticPath, segment, route);
            const key = staticRoute.slice(0, staticRoute.lastIndexOf("/")).replace(basePath, "");

            if (pathname === staticRoute) {
              currentLayout = layout;
            }

            routeTags.push(`
              <greenwood-route data-route="${staticRoute}" data-layout="${layout}" data-key="${basePath}/_routes${key}/index.html"></greenwood-route>
            `);
          });
        } else {
          const key =
            route === "/" ? "" : route.slice(0, route.lastIndexOf("/")).replace(basePath, "");

          if (pathname === route) {
            currentLayout = layout;
          }

          routeTags.push(`
            <greenwood-route data-route="${route}" data-layout="${layout}" data-key="${basePath}/_routes${key}/index.html"></greenwood-route>
          `);
        }
      });

    if (isStaticRoute) {
      if (!(await checkResourceExists(outputPartialDirPathUrl))) {
        await fs.mkdir(outputPartialDirPathUrl, {
          recursive: true,
        });
      }

      await fs.writeFile(new URL("./index.html", outputPartialDirUrl), partial);
    }

    body = body
      .replace(
        "</head>",
        `
          <script data-gwd="static-router">
            window.__greenwood = window.__greenwood || {};
            window.__greenwood.currentLayout = "${currentLayout}";
          </script>
        </head>
      `,
      )
      .replace(
        /<body>(.*)<\/body>/s,
        `
        <body>\n

          <router-outlet>
            ${partial.replace(/\$/g, "$$$")}\n
          </router-outlet>

          ${routeTags.join("\n")}
        </body>
      `,
      );

    return new Response(body);
  }
}

const greenwoodPluginStaticRouter = {
  type: "resource",
  name: "plugin-static-router",
  provider: (compilation) => new StaticRouterResource(compilation),
};

export { greenwoodPluginStaticRouter };
