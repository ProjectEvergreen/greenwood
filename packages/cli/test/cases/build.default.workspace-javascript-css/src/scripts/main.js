import json from '/assets/data.json?type=json';

const msg = `${json.message} via import, status is - ${json.status}`;

document.getElementsByClassName('output-json-import')[0].innerHTML = msg;
document.getElementsByClassName('output-script-src')[0].innerHTML = 'script tag module with src';