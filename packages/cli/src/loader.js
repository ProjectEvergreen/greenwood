import fs from 'fs/promises';
import { readAndMergeConfig as initConfig } from './lifecycles/config.js';

const config = await initConfig();
const resourcePlugins = config.plugins.filter(plugin => plugin.type === 'resource' && !plugin.isGreenwoodDefaultPlugin).map(plugin => plugin.provider({
  context: {
    projectDirectory: new URL(`file://${process.cwd()}`)
  }
}));

async function getCustomLoaderResponse(url, body = '', checkOnly = false) {
  const headers = new Headers({
    'Content-Type': 'text/javascript'
  });
  const request = new Request(url.href, { headers });
  const initResponse = new Response(body, { headers });
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
  const url = specifier.startsWith('file://')
    ? new URL(specifier)
    : specifier.startsWith('.')
      ? new URL(specifier, parentURL)
      : undefined;

  if (url) {
    const { shouldHandle } = await getCustomLoaderResponse(url, null, true);

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
  const url = new URL(`${source}?type=${extension}`);
  const { shouldHandle } = await getCustomLoaderResponse(url, null, true);

  if (shouldHandle) {
    const contents = await fs.readFile(url, 'utf-8');
    const { response } = await getCustomLoaderResponse(url, contents);
    const body = await response.text();

    // TODO better way to handle remove export default?  leverage import assertions instead
    // https://github.com/ProjectEvergreen/greenwood/issues/923
    return {
      format: extension === 'json' ? 'json' : 'module',
      source: extension === 'json' ? JSON.stringify(JSON.parse(contents.replace('export default ', ''))) : body,
      shortCircuit: true
    };
  }

  return defaultLoad(source, context, defaultLoad);
}