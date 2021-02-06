import { LitElement } from 'lit-element';
import { defaults } from 'lodash-es';
import { lazyReducerEnhancer } from 'pwa-helpers';
import { createStore } from 'redux';

document.getElementsByClassName('output-lit')[0].innerHTML = `import from lit-element ${btoa(LitElement).slice(0, 16)}`;
document.getElementsByClassName('output-lodash')[0].innerHTML = `import from lodash-es ${JSON.stringify(defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 }))}`;
document.getElementsByClassName('output-pwa')[0].innerHTML = `import from pwa-helpers ${btoa(lazyReducerEnhancer).slice(0, 16)}`;
document.getElementsByClassName('output-redux')[0].innerHTML = `import from redux ${btoa(createStore).slice(0, 16)}`;