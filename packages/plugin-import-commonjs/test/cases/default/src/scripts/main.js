import _ from 'lodash';

const output = JSON.stringify(_.defaults({ 'a': 1 }, { 'a': 3, 'b': 2 }));

console.debug('FROM LODASH (_.defaults)', output);

document.getElementsByTagName('span')[0].innerHTML = `hello from lodash ${output}`;