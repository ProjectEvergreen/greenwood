import { bundleCompilation } from '../lifecycles/bundle.js';
import { checkResourceExists, trackResourcesForRoute } from '../lib/resource-utils.js';
import { copyAssets } from '../lifecycles/copy.js';
import fs from 'fs/promises';
import { preRenderCompilationWorker, preRenderCompilationCustom, staticRenderCompilation } from '../lifecycles/prerender.js';
import { ServerInterface } from '../lib/server-interface.js';

// TODO a lot of these are duplicated in the prerender lifecycle too
// would be good to refactor
async function servePage(url, request, plugins) {
  let response = new Response('');

  for (const plugin of plugins) {
    if (plugin.shouldServe && await plugin.shouldServe(url, request)) {
      response = await plugin.serve(url, request);
      break;
    }
  }

  return response;
}

async function interceptPage(url, request, plugins, body) {
  let response = new Response(body, {
    headers: new Headers({ 'Content-Type': 'text/html' })
  });

  for (const plugin of plugins) {
    if (plugin.shouldIntercept && await plugin.shouldIntercept(url, request, response)) {
      response = await plugin.intercept(url, request, response);
    }
  }

  return response;
}

function getPluginInstances (compilation) {
  return [...compilation.config.plugins]
    .filter(plugin => plugin.type === 'resource' && plugin.name !== 'plugin-node-modules:resource')
    .map((plugin) => {
      return plugin.provider(compilation);
    });
}

// TODO does this make more sense in bundle lifecycle?
// https://github.com/ProjectEvergreen/greenwood/issues/970
// or could this be done sooner (like in appTemplate building in html resource plugin)?
// Or do we need to ensure userland code / plugins have gone first
async function trackResourcesForRoutes(compilation) {
  const plugins = getPluginInstances(compilation);

  for (const page of compilation.graph) {
    const { route } = page;
    const url = new URL(`http://localhost:${compilation.config.port}${route}`);
    const request = new Request(url);

    let body = await (await servePage(url, request, plugins)).text();
    body = await (await interceptPage(url, request, plugins, body)).text();

    await trackResourcesForRoute(body, compilation, route);
  }
}

const runProductionBuild = async (compilation) => {

  return new Promise(async (resolve, reject) => {

    try {
      const { prerender } = compilation.config;
      const outputDir = compilation.context.outputDir;
      const prerenderPlugin = compilation.config.plugins.find(plugin => plugin.type === 'renderer')
        ? compilation.config.plugins.find(plugin => plugin.type === 'renderer').provider(compilation)
        : {};

      if (!await checkResourceExists(outputDir)) {
        await fs.mkdir(outputDir, {
          recursive: true
        });
      }

      if (prerender || prerenderPlugin.prerender) {
        // start any servers if needed
        const servers = [...compilation.config.plugins.filter((plugin) => {
          return plugin.type === 'server';
        }).map((plugin) => {
          const provider = plugin.provider(compilation);
  
          if (!(provider instanceof ServerInterface)) {
            console.warn(`WARNING: ${plugin.name}'s provider is not an instance of ServerInterface.`);
          }
  
          return provider;
        })];
  
        await Promise.all(servers.map(async (server) => {
          await server.start();
  
          return Promise.resolve(server);
        }));

        if (prerenderPlugin.workerUrl) {
          await trackResourcesForRoutes(compilation);
          await preRenderCompilationWorker(compilation, prerenderPlugin);
        } else {
          await preRenderCompilationCustom(compilation, prerenderPlugin);
        }
      } else {
        await trackResourcesForRoutes(compilation);
        await staticRenderCompilation(compilation);
      }

      console.info('success, done generating all pages!');

      await bundleCompilation(compilation);
      await copyAssets(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
};

export { runProductionBuild };