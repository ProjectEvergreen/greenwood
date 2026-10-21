import {
  getPackageRoot,
  fileUrlToResolvedPrefixPath,
} from "@greenwood/cli/src/lib/package-resolution.js";

function getOptions(options = {}) {
  return { wc: true, lit: false, dsd: false, ...options };
}

function getPolyfillLocations(compilation, options) {
  const wcRoot = options.wc
    ? getPackageRoot("@webcomponents/webcomponentsjs", import.meta.url)
    : null;
  const litRoot = options.lit ? getPackageRoot("lit", compilation.context.projectDirectory) : null;

  return {
    wcLoader: wcRoot ? new URL("./webcomponents-loader.js", wcRoot) : null,
    wcBundles: wcRoot ? new URL("./bundles/", wcRoot) : null,
    litSupport: litRoot ? new URL("./polyfill-support.js", litRoot) : null,
  };
}

class PolyfillsResource {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.contentType = "text/html";
    this.options = getOptions(options);
  }

  async shouldIntercept(url, request, response) {
    const { protocol } = url;
    const { wc, lit, dsd } = this.options;
    const isEnabled = wc || lit || dsd;

    return (
      isEnabled &&
      protocol.startsWith("http") &&
      response.headers.get("Content-Type")?.indexOf(this.contentType) >= 0
    );
  }

  async intercept(url, request, response) {
    const { wc, lit, dsd } = this.options;
    const locations = getPolyfillLocations(this.compilation, this.options);
    let body = await response.text();

    // standard WC polyfill
    if (wc) {
      body = body.replace(
        "<head>",
        `
        <head>
          <script src="${fileUrlToResolvedPrefixPath(locations.wcLoader)}"></script>
      `,
      );
    }

    // append Lit polyfill next to make sure it comes before WC polyfill
    if (lit) {
      body = body.replace(
        "<head>",
        `
        <head>
          <script src="${fileUrlToResolvedPrefixPath(locations.litSupport)}"></script>
      `,
      );
    }

    // lastly, Declarative Shadow DOM polyfill
    if (dsd) {
      body = body.replace(
        "</body>",
        `
          <script>
            if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot')) {
              (function attachShadowRoots(root) {
                root.querySelectorAll("template[shadowroot]").forEach(template => {
                  const mode = template.getAttribute("shadowroot");
                  const shadowRoot = template.parentNode.attachShadow({ mode });
                  shadowRoot.appendChild(template.content);
                  template.remove();
                  attachShadowRoots(shadowRoot);
                });
              })(document);
            }
          </script>
        </body>
      `,
      );
    }

    return new Response(body);
  }
}

/** @type {import('./types/index.d.ts').PolyfillsPlugin} */
const greenwoodPluginPolyfills = (options = {}) => {
  return [
    {
      type: "resource",
      name: "plugin-polyfills",
      provider: (compilation) => new PolyfillsResource(compilation, options),
    },
    {
      type: "copy",
      name: "plugin-copy-polyfills",
      provider: async (compilation) => {
        const { outputDir } = compilation.context;
        const { wcLoader, wcBundles, litSupport } = getPolyfillLocations(
          compilation,
          getOptions(options),
        );

        return [
          ...(wcLoader
            ? [
                { from: wcLoader, to: new URL("./webcomponents-loader.js", outputDir) },
                { from: wcBundles, to: new URL("./bundles/", outputDir) },
              ]
            : []),
          ...(litSupport
            ? [{ from: litSupport, to: new URL("./polyfill-support.js", outputDir) }]
            : []),
        ];
      },
    },
  ];
};

export { greenwoodPluginPolyfills };
