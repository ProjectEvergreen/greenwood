// https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0#gistcomment-2775538
function hashString(queryKeysString) {
  let h = 0;
    
  for (let i = 0; i < queryKeysString.length; i += 1) {
    h = Math.imul(31, h) + queryKeysString.charCodeAt(i) | 0; // eslint-disable-line no-bitwise
  }

  return Math.abs(h).toString();
}

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

  return hashString(`${queryKeys}${variableValues}`);
}

module.exports = {
  getQueryHash
};