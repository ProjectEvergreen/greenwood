import { readAndMergeConfig as initConfig } from './lifecycles/config.js';
import { mergeResponse } from './lib/resource-utils.js';

const config = await initConfig();
const resourcePlugins = config.plugins
  .filter(plugin => plugin.type === 'resource')
  .filter(plugin => plugin.name !== 'plugin-node-modules:resource' && plugin.name !== 'plugin-user-workspace')
  .map(plugin => plugin.provider({
    context: {
      outputDir: new URL(`file://${process.cwd()}/public`),
      projectDirectory: new URL(`file://${process.cwd()}/`),
      scratchDir: new URL(`file://${process.cwd()}/.greenwood/`)
    },
    config: {
      devServer: {}
    },
    graph: []
  }));

async function getCustomLoaderResponse(initUrl, checkOnly = false) {
  const headers = {
    'Accept': 'text/javascript'
  };
  const initResponse = new Response('');
  let request = new Request(initUrl, { headers });
  let url = initUrl;
  let response = initResponse.clone();
  let shouldHandle = false;

  for (const plugin of resourcePlugins) {
    if (initUrl.protocol === 'file:' && plugin.shouldResolve && await plugin.shouldResolve(initUrl, request)) {
      shouldHandle = true;

      if (!checkOnly) {
        url = new URL((await plugin.resolve(initUrl, request)).url);
      }
    }
  }

  for (const plugin of resourcePlugins) {
    if (plugin.shouldServe && await plugin.shouldServe(initUrl, request)) {
      shouldHandle = true;

      if (!checkOnly) {
        response = mergeResponse(response, await plugin.serve(initUrl, request));
      }
    }
  }

  for (const plugin of resourcePlugins) {
    if (plugin.shouldPreIntercept && await plugin.shouldPreIntercept(url, request, response.clone())) {
      shouldHandle = true;

      if (!checkOnly) {
        response = mergeResponse(response, await plugin.preIntercept(url, request, response.clone()));
      }
    }

    if (plugin.shouldIntercept && await plugin.shouldIntercept(url, request, response.clone())) {
      shouldHandle = true;

      if (!checkOnly) {
        response = mergeResponse(response, await plugin.intercept(url, request, response.clone()));
      }
    }
  }

  return {
    shouldHandle,
    response
  };
}

// https://nodejs.org/docs/latest-v18.x/api/esm.html#resolvespecifier-context-nextresolve
export async function resolve(specifier, context, defaultResolve) {
  const { parentURL } = context;
  const url = specifier.startsWith('file://')
    ? new URL(specifier)
    : specifier.startsWith('.')
      ? new URL(specifier, parentURL)
      : undefined;

  if (url) {
    const { shouldHandle } = await getCustomLoaderResponse(url, true);

    if (shouldHandle) {
      return {
        url: url.href,
        shortCircuit: true
      };
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}

// https://nodejs.org/docs/latest-v18.x/api/esm.html#loadurl-context-nextload
export async function load(source, context, defaultLoad) {
  const extension = source.split('.').pop();
  const url = new URL(source);
  const { shouldHandle } = await getCustomLoaderResponse(url, true);

  if (shouldHandle && extension !== 'js') {
    const { response } = await getCustomLoaderResponse(url);
    const contents = await response.text();

    return {
      format: 'module',
      source: contents,
      shortCircuit: true
    };
  }

  return defaultLoad(source, context, defaultLoad);
}