import { html, LitElement } from 'lit-element';
import { connectRouter } from 'lit-redux-router';
import { applyMiddleware, createStore, compose as origCompose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import thunk from 'redux-thunk';
import '../components/header/header';
import '../components/footer/footer';

// eslint-disable-next-line no-underscore-dangle
const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;

// eslint-disable-next-line
const store = createStore(
  (state, action) => state, // eslint-disable-line
  compose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk)));

import '../index/index.js';

connectRouter(store);

class AppComponent extends LitElement {
  render() {
    return html`
      <div class='wrapper'>
        <eve-header></eve-header>
        MYROUTES
        <lit-route><h1>404 Not found</h1></lit-route>
        <eve-footer></eve-footer>
      </div>
    `;
  }
}

customElements.define('eve-app', AppComponent);
