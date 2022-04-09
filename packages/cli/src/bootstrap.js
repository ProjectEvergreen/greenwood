// https://dev.to/valeriavg/how-to-use-custom-files-as-modules-in-nodejs-51lp
console.debug('@@@@@@@@@@@ bootstrap!!!!!!');

import path from 'path';
import { readAndMergeConfig as initConfig } from './lifecycles/config.js';
import { URL, pathToFileURL } from 'url';

const baseURL = pathToFileURL(`${process.cwd()}/`).href;
const config = await initConfig();
const plugins = config.plugins.filter(plugin => plugin.type === 'resource' && !plugin.isGreenwoodDefaultPlugin).map(plugin => plugin.provider({}));

function getCustomLoaderPlugins(url, body) {
  return plugins.filter(plugin => plugin.extensions.includes(path.extname(url)) && (plugin.shouldServe(url) || plugin.shouldIntercept(url, body)));
}

export function resolve(specifier, context, defaultResolve) {
  const { parentURL = baseURL } = context;

  // Node.js normally errors on unknown file extensions, so return a URL for
  // specifiers ending in the specified file extensions.
  // TODO remove .html demo code
  if (getCustomLoaderPlugins(specifier).length > 0 || specifier.endsWith('.html')) {
    console.log('resolve custom extension', new URL(specifier, parentURL).href);
    return {
      url: new URL(specifier, parentURL).href
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export function getFormat(url, context, defaultGetFormat) {
  // Now that we patched resolve to let new file types through, we need to
  // tell Node.js what format such URLs should be interpreted as.
  // TODO remove .html demo code
  if (getCustomLoaderPlugins(url).length > 0 || url.endsWith('.html')) {
    return {
      format: 'module'
    };
  }
  // Let Node.js handle all other URLs.
  return defaultGetFormat(url, context, defaultGetFormat);
}

export async function transformSource(source, context, defaultTransformSource) {
  const { url } = context;
  console.debug('!!!!!!!!!!!!!! transformSource url', url);
  const serverPlugins = getCustomLoaderPlugins(url, source); // plugins.filter(plugin => plugin.extensions.includes(ext) && plugin.shouldServe);

  console.debug({ source });
  console.debug({ serverPlugins });

  // TODO remove .html demo code
  if (url.endsWith('.html')) {
    return {
      source: `export default ${JSON.stringify(source.toString())}`
    };
  }

  if (serverPlugins.length > 0 && url.endsWith('.css')) {
    console.log('transformSource custom extension', url);
    console.log('serverPlugins[0].serve(url)', await serverPlugins[1].intercept(url, source.toString()));
    return {
      source: (await serverPlugins[1].intercept(url, source.toString())).body // `export default ${JSON.stringify(source.toString())}`
    };
  }

  console.debug('======================');

  // Let Node.js handle all other sources.
  return Promise.resolve(defaultTransformSource(source, context, defaultTransformSource));
}