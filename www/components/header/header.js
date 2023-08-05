import { css, html, LitElement, unsafeCSS } from 'lit';
import client from '@greenwood/plugin-graphql/src/core/client.js';
import MenuQuery from '@greenwood/plugin-graphql/src/queries/menu.gql';
import '@evergreen-wc/eve-container';
import headerCss from './header.css?type=css';
import '../social-icons/social-icons.js';

class HeaderComponent extends LitElement {

  static get properties() {
    return {
      navigation: {
        type: Array
      }
    };
  }

  static get styles() {
    return css`
      ${unsafeCSS(headerCss)}
    `;
  }

  constructor() {
    super();
    this.navigation = [];
  }

  async connectedCallback() {
    super.connectedCallback();

    const response = await client.query({
      query: MenuQuery,
      variables: {
        name: 'navigation',
        order: 'index_asc'
      }
    });

    this.navigation = response.data.menu.children.map(item => item.item);
  }

  /* eslint-disable indent */
  render() {
    const { navigation } = this;
    const activeRoute = window.location.pathname;

    return html`
      <header class="header">
        <eve-container fluid>
          <div class="head-wrap">

            <div class="brand">
              <a href="https://projectevergreen.github.io" target="_blank" rel="noopener noreferrer">
                <img src="/assets/evergreen.svg" alt="Greenwood logo"/>
              </a>
              <div class="project-name">
                <a href="/my-subpath/">Greenwood</a>
              </div>
            </div>

            <nav>
              <ul>
                ${navigation.map((item) => {
                  const isCurentPageLink = activeRoute.indexOf(item.route) >= 0;
                  const activeClassName = isCurentPageLink ? 'active' : '';

                  return html`
                    <li>
                      <a href="/my-subpath${item.route}" title="Click to visit the ${item.label} page" class="${activeClassName}">${item.label}</a>
                    </li>
                  `;
                })}
              </ul>
            </nav>

            <app-social-icons></app-social-icons>

          </div>
        </eve-container>
      </header>
    `;
    /* eslint-enable */
  }
}

customElements.define('app-header', HeaderComponent);