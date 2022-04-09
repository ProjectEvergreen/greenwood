console.debug('@@@@@@@@@@@ bootstrap!!!!!!');

import { URL, pathToFileURL } from 'url';

const baseURL = pathToFileURL(`${process.cwd()}/`).href;

// css styles or html files
const extensionsRegex = /\.(html)$/;

export function resolve(specifier, context, defaultResolve) {
  const { parentURL = baseURL } = context;

  // Node.js normally errors on unknown file extensions, so return a URL for
  // specifiers ending in the specified file extensions.
  if (extensionsRegex.test(specifier)) {
    return {
      url: new URL(specifier, parentURL).href
    };
  }
  // Let Node.js handle all other specifiers.
  return defaultResolve(specifier, context, defaultResolve);
}

export function getFormat(url, context, defaultGetFormat) {
  // Now that we patched resolve to let new file types through, we need to
  // tell Node.js what format such URLs should be interpreted as.
  if (extensionsRegex.test(url)) {
    return {
      format: 'module'
    };
  }
  // Let Node.js handle all other URLs.
  return defaultGetFormat(url, context, defaultGetFormat);
}

export function transformSource(source, context, defaultTransformSource) {
  const { url } = context;
  if (extensionsRegex.test(url)) {
    return {
      source: `export default ${JSON.stringify(source.toString())}`
    };
  }

  // Let Node.js handle all other sources.
  return defaultTransformSource(source, context, defaultTransformSource);
}