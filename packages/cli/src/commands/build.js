import { bundleCompilation } from "../lifecycles/bundle.js";
import { checkResourceExists } from "../lib/resource-utils.js";
import { copyAssets } from "../lifecycles/copy.js";
import { getDevServer } from "../lifecycles/serve.js";
import fs from "fs/promises";
import {
  preRenderCompilationWorker,
  preRenderCompilationCustom,
  staticRenderCompilation,
} from "../lifecycles/prerender.js";

const runProductionBuild = async (compilation) => {
  const { prerender, activeContent, plugins } = compilation.config;
  const outputDir = compilation.context.outputDir;
  const prerenderPlugin = compilation.config.plugins.find((plugin) => plugin.type === "renderer")
    ? compilation.config.plugins.find((plugin) => plugin.type === "renderer").provider(compilation)
    : {};
  const adapterPlugin = compilation.config.plugins.find((plugin) => plugin.type === "adapter")
    ? compilation.config.plugins.find((plugin) => plugin.type === "adapter").provider(compilation)
    : null;

  if (!(await checkResourceExists(outputDir))) {
    await fs.mkdir(outputDir, {
      recursive: true,
    });
  }

  if (prerender) {
    // start any of the user's server plugins if needed
    const servers = [
      ...compilation.config.plugins
        .filter((plugin) => {
          return plugin.type === "server" && !plugin.isGreenwoodDefaultPlugin;
        })
        .map((plugin) => plugin.provider(compilation)),
    ];

    if (activeContent) {
      (
        await getDevServer({
          ...compilation,
          // prune for the content as data plugin and start the dev server with only that plugin enabled
          plugins: [plugins.find((plugin) => plugin.name === "plugin-active-content")],
        })
      ).listen(compilation.config.devServer.port, () => {
        console.info("Initializing active content...");
      });
    }

    await Promise.all(
      servers.map(async (server) => {
        await server.start();

        return Promise.resolve(server);
      }),
    );

    if (prerenderPlugin.executeModuleUrl) {
      await preRenderCompilationWorker(compilation, prerenderPlugin);
    } else {
      await preRenderCompilationCustom(compilation, prerenderPlugin);
    }
  } else {
    await staticRenderCompilation(compilation);
  }

  console.info("success, done generating all pages!");

  await bundleCompilation(compilation);
  await copyAssets(compilation);

  if (adapterPlugin) {
    await adapterPlugin();
  }
};

export { runProductionBuild };
