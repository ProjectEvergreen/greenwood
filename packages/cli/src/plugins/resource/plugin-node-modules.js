/*
 *
 * Detects and fully resolves requests to node_modules and handles creating an importMap.
 *
 */
import { checkResourceExists } from "../../lib/resource-utils.js";
import fs from "fs/promises";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import {
  getPackageJsonForProject,
  getResolvedHrefFromPathnameShortcut,
  mergeImportMap,
} from "../../lib/node-modules-utils.js";
import { walkPackageJson, IMPORT_MAP_RESOLVED_PREFIX } from "../../lib/walker-package-ranger.js";

let generatedImportMap;

class NodeModulesResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["js", "mjs"];
    this.contentType = "text/javascript";
  }

  async shouldResolve(url) {
    const { pathname } = url;

    return pathname.startsWith(IMPORT_MAP_RESOLVED_PREFIX) || pathname.startsWith("/node_modules/");
  }

  async resolve(url) {
    const { projectDirectory } = this.compilation.context;
    const { pathname, searchParams } = url;
    const fromImportMap = pathname.startsWith(IMPORT_MAP_RESOLVED_PREFIX);
    const resolvedHref = fromImportMap
      ? pathname.replace(IMPORT_MAP_RESOLVED_PREFIX, "file://")
      : getResolvedHrefFromPathnameShortcut(pathname, projectDirectory);
    const params = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

    return new Request(`${resolvedHref}${params}`);
  }

  async shouldServe(url) {
    const { href, protocol } = url;

    return protocol === "file:" && (await checkResourceExists(new URL(href)));
  }

  async serve(url) {
    const body = await fs.readFile(url, "utf-8");

    return new Response(body, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }

  async shouldIntercept(url, request, response) {
    return response.headers.get("Content-Type")?.indexOf("text/html") >= 0;
  }

  async intercept(url, request, response) {
    const { context, config } = this.compilation;
    const { importMaps } = config.polyfills;
    const importMapShimScript = importMaps
      ? '<script defer src="/node_modules/es-module-shims/dist/es-module-shims.js"></script>'
      : "";
    let body = await response.text();
    const hasHead = body.match(/<head>(.*)<\/head>/s);

    if (importMaps && hasHead && hasHead.length > 0) {
      const contents = hasHead[0].replace(/type="module"/g, 'type="module-shim"');

      body = body.replace(/<head>(.*)<\/head>/s, contents.replace(/\$/g, "$$$")); // https://github.com/ProjectEvergreen/greenwood/issues/656);
    }

    const userPackageJson = await getPackageJsonForProject(context);

    // if there are dependencies and we haven't generated the importMap already
    // walk the project's package.json for all its direct and transitive dependencies
    if (!generatedImportMap && Object.keys(userPackageJson.dependencies || []).length > 0) {
      console.log("Generating import map from project dependencies...");
      const { importMap, diagnostics } = await walkPackageJson(userPackageJson);

      if (diagnostics.size > 0) {
        console.log("****************************************************************************");

        diagnostics.forEach((value) => {
          console.warn(`- ${value}\n`);
        });

        console.log(
          "\n>>> Some issue were detected, learn more about these warnings at https://greenwoodjs.dev/docs/introduction/web-standards/#import-maps",
        );
        console.log("****************************************************************************");
      }

      generatedImportMap = Object.fromEntries(importMap);
    } else {
      generatedImportMap = generatedImportMap || {};
    }

    body = mergeImportMap(body, generatedImportMap, importMaps);
    body = body.replace(
      "<head>",
      `
      <head>
        ${importMapShimScript}
    `,
    );

    return new Response(body);
  }
}

const greenwoodPluginNodeModules = [
  {
    type: "resource",
    name: "plugin-node-modules:resource",
    provider: (compilation) => new NodeModulesResource(compilation),
  },
  {
    type: "rollup",
    name: "plugin-node-modules:rollup",
    provider: () => {
      return [nodeResolve()];
    },
  },
];

export { greenwoodPluginNodeModules };
