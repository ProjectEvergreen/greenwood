import { mergeImportMap } from "../../lib/node-modules-utils.js";
import { checkResourceExists } from "../../lib/resource-utils.js";
import {
  activeFrontmatterKeys,
  cleanContentCollection,
  pruneGraph,
  filterContentByCollection,
  filterContentByRoute,
} from "../../lib/content-utils.js";
import fs from "node:fs/promises";

const importMap = {
  "@greenwood/cli/src/data/client.js": "/node_modules/@greenwood/cli/src/data/client.js",
  "@greenwood/cli/src/lib/content-utils.js":
    "/node_modules/@greenwood/cli/src/lib/content-utils.js",
};

class ContentAsDataResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.contentType = ["text/html"];
  }

  async shouldServe(url) {
    const { activeContent } = this.compilation.config;
    const { pathname } = url;

    return activeContent && pathname === "/___graph.json";
  }

  async serve(url, request) {
    const { graph } = this.compilation;
    const contentKey = request.headers.get("x-content-key") ?? "";
    const keyPieces = contentKey.split("-");
    let status;
    let body;

    if (contentKey === "") {
      status = 403;
      body = "Bad Request - No Cache Key found";
    } else {
      status = 200;

      if (contentKey === "graph") {
        body = graph;
      } else if (keyPieces[0] === "collection") {
        body = filterContentByCollection(graph, keyPieces[1]);
      } else if (keyPieces[0] === "route") {
        body = filterContentByRoute(graph, keyPieces[1]);
      }

      if (process.env.__GWD_COMMAND__ === "build") {
        const fileKey = `./data-${contentKey.replace(/\//g, "_")}.json`;

        if (!(await checkResourceExists(new URL(fileKey, this.compilation.context.outputDir)))) {
          await fs.writeFile(
            new URL(fileKey, this.compilation.context.outputDir),
            JSON.stringify(pruneGraph(body)),
            "utf-8",
          );
        }
      }
    }

    return new Response(JSON.stringify(pruneGraph(body)), {
      status,
      statusText: "OK",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    });
  }

  async shouldIntercept(url, request, response) {
    const { activeContent } = this.compilation.config;

    return response.headers.get("Content-Type")?.indexOf(this.contentType[0]) >= 0 && activeContent;
  }

  async intercept(url, request, response) {
    const { polyfills, devServer } = this.compilation.config;
    const matchingRoute = this.compilation.graph.find((page) => page.route === url.pathname);
    const body = await response.text();
    let newBody = body;

    if (process.env.__GWD_COMMAND__ === "develop") {
      newBody = mergeImportMap(body, importMap, polyfills.importMaps);
    }

    newBody = newBody.replace(
      "<head>",
      `
      <head>
        <script id="data-client-options">
          globalThis.__CONTENT_OPTIONS__ = globalThis.__CONTENT_OPTIONS__
            ? globalThis.__CONTENT_OPTIONS__
            : {
                PORT: ${devServer.port},
                PRERENDER: "${this.compilation.config.prerender}",
              }
        </script>
    `,
    );

    // Greenwood active frontmatter keys
    for (const key of activeFrontmatterKeys) {
      const interpolatedFrontmatter = "\\$\\{globalThis.page." + key + "\\}";
      const needle =
        key === "title" && !matchingRoute.title ? matchingRoute.label : matchingRoute[key];

      newBody = newBody.replace(new RegExp(interpolatedFrontmatter, "g"), needle);
    }

    // custom user frontmatter data
    for (const fm in matchingRoute.data) {
      const interpolatedFrontmatter = "\\$\\{globalThis.page.data." + fm + "\\}";
      const needle =
        typeof matchingRoute.data[fm] === "string"
          ? matchingRoute.data[fm]
          : JSON.stringify(matchingRoute.data[fm]).replace(/"/g, "&quot;");

      newBody = newBody.replace(new RegExp(interpolatedFrontmatter, "g"), needle);
    }

    // collections
    for (const collection in this.compilation.collections) {
      const interpolatedFrontmatter = "\\$\\{globalThis.collection." + collection + "\\}";
      const cleanedCollections = cleanContentCollection(this.compilation.collections[collection]);

      newBody = newBody.replace(
        new RegExp(interpolatedFrontmatter, "g"),
        JSON.stringify(cleanedCollections).replace(/"/g, "&quot;"),
      );
    }

    return new Response(newBody);
  }

  async shouldOptimize(url, response) {
    const { activeContent } = this.compilation.config;

    return response.headers.get("Content-Type").indexOf(this.contentType[0]) >= 0 && activeContent;
  }

  async optimize(url, response) {
    let body = await response.text();

    body = body.replace(
      "<head>",
      `
      <head>
        <script id="content-as-data-state">
          globalThis.__CONTENT_AS_DATA_STATE__ = true;
        </script>
    `,
    );

    return new Response(body);
  }
}

const greenwoodPluginContentAsData = {
  type: "resource",
  name: "plugin-active-content",
  provider: (compilation) => new ContentAsDataResource(compilation),
};

export { greenwoodPluginContentAsData };
