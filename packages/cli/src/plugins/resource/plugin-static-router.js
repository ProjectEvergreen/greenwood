/*
 *
 *
 * Manages SPA like client side routing for static pages.
 * This is a Greenwood default plugin.
 *
 */
import { checkResourceExists } from "../../lib/resource-utils.js";
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
      !pathname.startsWith("/404") &&
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
      !url.pathname.startsWith("/404") &&
      response.headers.get("Content-Type").indexOf(this.contentType) >= 0
    );
  }

  async optimize(url, response) {
    let body = await response.text();
    const { basePath } = this.compilation.config;
    const { pathname } = url;
    const isStaticRoute = this.compilation.graph.find(
      (page) => page.route === pathname && !page.isSSR,
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

    const routeTags = this.compilation.graph
      .filter((page) => !page.isSSR)
      .filter((page) => !page.route.endsWith("/404/"))
      .map((page) => {
        const layout =
          page.pageHref && page.pageHref.split(".").pop() === this.extensions[0]
            ? page.route
            : page.layout;
        const key =
          page.route === "/"
            ? ""
            : page.route.slice(0, page.route.lastIndexOf("/")).replace(basePath, "");

        if (pathname === page.route) {
          currentLayout = layout;
        }
        return `
          <greenwood-route data-route="${page.route}" data-layout="${layout}" data-key="${basePath}/_routes${key}/index.html"></greenwood-route>
        `;
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
