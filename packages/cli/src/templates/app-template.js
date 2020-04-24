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

    const currentPageTitleSuffix = !currentPage || currentPage.link === '/'
      ? ''
      : ` - ${currentPage.title}`;
    const fullTitle = `${config.title}${currentPageTitleSuffix}`;

    this.setDocumentTitle(fullTitle);
    this.setMeta(config.meta, currentPage);
  }

  setDocumentTitle(title = '') {
    const head = document.head;
    const titleElement = head.getElementsByTagName('title')[0];

    titleElement.innerHTML = title;
  }

  setMeta(meta = [], currentPage = {}) {
    let header = document.head;

    meta.forEach(metaItem => {
      const metaType = metaItem.rel // type of meta
        ? 'rel'
        : metaItem.name
          ? 'name'
          : 'property';
      const metaTypeValue = metaItem[metaType]; // value of the meta
      let meta = document.createElement('meta');

      if (metaType === 'rel') {
        // change to a <link> tag instead
        meta = document.createElement('link');

        meta.setAttribute('rel', metaTypeValue);
        meta.setAttribute('href', metaItem.href);
      } else {
        const metaContent = metaItem.property === 'og:url'
          ? `${metaItem.content}${currentPage.link}`
          : metaItem.content;

        meta.setAttribute(metaType, metaItem[metaType]);
        meta.setAttribute('content', metaContent);
      }

      const oldmeta = header.querySelector(`[${metaType}="${metaTypeValue}"]`);

      // rehydration
      if (oldmeta) {
        header.replaceChild(meta, oldmeta);
      } else {
        header.appendChild(meta);
      }
    });
  }

  render() {
    return html`
        MYROUTES
        <lit-route><h1>404 Not found</h1></lit-route>
    `;
  }
}

customElements.define('eve-app', AppComponent);