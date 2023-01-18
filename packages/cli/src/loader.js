import fs from 'fs/promises';
import { readAndMergeConfig as initConfig } from './lifecycles/config.js';

const config = await initConfig();
const resourcePlugins = config.plugins.filter(plugin => plugin.type === 'resource' && !plugin.isGreenwoodDefaultPlugin).map(plugin => plugin.provider({
  context: {
    projectDirectory: new URL(`file://${process.cwd()}`)
  }
}));

async function getCustomLoaderResponse(url, body = '', checkOnly = false) {
  console.debug('getCustomLoaderResponse', { url, body, checkOnly });
  const headers = new Headers({
    'Content-Type': 'text/javascript'
  });
  const request = new Request(url.href, { headers });
  const initResponse = new Response(body, { headers });
  let response = initResponse; // new Response(body);
  let shouldHandle = false;

  // TODO should this use the reduce pattern too?
  for (const plugin of resourcePlugins) {
    if (plugin.shouldServe && await plugin.shouldServe(url, request.clone())) {
      shouldHandle = true;
  
      if (!checkOnly) {
        response = await plugin.serve(url, request.clone());
      }
    }
  }

  for (const plugin of resourcePlugins) {
    if (plugin.shouldIntercept && await plugin.shouldIntercept(url, request.clone(), response.clone())) {
      shouldHandle = true;

      if (!checkOnly) {
        response = await plugin.intercept(url, request.clone(), response.clone());
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
  console.log('my resolve', { specifier });
  const { baseURL } = context;

  const { shouldHandle } = await getCustomLoaderResponse(new URL(specifier), null, true);

  console.debug('resolve shouldHandle????', { specifier, shouldHandle });
  if (shouldHandle) {
    console.log('handlign!!!!!!!@@@@@', { specifier });
    return {
      url: new URL(specifier, baseURL).href,
      shortCircuit: true
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}

// https://nodejs.org/docs/latest-v18.x/api/esm.html#loadurl-context-nextload
export async function load(source, context, defaultLoad) {
  console.debug('my load', { source, context });
  const extension = source.split('.').pop();
  const url = new URL('', `${source}?type=${extension}`);
  const { shouldHandle } = await getCustomLoaderResponse(url, null, true);

  console.debug({ url, shouldHandle, extension });

  if (shouldHandle) {
    console.log('we have a hit for !!!!!', { source });
    const contents = await fs.readFile(new URL(source), 'utf-8');
    console.debug('what goes in???????', { contents });
    const { response } = await getCustomLoaderResponse(url, contents);
    console.debug('$$$$$', { response });
    const body = await response.text();

    // TODO better way to handle remove export default?
    // https://github.com/ProjectEvergreen/greenwood/issues/948
    return {
      format: extension === 'json' ? 'json' : 'module',
      source: extension === 'json' ? JSON.stringify(JSON.parse(contents.replace('export default ', ''))) : body,
      shortCircuit: true
    };
  }

  return defaultLoad(source, context, defaultLoad);
}