import { getMatchingPageByRoute, shouldPrerender } from "@greenwood/cli/src/lib/graph-utils.js";
import { getPackageRoot, insertAfterImportMap } from "@greenwood/cli/src/lib/node-modules-utils.js";
import { fileUrlToResolvedPrefixPath } from "@greenwood/cli/src/lib/resource-utils.js";

const hydrationSupportUrl = new URL(
  "./lit-element-hydrate-support.js",
  getPackageRoot("@lit-labs/ssr-client", import.meta.url),
);

class LitHydrationResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
  }

  async shouldIntercept(url, request, response) {
    const { pathname } = url;

    if (response.headers?.get("Content-Type")?.indexOf("text/html") < 0) {
      return false;
    }

    const matchingRoute = getMatchingPageByRoute(this.compilation, pathname);

    return (
      matchingRoute &&
      ((matchingRoute.isSSR && matchingRoute.hydration) ||
        shouldPrerender(matchingRoute, this.compilation.config))
    );
  }

  async intercept(url, request, response) {
    const { importMaps } = this.compilation.config.polyfills;
    const isDevelopment = process.env.__GWD_COMMAND__ === "develop";
    const importType = isDevelopment && importMaps ? "module-shim" : "module";
    let body = await response.text();

    // Hydration must follow import maps and precede user module scripts.
    // https://github.com/ProjectEvergreen/greenwood/pull/1289
    if (isDevelopment) {
      body = insertAfterImportMap(
        body,
        `<script type="${importType}" src="${fileUrlToResolvedPrefixPath(hydrationSupportUrl)}"></script>`,
      );
    } else {
      // Note: in production builds we have to inline the hydration support script
      // due to how Rollup bundles dependencies. If we try to load it as an external
      // module, it leads to this issue in our monorepo tests
      // https://github.com/ProjectEvergreen/greenwood/issues/1463
      body = body.replace(
        "<head>",
        `
        <head>
          <script type="module">
            import '${hydrationSupportUrl.href}';
          </script>
      `,
      );
    }

    return new Response(body);
  }
}

/** @type {import('./types/index.d.ts').LitRendererPlugin} */
const greenwoodPluginRendererLit = () => {
  return [
    {
      type: "renderer",
      name: "plugin-renderer-lit:renderer",
      provider: () => {
        return {
          executeModuleUrl: new URL("./execute-route-module.js", import.meta.url),
          apiRouteWorkerUrl: new URL("./api-route-worker.js", import.meta.url),
        };
      },
    },
    {
      type: "resource",
      name: "plugin-renderer-lit:resource",
      provider: (compilation, options) => new LitHydrationResource(compilation, options),
    },
  ];
};

export { greenwoodPluginRendererLit };
