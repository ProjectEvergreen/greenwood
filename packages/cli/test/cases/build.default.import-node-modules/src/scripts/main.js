import { createStore } from 'redux';
// import { lazyReducerEnhancer } from 'pwa-helpers';
// import { LitElement } from 'lit-element';
// import { pick } from 'lodash-es';

document.getElementsByClassName('output-redux')[0].innerHTML = `hello from redux ${btoa(createStore).slice(0, 16)}`;
// console.debug('FROM PWA HELPERS', lazyReducerEnhancer);
// console.debug('FROM LIT ELEMENT', LitElement);
// console.debug('FROM LODASH-ES (pick)', pick);