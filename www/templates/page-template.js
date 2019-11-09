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
    } catch (err) {
      console.log(err);
    }
  }

  validatePath() {
    const pathname = window.location.pathname;
    const pattern = new RegExp(/^[a-z0-9_&\-\/]+$/gi);

    if (pattern.test(pathname)) {
      // netlify
      if (pathname.indexOf('/') === pathname.length - 1) {
        pathname = pathname.substring(0, pathname.length - 1);
      }
      return pathname;
    } else {
      throw new Error('invalid pathname');
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
        const staticCacheUrl = this.validatePath() + '/cache.json';

        // better solution perhaps a mutation?
        let anyScripts = document.querySelector('script[state=apollo]'); // exists in document
        let script = this.querySelector('script[state=apollo]'); // exists in component

        if (!script && !anyScripts) {
          // query and set cache during serialize
          await this.performQuery();
          // create client cache
          this.createClientCache(this.client.extract());
          this.requestUpdate();

        }
        if (!script && anyScripts) {
          // fetch static cache
          let staticCache = await getCache(staticCacheUrl);

          if (staticCache) {
            // create client cache
            this.createClientCache(staticCache);
            await this.performQuery();
            this.requestUpdate();

          }
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  createClientCache(cache) {
    let state = JSON.stringify(cache);

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
        const url = this.validatePath();
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