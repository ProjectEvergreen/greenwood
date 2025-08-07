import { bundleCompilation } from "../lifecycles/bundle.js";
import { copyAssets } from "../lifecycles/copy.js";
import { getDevServer } from "../lifecycles/serve.js";
import {
  preRenderCompilationWorker,
  preRenderCompilationCustom,
  staticRenderCompilation,
} from "../lifecycles/prerender.js";

const runProductionBuild = async (compilation) => {
  const { prerender, activeContent, plugins } = compilation.config;
  const prerenderPlugin = compilation.config.plugins.find((plugin) => plugin.type === "renderer")
    ? compilation.config.plugins.find((plugin) => plugin.type === "renderer").provider(compilation)
    : {};
  const adapterPlugin = compilation.config.plugins.find((plugin) => plugin.type === "adapter")
    ? compilation.config.plugins.find((plugin) => plugin.type === "adapter").provider(compilation)
    : null;

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

    await Promise.all(servers.map((server) => server.start()));

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
