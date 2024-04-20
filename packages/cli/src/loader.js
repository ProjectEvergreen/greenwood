import fs from 'fs/promises';
import { readAndMergeConfig as initConfig } from './lifecycles/config.js';


const config = await initConfig();
const resourcePlugins = config.plugins.filter(plugin => plugin.type === 'resource').map(plugin => plugin.provider({
  // TODO best way to stub this out? or pull from output?
  context: {
    projectDirectory: new URL(`file://${process.cwd()}`)
  },
  config: {
    devServer: {}
  },
  graph: []
}));

async function getCustomLoaderResponse(url, type = '', checkOnly = false) {
  const headers = {
    // 'Content-Type': type === 'css' ? 'text/css' : 'text/javascript',
    'Accept': 'text/javascript',
    'Sec-Fetch-Dest': 'empty'
  };
  const request = new Request(url, { headers });
  const initResponse = new Response('');
  let response = initResponse.clone();
  let shouldHandle = false;

  for (const plugin of resourcePlugins) {
    if (plugin.shouldServe && await plugin.shouldServe(url, request)) {
      shouldHandle = true;

      if (!checkOnly) {
        response = await plugin.serve(url, request);
      }
    }
  }

  for (const plugin of resourcePlugins) {
    if (plugin.shouldPreIntercept && await plugin.shouldPreIntercept(url, request, response.clone())) {
      shouldHandle = true;

      if (!checkOnly) {
        response = await plugin.preIntercept(url, request, response.clone());
      }
    }

    if (plugin.shouldIntercept && await plugin.shouldIntercept(url, request, response.clone())) {
      shouldHandle = true;

      if (!checkOnly) {
        response = await plugin.intercept(url, request, response.clone());
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
  const type = context?.importAttributes?.type;
  const url = specifier.startsWith('file://')
    ? new URL(specifier)
    : specifier.startsWith('.')
      ? new URL(specifier, parentURL)
      : undefined;

  if (url) {
    const { shouldHandle } = await getCustomLoaderResponse(url, type, true);

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
  const type = context?.importAttributes?.type;
  const url = new URL(source);
  const { shouldHandle } = await getCustomLoaderResponse(url, type, true);

  if (shouldHandle && extension !== 'js') {
    const { response } = await getCustomLoaderResponse(url, type);
    const contents = await response.text();

    return {
      format: 'module',
      source: contents,
      shortCircuit: true
    };
  }

  return defaultLoad(source, context, defaultLoad);
}