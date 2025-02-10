/*
 *
 * Enable using Babel for processing JavaScript files.
 *
 */
import babel from "@babel/core";
import { checkResourceExists } from "@greenwood/cli/src/lib/resource-utils.js";
import rollupBabelPlugin from "@rollup/plugin-babel";

async function getConfig(compilation, extendConfig = false) {
  const { projectDirectory } = compilation.context;
  const configFile = "babel.config.mjs";
  const defaultConfig = (await import(new URL(`./${configFile}`, import.meta.url).href)).default;
  const userConfig = (await checkResourceExists(new URL(`./${configFile}`, projectDirectory)))
    ? (await import(`${projectDirectory}/${configFile}`)).default
    : {};
  const finalConfig = Object.assign({}, userConfig);

  if (extendConfig) {
    finalConfig.presets = Array.isArray(userConfig.presets)
      ? [...defaultConfig.presets, ...userConfig.presets]
      : [...defaultConfig.presets];

    finalConfig.plugins = Array.isArray(userConfig.plugins)
      ? [...defaultConfig.plugins, ...userConfig.plugins]
      : [...defaultConfig.plugins];
  }

  return finalConfig;
}

class BabelResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
    this.extensions = ["js"];
    this.contentType = ["text/javascript"];
  }

  async shouldPreIntercept(url, request, response) {
    const { protocol, pathname } = url;

    return (
      protocol === "file:" &&
      !pathname.startsWith("/node_modules/") &&
      response.headers.get("Content-Type").indexOf(this.contentType) >= 0
    );
  }

  async preIntercept(url, request, response) {
    const config = await getConfig(this.compilation, this.options.extendConfig);
    const body = await response.text();
    const result = await babel.transform(body, config);

    return new Response(result.code, {
      headers: response.headers,
    });
  }
}

const greenwoodPluginBabel = (options = {}) => {
  return [
    {
      type: "resource",
      name: "plugin-babel:resource",
      provider: (compilation) => new BabelResource(compilation, options),
    },
    {
      type: "rollup",
      name: "plugin-babel:rollup",
      provider: (compilation) => [
        // @ts-expect-error see https://github.com/rollup/plugins/issues/1662
        rollupBabelPlugin({
          // https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers
          babelHelpers: "bundled",

          ...getConfig(compilation, options.extendConfig),
        }),
      ],
    },
  ];
};

export { greenwoodPluginBabel };
