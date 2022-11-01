// Node ^16.15.0
import path from 'path';
import { readAndMergeConfig as initConfig } from './lifecycles/config.js';
import { URL, pathToFileURL, fileURLToPath } from 'url';

const baseURL = pathToFileURL(`${process.cwd()}/`).href;
const config = await initConfig();
const plugins = config.plugins.filter(plugin => plugin.type === 'resource' && !plugin.isGreenwoodDefaultPlugin).map(plugin => plugin.provider({
  context: {
    projectDirectory: process.cwd()
  }
}));

// TODO need to polyfill original URL header instead of extensions?
function getCustomLoaderPlugins(url, body, headers) {
  return plugins.filter(plugin => plugin.extensions.includes(path.extname(url)) && (plugin.shouldServe(url, body, headers) || plugin.shouldIntercept(url, body, headers)));
}

export function resolve(specifier, context, defaultResolve) {
  const { parentURL = baseURL } = context;

  if (getCustomLoaderPlugins(specifier).length > 0) {
    return {
      url: new URL(specifier, parentURL).href
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(source, context, defaultLoad) {
  const resourcePlugins = getCustomLoaderPlugins(source);
  
  if (resourcePlugins.length) {
    const headers = {
      request: {
        originalUrl: `${source}?type=${path.extname(source).replace('.', '')}`,
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

    return {
      format: 'module',
      source: contents
    };
  }

  return defaultLoad(source, context, defaultLoad);
}