import { html, LitElement } from 'lit-element';
import { connectRouter } from 'lit-redux-router';
import { applyMiddleware, createStore, compose as origCompose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import thunk from 'redux-thunk';
import client from '@greenwood/cli/data/client';
import ConfigQuery from '@greenwood/cli/data/queries/config';

// eslint-disable-next-line no-underscore-dangle
const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;

const store = createStore((state) => state,
  compose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk))
);

import '../index/index';
import './list';

connectRouter(store);

class AppComponent extends LitElement {

  async connectedCallback() {
    super.connectedCallback();

    const response = await client.query({
      query: ConfigQuery
    });
    const { config } = response.data;

    console.log('app template config', response.data.config);
    this.setDocoumentTitle(config.title);
  }

  setDocoumentTitle(title) {
    console.log('setDocoumentTitle', title);
    const head = document.head;
    const titleElement = head.getElementsByTagName('title')[0];

    titleElement.innerHTML = title;
  }

  render() {
    return html`
        MYROUTES
        <lit-route><h1>404 Not found</h1></lit-route>
    `;
  }
}

customElements.define('eve-app', AppComponent);