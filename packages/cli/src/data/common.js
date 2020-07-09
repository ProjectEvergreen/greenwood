// const crypto = require('crypto');

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

function getQueryKeysHash(query) {
  const queryKeys = getQueryKeysFromSelectionSet(query.definitions[0].selectionSet);
  
  // return crypto.createHash('md5').update(hash).digest('hex');  
  return queryKeys;
}

module.exports = {
  getQueryKeysHash
};