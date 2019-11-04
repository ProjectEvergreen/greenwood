import { html, LitElement } from 'lit-element';
import ApolloClient from 'apollo-boost';
import gql from 'graphql-tag';
import '../components/header/header';
import '../components/footer/footer';
import '@evergreen-wc/eve-container';
import '../components/shelf/shelf';
import '../components/scroll/scroll';
import pageCss from '../styles/page.css';
import '../styles/theme.css';

MDIMPORT;
METAIMPORT;
METADATA;

const client = new ApolloClient({
  uri: 'http://localhost:4000'
});

class PageTemplate extends LitElement {

  constructor() {
    super();
    this.shelfList = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupShelf();
  }

  async setupShelf() {
    // based on path, display selected menu
    const url = window.location.pathname;
    const urlLastSlash = url.slice(1, url.length).indexOf('/');
    const menuName = url.substring(1, urlLastSlash !== -1 ? urlLastSlash + 1 : url.length);

    let { data } = await client.query({
      query: gql`
        query($name: String!) {
          getMenu(name: $name) {
            name
            items {
              name
              path
            }
          }
        }
      `,
      variables: {
        name: menuName
      }
    });

    if (data && data.getMenu) {
      this.shelfList = data.getMenu.items;
      this.requestUpdate();
    }
  }

  renderShelf() {
    if (this.shelfList.length > 0) {
      return html`<eve-shelf .shelfList="${this.shelfList}"></eve-shelf>`;
    }
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
            ${this.renderShelf()}
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