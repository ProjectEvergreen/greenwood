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
    this.state = {};
  }

  async connectedCallback() {
    super.connectedCallback();
    try {
      await this.setCache();
      this.client = new ApolloClient({
        uri: 'http://localhost:4000',
        // eslint-disable-next-line no-underscore-dangle
        cache: new InMemoryCache().restore(window.__APOLLO_STATE__)
      });
      await this.setupShelf();
      this.setInitialCache();
    } catch (err) {
      console.log(err);
    }
  }

  async setCache() {
    return new Promise(async(resolve, reject) => {
      try {
        // sanitize pathname
        const cacheUrl = window.location.pathname + '/cache.json';
        let script = this.shadowRoot.querySelector('script[state=apollo]');

        if (!script) {
          let cache = await getCache(cacheUrl);

          if (cache) {
            this.state = JSON.stringify(cache);
            const altScript = document.createElement('script');

            altScript.setAttribute('type', 'text/javascript');
            altScript.setAttribute('state', 'apollo');
            altScript.innerText = `window.__APOLLO_STATE__ = ${this.state};`;

            this.shadowRoot.appendChild(altScript);
          }
          resolve();

        }
      } catch (err) {
        reject();
      }
    });
  }

  setInitialCache() {
    let script = this.shadowRoot.querySelector('script[state=apollo]');

    if (!script) {
      const cache = JSON.stringify(this.client.extract());

      script = document.createElement('script');

      script.setAttribute('type', 'text/javascript');
      script.setAttribute('state', 'apollo');
      this.state = `window.__APOLLO_STATE__ = ${cache};`;
      script.innerText = this.state;

      this.shadowRoot.appendChild(script);
    }
  }

  async setupShelf() {
    return new Promise(async(resolve, reject) => {

      try {
        // based on path, display selected menu
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
          this.requestUpdate();
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