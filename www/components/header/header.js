import { css, html, LitElement, unsafeCSS } from 'lit';
import client from '@greenwood/plugin-graphql/src/core/client.js';
import CollectionQuery from '@greenwood/plugin-graphql/src/queries/collection.gql';
import headerCss from './header.css?type=raw';
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
      query: CollectionQuery,
      variables: {
        name: 'navigation',
        orderBy: 'order_asc'
      }
    });

    this.navigation = response.data.collection;
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
                <a href="/">Greenwood</a>
              </div>
            </div>

            <nav>
              <ul>
                ${navigation.map((item) => {
                  const isCurrentPageLink = activeRoute.indexOf(item.route) >= 0;
                  const activeClassName = isCurrentPageLink ? 'active' : '';

                  return html`
                    <li>
                      <a href="${item.route}" title="Click to visit the ${item.label} page" class="${activeClassName}">${item.label}</a>
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