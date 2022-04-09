// https://dev.to/valeriavg/how-to-use-custom-files-as-modules-in-nodejs-51lp
console.debug('@@@@@@@@@@@ bootstrap!!!!!!');

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

function getCustomLoaderPlugins(url, body, headers) {
  return plugins.filter(plugin => plugin.extensions.includes(path.extname(url)) && (plugin.shouldServe(url, body, headers) || plugin.shouldIntercept(url, body, headers)));
}

export function resolve(specifier, context, defaultResolve) {
  const { parentURL = baseURL } = context;

  // Node.js normally errors on unknown file extensions, so return a URL for
  // specifiers ending in the specified file extensions.
  if (getCustomLoaderPlugins(specifier).length > 0) {
    return {
      url: new URL(specifier, parentURL).href
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export function getFormat(url, context, defaultGetFormat) {
  // Now that we patched resolve to let new file types through, we need to
  // tell Node.js what format such URLs should be interpreted as.
  if (getCustomLoaderPlugins(url).length > 0) {
    return {
      format: 'module'
    };
  }
  // Let Node.js handle all other URLs.
  return defaultGetFormat(url, context, defaultGetFormat);
}

export async function transformSource(source, context, defaultTransformSource) {
  const { url } = context;
  const serverPlugins = getCustomLoaderPlugins(url, source);

  if (serverPlugins.length) {
    let contents = source.toString();

    for (const plugin of serverPlugins) {
      const headers = {
        request: {
          originalUrl: `${url}?type=${path.extname(url).replace('.', '')}`,
          accept: ''
        }
      };
      if (await plugin.shouldServe(url, headers)) {
        contents = (await plugin.serve(url, headers)).body || contents;
      }
    }

    for (const plugin of serverPlugins) {
      const headers = {
        request: {
          originalUrl: `${url}?type=${path.extname(url).replace('.', '')}`,
          accept: ''
        }
      };

      if (await plugin.shouldIntercept(fileURLToPath(url), contents, headers)) {
        contents = (await plugin.intercept(fileURLToPath(url), contents, headers)).body || contents;
      }
    }

    return {
      source: contents
    };
  }

  // Let Node.js handle all other sources.
  return Promise.resolve(defaultTransformSource(source, context, defaultTransformSource));
}