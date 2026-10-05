import http from "node:http";
import { bundleCompilation } from "../lifecycles/bundle.js";
import { copyAssets } from "../lifecycles/copy.js";
import { getDevServer } from "../lifecycles/serve.js";
import {
  preRenderCompilationWorker,
  preRenderCompilationCustom,
  staticRenderCompilation,
} from "../lifecycles/prerender.js";
import { getPrerenderPages, getStaticPages } from "../lib/graph-utils.js";
import { listenOnAvailablePort } from "../lib/server-utils.js";

const runProductionBuild = async (compilation) => {
  const { activeContent, plugins } = compilation.config;
  const prerenderPlugin = compilation.config.plugins.find((plugin) => plugin.type === "renderer")
    ? compilation.config.plugins.find((plugin) => plugin.type === "renderer").provider(compilation)
    : {};
  const adapterPlugin = compilation.config.plugins.find((plugin) => plugin.type === "adapter")
    ? compilation.config.plugins.find((plugin) => plugin.type === "adapter").provider(compilation)
    : null;

  // Group page based on different output conditions, with a page belonging to either set
  const prerenderPages = getPrerenderPages(compilation);
  const staticPages = getStaticPages(compilation);

  // Custom renderers such as Puppeteer generate their own HTML,
  const customPrerenderPages = new Set(
    prerenderPlugin.executeModuleUrl
      ? []
      : prerenderPages.filter((page) => staticPages.includes(page) && !page.isSSR),
  );
  // and exclude their non-SSR pages from the static render pass to avoid processing the same resources twice.
  const staticRenderPages = staticPages.filter((page) => !customPrerenderPages.has(page));

  // Prerendering may need access to server plugins, and static SSR routes must execute their route bundles at build time
  const needsServerPlugins = prerenderPages.length > 0 || staticPages.some((page) => page.isSSR);

  if (needsServerPlugins) {
    // start any of the user's server plugins if needed
    const servers = [
      ...compilation.config.plugins
        .filter((plugin) => {
          return plugin.type === "server" && !plugin.isGreenwoodDefaultPlugin;
        })
        .map((plugin) => plugin.provider(compilation)),
    ];

    if (activeContent) {
      const preferredPort = compilation.config.devServer.port;
      const app = await getDevServer({
        ...compilation,
        config: {
          ...compilation.config,
          // only the content as data plugin is needed for this build-time server
          plugins: [plugins.find((plugin) => plugin.name === "plugin-active-content")],
        },
      });
      const server = http.createServer(app.callback());
      const port = await listenOnAvailablePort(server, preferredPort);

      compilation.config.devServer.port = port;

      if (port !== preferredPort) {
        console.warn(
          `Active content port ${preferredPort} is already in use, using next available port of ${port} instead.`,
        );
      }

      console.info("Initializing active content...");
    }

    await Promise.all(servers.map((server) => server.start()));
  }

  // Generate all static pages that emit HTML.
  // This also provides the input HTML consumed by the worker prerenderer in the next phase.
  await staticRenderCompilation(compilation, staticRenderPages);

  // Execute browser JavaScript for opted-in pages.
  // Runtime SSR pages are not written here as their prerendered application shells are created later while bundling their route handlers.
  if (prerenderPages.length > 0) {
    if (prerenderPlugin.executeModuleUrl) {
      await preRenderCompilationWorker(compilation, prerenderPlugin);
    } else {
      await preRenderCompilationCustom(compilation, prerenderPlugin);
    }
  }

  console.info("success, done generating all pages!");

  await bundleCompilation(compilation);
  await copyAssets(compilation);

  if (adapterPlugin) {
    await adapterPlugin();
  }
};

export { runProductionBuild };
