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
  console.debug('RESOLVE', specifier);

  if (getCustomLoaderPlugins(specifier).length > 0) {
    console.debug('===> use custom resolve', new URL(specifier, parentURL).href);
    return {
      url: new URL(specifier, parentURL).href
    };
  }

  console.debug('===> use default resolve');
  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(source, context, defaultLoad) {
  console.debug('###### LOAD');
  const resourcePlugins = getCustomLoaderPlugins(source);
  
  if (resourcePlugins.length) {
    console.debug('===> use custom load', source);
    const headers = {
      request: {
        originalUrl: `${source}?type=${path.extname(source).replace('.', '')}`,
        accept: ''
      }
    };
    let contents = '';

    console.debug('111111', contents);
    for (const plugin of resourcePlugins) {
      if (await plugin.shouldServe(source, headers)) {
        contents = (await plugin.serve(source, headers)).body || contents;
      }
    }

    console.debug('222222', contents);
    for (const plugin of resourcePlugins) {
      if (await plugin.shouldIntercept(fileURLToPath(source), contents, headers)) {
        contents = (await plugin.intercept(fileURLToPath(source), contents, headers)).body || contents;
      }
    }

    console.debug('@@@@@@@@@', { contents });
    return {
      format: 'module',
      source: contents
    };
  }

  console.debug('===> use default load', source);
  return defaultLoad(source, context, defaultLoad);
}