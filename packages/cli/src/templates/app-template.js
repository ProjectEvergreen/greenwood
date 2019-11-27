import { html, LitElement } from 'lit-element';
import { connectRouter } from 'lit-redux-router';
import { applyMiddleware, createStore, compose as origCompose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import thunk from 'redux-thunk';

// eslint-disable-next-line no-underscore-dangle
const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;

const store = createStore((state) => state,
  compose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk))
);

import '/lib/graphql-client'; // TODO webpack alias to packages/cli/lib directory
import '../index/index';
import './list';

connectRouter(store);

class AppComponent extends LitElement {
  render() {
    return html`
        MYROUTES
        <lit-route><h1>404 Not found</h1></lit-route>
    `;
  }
}

customElements.define('eve-app', AppComponent);