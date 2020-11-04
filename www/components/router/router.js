import { html, LitElement } from 'lit-element';
import { connectRouter } from 'lit-redux-router';
import { createStore, compose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';

const store = createStore((state) => state,
  compose(lazyReducerEnhancer(combineReducers))
);

connectRouter(store);

class router extends LitElement {
  
  render() {
    return html`
      <div>
        
      </div>
    `;
  }
}

customElements.define('lit-router', router);