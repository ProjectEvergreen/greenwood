import { html, LitElement } from 'lit-element';
import { connectRouter } from 'lit-redux-router';
import { applyMiddleware, createStore, compose as origCompose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import thunk from 'redux-thunk';
import client from '@greenwood/cli/data/client';
import ConfigQuery from '@greenwood/cli/data/queries/config';
import GraphQuery from '@greenwood/cli/data/queries/graph';

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
    const route = window.location.pathname;
    const response = await Promise.all([
      await client.query({
        query: ConfigQuery
      }),
      await client.query({
        query: GraphQuery
      })
    ]);
    const { config } = response[0].data;
    const currentPage = response[1].data.graph.filter((page) => {
      return route === page.link;
    })[0];
    const currentPageTitleSuffix = currentPage.link === '/'
      ? ''
      : ` - ${currentPage.title}`;
    const fullTitle = `${config.title}${currentPageTitleSuffix}`;

    this.setDocoumentTitle(fullTitle);
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