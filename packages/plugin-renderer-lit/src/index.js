class LitHydrationResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
  }

  async shouldIntercept(url) {
    const { pathname } = url;
    const matchingRoute = this.compilation.graph.find((node) => node.route === pathname) || {};

    return matchingRoute.isSSR && matchingRoute.hydration;
  }

  async intercept(url, request, response) {
    const { importMaps } = this.compilation.config.polyfills;
    const isDevelopment = process.env.__GWD_COMMAND__ === "develop";
    const importType = isDevelopment && importMaps ? "module-shim" : "module";
    const importMapType = isDevelopment && importMaps ? "importmap-shim" : "importmap";
    const headSelector = isDevelopment ? `<script type="${importMapType}">` : "<head>";
    const hydrationSupportScriptPath =
      "/node_modules/@lit-labs/ssr-client/lit-element-hydrate-support.js";
    let body = await response.text();

    // this needs to come first before any userland code, but before any import maps
    // https://github.com/ProjectEvergreen/greenwood/pull/1289
    if (isDevelopment) {
      // quick way to find the ending position of the importmap <script> tag
      // and append the hydration support <script> right after it
      const scriptEndPattern = /<\/script>/g;
      const importMapStartPos = body.indexOf(headSelector) ?? "";
      let importMapEndPos = 0;
      let match;

      while ((match = scriptEndPattern.exec(body)) !== null) {
        const position = match.index;
        if (position > importMapStartPos) {
          importMapEndPos = position;
          break;
        }
      }

      body = `
        ${body.slice(0, importMapEndPos)}
        </script>
        <script type="${importType}" src="${hydrationSupportScriptPath}"></script>
        ${body.slice(importMapEndPos + 9)}
      `;
    } else {
      body = body.replace(
        headSelector,
        `
        ${headSelector}
          <script type="${importType}" src="${hydrationSupportScriptPath}"></script>
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
