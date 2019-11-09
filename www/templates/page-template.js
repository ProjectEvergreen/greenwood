import { html, LitElement } from 'lit-element';
import { InMemoryCache } from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-boost';
import '../components/header/header';
import '../components/footer/footer';
import '@evergreen-wc/eve-container';
import '../components/shelf/shelf';
import '../components/scroll/scroll';
import { getCache, GET_MENU } from '../queries/menus';
import pageCss from '../styles/page.css';
import '../styles/theme.css';

MDIMPORT;
METAIMPORT;
METADATA;

class PageTemplate extends LitElement {

  constructor() {
    super();
    this.shelfList = [];
  }

  async connectedCallback() {
    super.connectedCallback();

    try {
      await this.setCache();
      this.requestUpdate();
    } catch (err) {
      console.log(err);
    }
  }

  async performQuery() {
    // initialize client
    this.client = new ApolloClient({
      uri: 'http://localhost:4000',
      // eslint-disable-next-line no-underscore-dangle
      cache: new InMemoryCache().restore(window.__APOLLO_STATE__)
    });
    return this.setupShelf();
  }

  async setCache() {
    return new Promise(async(resolve, reject) => {
      try {
        // reminder sanitize pathname
        const staticCacheUrl = window.location.pathname + '/cache.json';

        // better solution to this condition preferred
        let anyScripts = document.querySelector('script[state=apollo]'); // exists in document
        let script = this.querySelector('script[state=apollo]'); // exists in component

        if (!script && !anyScripts) {
          await this.performQuery();
          this.createClientCache(this.client.extract());
        }
        if (!script && anyScripts) {
          // fetch static cache
          let staticCache = await getCache(staticCacheUrl);

          if (staticCache) {
            // create cache
            this.createClientCache(staticCache);
            await this.performQuery();
          }
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  createClientCache(cache) {
    const state = JSON.stringify(cache);

    let script = document.createElement('script');

    script.setAttribute('type', 'text/javascript');
    script.setAttribute('state', 'apollo');
    script.innerText = `window.__APOLLO_STATE__ = ${state};`;

    this.shadowRoot.appendChild(script);
  }

  async setupShelf() {
    return new Promise(async(resolve, reject) => {

      try {
        // based on path, display selected menu
        // reminder sanitize pathname
        const url = window.location.pathname;
        const urlLastSlash = url.slice(1, url.length).indexOf('/');
        const menuName = url.substring(1, urlLastSlash !== -1 ? urlLastSlash + 1 : url.length);

        let { data } = await this.client.query({
          query: GET_MENU,
          variables: {
            name: menuName
          }
        });

        if (data && data.getMenu) {
          this.shelfList = data.getMenu.items;
          resolve();
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  render() {
    return html`
      <style>
        ${pageCss}
      </style>
      METAELEMENT
      <div class='wrapper'>
        <eve-header></eve-header>
        <div class='content-wrapper'>
          <div class="sidebar">
            <eve-shelf .shelfList="${this.shelfList}"></eve-shelf>
          </div>
          <div class="content">
            <eve-container fluid>
              <eve-scroll>
                <entry></entry>
              </eve-scroll>
            </eve-container>
          </div>
        </div>
        <eve-footer></eve-footer>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);