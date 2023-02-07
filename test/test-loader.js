// https://jestjs.io/docs/ecmascript-modules
// https://github.com/nodejs/node/discussions/41711
import fs from 'fs';
import path from 'path';
import { load as experimentalLoad, resolve as experimentalResolve } from '../packages/cli/src/loader.js';

export async function load(url, context, defaultLoad) {
  const ext = path.extname(url);

  if (ext === '') {
    return loadBin(url, context, defaultLoad);
  } else {
    return experimentalLoad(url, context, defaultLoad);
  }
}

export function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith('file:')) {
    return experimentalResolve(specifier, context, defaultResolve);
  } else {
    return defaultResolve(specifier, context, defaultResolve);
  }
}

async function loadBin(url, context, defaultLoad) {
  const dirs = path.dirname(url.replace(/[A-Z]:\//g, '')).split('/');
  const parentDir = dirs.at(-1);
  const grandparentDir = dirs.at(-3);

  let format;

  if (parentDir === 'bin' && grandparentDir === 'node_modules') {
    const libPkgUrl = new URL('../package.json', url);
    const { type } = await fs.promises.readFile(libPkgUrl).then(JSON.parse);

    format = type === 'module' ? 'module' : 'commonjs';
  }

  return defaultLoad(url, {
    ...context,
    format
  });
}