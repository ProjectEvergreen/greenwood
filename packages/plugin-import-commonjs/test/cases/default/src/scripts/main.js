import _ from 'lodash';

const output = JSON.stringify(_.defaults({ 'a': 1 }, { 'a': 3, 'b': 2 }));
document.getElementsByTagName('span')[0].innerHTML = `hello from lodash ${output}`;