const crypto = require('crypto');

function getQueryKeysFromSelectionSet(selectionSet) {
  let queryKeys = '';

  for (let key in selectionSet) {
    console.log('key is', key);
    
    if (key === 'selections') {
      console.log('key is a selection');
      console.log('unique items before', queryKeys);
      queryKeys += selectionSet[key]
        .filter(selection => selection.name.value !== '__typename') // __typename is added by server.js
        .map(selection => selection.name.value).join('');
      console.log('unique items after', queryKeys);
      console.log('**************');
    }
  }
  
  if (selectionSet.kind === 'SelectionSet') {
    console.log('has a selectionSet, recurse!');
    selectionSet.selections.forEach(selection => {
      if (selection.selectionSet) {
        queryKeys += getQueryKeysFromSelectionSet(selection.selectionSet);
      }
    });
  }

  console.log('return queryKeys.....', queryKeys);
  return queryKeys;
}

function getQueryHash(query, variables = {}) {
  const queryKeys = getQueryKeysFromSelectionSet(query.definitions[0].selectionSet);
  const variableValues = Object.keys(variables).length > 0
    ? `_${Object.values(variables).join('').replace(/\//g, '')}` // handle / which will translate to filepaths
    : '';

  console.log('variableValues', variableValues);

  return crypto.createHash('md5').update(`${queryKeys}${variableValues}`).digest('hex');
}

module.exports = {
  getQueryHash
};