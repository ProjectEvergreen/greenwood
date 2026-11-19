/*
 *
 * Detects and fully resolves requests to node_modules and handles creating an importMap.
 *
 */
import { checkResourceExists, fileUrlToResolvedPrefixPath } from "../../lib/resource-utils.js";
import fs from "node:fs/promises";
import {
  getPackageJsonForProject,
  getResolvedHrefFromPathnameShortcut,
  mergeImportMap,
  getPackageRoot,
  isNodeModulesPath,
  isPackageResourcePath,
} from "../../lib/node-modules-utils.js";
import { walkPackageJson } from "../../lib/walker-package-ranger.js";
import { parseHtml, createHtmlElement } from "../../lib/html-utils.js";

let generatedImportMap;
const importMapShimUrl = fileUrlToResolvedPrefixPath(
  new URL("./dist/es-module-shims.js", getPackageRoot("es-module-shims", import.meta.url)),
);

class NodeModulesResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["js", "mjs"];
    this.contentType = "text/javascript";
  }

  async shouldResolve(url) {
    const { pathname } = url;

    return isPackageResourcePath(pathname);
  }

  async resolve(url) {
    const { projectDirectory } = this.compilation.context;
    const { pathname } = url;
    const resolvedHref = getResolvedHrefFromPathnameShortcut(
      `${pathname}${url.search}`,
      projectDirectory,
    );

    return new Request(resolvedHref);
  }

  async shouldServe(url) {
    const { href, protocol, pathname } = url;

    return (
      protocol === "file:" &&
      (isNodeModulesPath(pathname) || this.extensions.includes(pathname.split(".").pop())) &&
      (await checkResourceExists(new URL(href)))
    );
  }

  async serve(url) {
    const body = await fs.readFile(url, "utf-8");

    // most likely a JavaScript file, but perhaps we should further refine based on extension?
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
    let body = await response.text();
    const root = parseHtml(body);

    if (importMaps) {
      for (const script of root.querySelectorAll('head script[type="module"]')) {
        script.setAttribute("type", "module-shim");
      }
    }

    body = root.toString();

    const { packageJson, packageJsonUrl } = await getPackageJsonForProject(context);

    // Walk the project's dependencies and import aliases once and cache the completed import map.
    if (
      !generatedImportMap &&
      (Object.keys(packageJson.dependencies || {}).length > 0 ||
        Object.keys(packageJson.imports || {}).length > 0)
    ) {
      console.log("Generating import map from project dependencies and aliases...");
      const { importMap, diagnostics, scopes } = await walkPackageJson(
        packageJson,
        new Set(),
        packageJsonUrl,
      );

      if (diagnostics.size > 0) {
        console.log("****************************************************************************");
        diagnostics.forEach((value) => console.warn(`- ${value}\n`));
        console.log(
          "\n>>> Some issues were detected, learn more at https://greenwoodjs.dev/docs/introduction/web-standards/#import-maps",
        );
        console.log("****************************************************************************");
      }

      generatedImportMap = { imports: Object.fromEntries(importMap), scopes };
    } else {
      generatedImportMap = generatedImportMap || {};
    }

    body = mergeImportMap(body, generatedImportMap, importMaps);

    const merged = parseHtml(body);

    if (importMaps) {
      merged
        .querySelector("head")
        ?.prepend(createHtmlElement("script", { defer: "", src: importMapShimUrl }));
    }
    body = merged.toString();

    return new Response(body);
  }
}

const greenwoodPluginNodeModules = [
  {
    type: "resource",
    name: "plugin-node-modules:resource",
    provider: (compilation) => new NodeModulesResource(compilation),
  },
];

export { greenwoodPluginNodeModules };
