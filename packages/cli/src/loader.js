import path from 'path';
import { readAndMergeConfig as initConfig } from './lifecycles/config.js';
import { URL, fileURLToPath } from 'url';

const config = await initConfig();
const plugins = config.plugins.filter(plugin => plugin.type === 'resource' && !plugin.isGreenwoodDefaultPlugin).map(plugin => plugin.provider({
  context: {
    projectDirectory: process.cwd()
  }
}));

function getCustomLoaderPlugins(url, body, headers) {
  return plugins.filter(plugin => plugin.extensions.includes(path.extname(url)) && (plugin.shouldServe(url, body, headers) || plugin.shouldIntercept(url, body, headers)));
}

// https://nodejs.org/docs/latest-v18.x/api/esm.html#resolvespecifier-context-nextresolve
export function resolve(specifier, context, defaultResolve) {
  const { parentURL } = context;

  if (getCustomLoaderPlugins(specifier).length > 0) {
    return {
      url: new URL(specifier, parentURL).href,
      shortCircuit: true
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}

// https://nodejs.org/docs/latest-v18.x/api/esm.html#loadurl-context-nextload
export async function load(source, context, defaultLoad) {
  const resourcePlugins = getCustomLoaderPlugins(source);
  const extension = path.extname(source).replace('.', '');

  if (resourcePlugins.length) {
    const headers = {
      request: {
        originalUrl: `${source}?type=${extension}`,
        accept: ''
      }
    };
    let contents = '';

    for (const plugin of resourcePlugins) {
      if (await plugin.shouldServe(source, headers)) {
        contents = (await plugin.serve(source, headers)).body || contents;
      }
    }

    for (const plugin of resourcePlugins) {
      if (await plugin.shouldIntercept(fileURLToPath(source), contents, headers)) {
        contents = (await plugin.intercept(fileURLToPath(source), contents, headers)).body || contents;
      }
    }

    // TODO better way to handle remove export default?
    // https://github.com/ProjectEvergreen/greenwood/issues/948
    return {
      format: extension === 'json' ? 'json' : 'module',
      source: extension === 'json' ? JSON.parse(contents.replace('export default ', '')) : contents,
      shortCircuit: true
    };
  }

  return defaultLoad(source, context, defaultLoad);
}