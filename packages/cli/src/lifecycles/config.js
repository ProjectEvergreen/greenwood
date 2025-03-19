// @ts-nocheck
import fs from "fs/promises";
import { checkResourceExists } from "../lib/resource-utils.js";

const cwd = new URL(`file://${process.cwd()}/`);
const greenwoodPluginsDirectoryUrl = new URL("../plugins/", import.meta.url);
const PLUGINS_FLATTENED_DEPTH = 2;

// get and "tag" all plugins provided / maintained by the @greenwood/cli
// and include as the default set, with all user plugins getting appended
const greenwoodPlugins = (
  await Promise.all(
    [
      new URL("./copy/", greenwoodPluginsDirectoryUrl),
      new URL("./renderer/", greenwoodPluginsDirectoryUrl),
      new URL("./resource/", greenwoodPluginsDirectoryUrl),
      new URL("./server/", greenwoodPluginsDirectoryUrl),
    ].map(async (pluginDirectoryUrl) => {
      const files = await fs.readdir(pluginDirectoryUrl);

      return await Promise.all(
        files.map(async (file) => {
          const importUrl = new URL(`./${file}`, pluginDirectoryUrl);
          // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
          const pluginImport = await import(importUrl);
          const plugin = pluginImport[Object.keys(pluginImport)[0]];

          return Array.isArray(plugin) ? plugin : [plugin];
        }),
      );
    }),
  )
)
  .flat(PLUGINS_FLATTENED_DEPTH)
  .map((plugin) => {
    const isStandardStaticResource =
      (plugin.name.startsWith("plugin-standard") && plugin.name !== "plugin-standard-html") ||
      plugin.name === "plugin-source-maps";

    return {
      isGreenwoodDefaultPlugin: true,
      isStandardStaticResource,
      ...plugin,
    };
  });

const optimizations = ["default", "none", "static", "inline"];
const pluginTypes = [
  "copy",
  "context",
  "resource",
  "rollup",
  "server",
  "source",
  "renderer",
  "adapter",
];
const defaultConfig = {
  activeContent: false,
  basePath: "",
  devServer: {
    hud: true,
    port: 1984,
    extensions: [],
    proxy: {},
  },
  isolation: false,
  layoutsDirectory: "layouts",
  optimization: optimizations[0],
  pagesDirectory: "pages",
  plugins: greenwoodPlugins,
  polyfills: {
    importAttributes: null, // or ['css', 'json']
    importMaps: false,
  },
  port: 8080,
  prerender: false,
  useTsc: false,
  workspace: new URL("./src/", cwd),
};

