import { html, LitElement } from 'lit-element';
import { connectRouter } from 'lit-redux-router';
import { applyMiddleware, createStore, compose as origCompose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import thunk from 'redux-thunk';

// eslint-disable-next-line no-underscore-dangle
const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;

// eslint-disable-next-line
const store = createStore(
  (state, action) => state, // eslint-disable-line
  compose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk)));

import '../components/index.js';
import './list';

connectRouter(store);

class AppComponent extends LitElement {
  render() {
    return html`
        <lit-route path="/" component="home-page"></lit-route>
        MYROUTES
    `;
  }
}

customElements.define('eve-app', AppComponent);
