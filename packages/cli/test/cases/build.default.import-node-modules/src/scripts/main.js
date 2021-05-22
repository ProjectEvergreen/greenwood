import { LitElement } from 'lit';
import { defaults } from 'lodash-es';
import { lazyReducerEnhancer } from 'pwa-helpers';
import { createStore } from 'redux';

try {
  document.getElementsByClassName('output-lit')[0].innerHTML = `import from lit ${btoa(LitElement.prototype).slice(0, 16)}`;
  document.getElementsByClassName('output-lodash')[0].innerHTML = `import from lodash-es ${JSON.stringify(defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 }))}`;
  document.getElementsByClassName('output-pwa')[0].innerHTML = `import from pwa-helpers ${btoa(lazyReducerEnhancer).slice(0, 16)}`;
  document.getElementsByClassName('output-redux')[0].innerHTML = `import from redux ${btoa(createStore).slice(0, 16)}`;
} catch (e) {
  document.getElementsByClassName('output-error')[0].innerHTML = e;
}