const readAndMergeConfig = async () => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      // check for greenwood.config.ts or greenwood.config.js
      const jsConfigUrl = new URL("./greenwood.config.js", cwd);
      const tsConfigUrl = new URL("./greenwood.config.ts", cwd);
      const configUrl = (await checkResourceExists(tsConfigUrl))
        ? tsConfigUrl
        : (await checkResourceExists(jsConfigUrl))
          ? jsConfigUrl
          : null;
      // deep clone of default config
      let customConfig = Object.assign({}, defaultConfig);
      let isSPA;

      // check for SPA
      if (await checkResourceExists(new URL("./index.html", customConfig.workspace))) {
        isSPA = true;
      }

      if (configUrl) {
        // should try and figure this out - https://github.com/ProjectEvergreen/greenwood/issues/1439
        // console.log(`Configuration file detected... loading => ${configUrl.href}`);

        // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
        const userCfgFile = (await import(configUrl)).default;
        const {
          workspace,
          devServer,
          markdown,
          optimization,
          plugins,
          port,
          prerender,
          basePath,
          staticRouter,
          pagesDirectory,
          layoutsDirectory,
          activeContent,
          isolation,
          polyfills,
          useTsc,
        } = userCfgFile;

        // workspace validation
        if (workspace) {
          if (!(workspace instanceof URL)) {
            reject("Configuration error: workspace must be an instance of URL");
          }

          if (await checkResourceExists(workspace)) {
            customConfig.workspace = workspace;
          } else {
            reject(
              "Configuration error: Workspace doesn't exist! Please double check your configuration.",
            );
          }
        }

        if (
          typeof optimization === "string" &&
          optimizations.indexOf(optimization.toLowerCase()) >= 0
        ) {
          customConfig.optimization = optimization;
        } else if (optimization) {
          reject(
            `Configuration error: provided optimization "${optimization}" is not supported.  Please use one of: ${optimizations.join(", ")}.`,
          );
        }

        if (activeContent) {
          if (typeof activeContent !== "boolean") {
            reject("Configuration error: activeContent must be a boolean");
          }
          customConfig.activeContent = activeContent;
        }

        if (plugins && plugins.length > 0) {
          const flattened = plugins.flat(PLUGINS_FLATTENED_DEPTH);

          flattened.forEach((plugin) => {
            if (!plugin.type || pluginTypes.indexOf(plugin.type) < 0) {
              reject(
                `Configuration error: plugins must be one of type "${pluginTypes.join(", ")}". got "${plugin.type}" instead.`,
              );
            }

            if (!plugin.provider || typeof plugin.provider !== "function") {
              const providerTypeof = typeof plugin.provider;

              reject(
                `Configuration error: plugins provider must be a function. got ${providerTypeof} instead.`,
              );
            }

            if (!plugin.name || typeof plugin.name !== "string") {
              const nameTypeof = typeof plugin.name;

              reject(`Configuration error: plugins must have a name. got ${nameTypeof} instead.`);
            }
          });

          // if user provided a custom renderer, filter out Greenwood's default renderer
          const customRendererPlugins = flattened.filter(
            (plugin) => plugin.type === "renderer",
          ).length;

          if (customRendererPlugins === 1) {
            customConfig.plugins = customConfig.plugins.filter((plugin) => {
              return plugin.type !== "renderer";
            });
          } else if (customRendererPlugins > 1) {
            console.warn(
              "Configuration warning: more than one custom renderer plugin detected.  Please make sure you are only loading one.",
            );
            console.debug(plugins.filter((plugin) => plugin.type === "renderer"));
          }

          customConfig.plugins = [...customConfig.plugins, ...flattened];
        }

        if (devServer && Object.keys(devServer).length > 0) {
          if (Object.prototype.hasOwnProperty.call(devServer, "hud")) {
            if (typeof devServer.hud === "boolean") {
              customConfig.devServer.hud = devServer.hud;
            } else {
              reject(
                `Configuration error: devServer hud options must be a boolean.  Passed value was: ${devServer.hud}`,
              );
            }
          }

          if (devServer.port) {
            if (!Number.isInteger(devServer.port)) {
              reject(
                `Configuration error: devServer port must be an integer.  Passed value was: ${devServer.port}`,
              );
            } else {
              customConfig.devServer.port = devServer.port;
            }
          }

          if (devServer.proxy) {
            customConfig.devServer.proxy = devServer.proxy;
          }

          if (devServer.extensions) {
            if (Array.isArray(devServer.extensions)) {
              customConfig.devServer.extensions = devServer.extensions;
            } else {
              reject(
                "Configuration error: provided extensions is not an array.  Please provide an array like ['txt', 'foo']",
              );
            }
          }
        }

        if (markdown && Object.keys(markdown).length > 0) {
          customConfig.markdown.plugins =
            markdown.plugins && markdown.plugins.length > 0 ? markdown.plugins : [];
        }

        if (port) {
          if (!Number.isInteger(port)) {
            reject(`Configuration error: port must be an integer.  Passed value was: ${port}`);
          } else {
            customConfig.port = port;
          }
        }

        if (basePath) {
          if (typeof basePath !== "string") {
            reject(
              `Configuration error: basePath must be a string.  Passed value was: ${basePath}`,
            );
          } else {
            customConfig.basePath = basePath;
          }
        }

        if (pagesDirectory && typeof pagesDirectory === "string") {
          customConfig.pagesDirectory = pagesDirectory;
        } else if (pagesDirectory) {
          reject(
            `Configuration error: provided pagesDirectory "${pagesDirectory}" is not supported.  Please make sure to pass something like 'docs/'`,
          );
        }

        if (layoutsDirectory && typeof layoutsDirectory === "string") {
          customConfig.layoutsDirectory = layoutsDirectory;
        } else if (layoutsDirectory) {
          reject(
            `Configuration error: provided layoutsDirectory "${layoutsDirectory}" is not supported.  Please make sure to pass something like 'layouts/'`,
          );
        }

        if (prerender !== undefined) {
          if (typeof prerender === "boolean") {
            customConfig.prerender = prerender;
          } else {
            reject(
              `Configuration error: prerender must be a boolean; true or false.  Passed value was typeof: ${typeof prerender}`,
            );
          }
        }

        // SPA should _not_ prerender unless if user has specified prerender should be true
        if (prerender === undefined && isSPA) {
          customConfig.prerender = false;
        }

        if (isolation !== undefined) {
          if (typeof isolation === "boolean") {
            customConfig.isolation = isolation;
          } else {
            reject(
              `Configuration error: isolation must be a boolean; true or false.  Passed value was typeof: ${typeof staticRouter}`,
            );
          }
        }

        if (staticRouter !== undefined) {
          if (typeof staticRouter === "boolean") {
            customConfig.staticRouter = staticRouter;
          } else {
            reject(
              `Configuration error: staticRouter must be a boolean; true or false.  Passed value was typeof: ${typeof staticRouter}`,
            );
          }
        }

        if (polyfills !== undefined) {
          const { importMaps, importAttributes } = polyfills;

          customConfig.polyfills = { importAttributes: null, importMaps: false };

          if (importMaps) {
            if (typeof importMaps === "boolean") {
              customConfig.polyfills.importMaps = true;
            } else {
              reject(
                `Configuration error: polyfills.importMaps must be a boolean; true or false.  Passed value was typeof: ${typeof importMaps}`,
              );
            }
          }

          if (importAttributes) {
            if (Array.isArray(importAttributes)) {
              customConfig.polyfills.importAttributes = importAttributes;
            } else {
              reject(
                `Configuration error: polyfills.importAttributes must be an array of types; ['css', 'json'].  Passed value was typeof: ${typeof importAttributes}`,
              );
            }
          }
        }

        if (useTsc !== undefined) {
          if (typeof useTsc === "boolean") {
            customConfig.useTsc = useTsc;
          } else {
            reject(
              `Configuration error: useTsc must be a boolean; true or false.  Passed value was typeof: ${typeof useTsc}`,
            );
          }
        }
      } else {
        // SPA should _not_ prerender unless if user has specified prerender should be true
        if (isSPA) {
          customConfig.prerender = false;
        }
      }

      resolve({ ...defaultConfig, ...customConfig });
    } catch (err) {
      reject(err);
    }
  });
};

export { readAndMergeConfig };
