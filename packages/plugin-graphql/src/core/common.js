import { hashString } from '@greenwood/cli/src/lib/hashing-utils.js';

function getQueryHash(query, variables = {}) {
  const queryKeys = query;
  const variableValues = Object.keys(variables).length > 0
    ? `_${Object.values(variables).join('').replace(/\//g, '')}` // handle / which will translate to filepaths
    : '';

  return hashString(`${queryKeys}${variableValues}`);
}

export {
  getQueryHash
};