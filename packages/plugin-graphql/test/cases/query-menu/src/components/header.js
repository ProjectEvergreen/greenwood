import { LitElement, html } from 'lit';
import client from '@greenwood/plugin-graphql/src/core/client.js';
import MenuQuery from '@greenwood/plugin-graphql/src/queries/menu.gql';

class HeaderComponent extends LitElement {

  static get properties() {
    return {
      navigation: {
        type: Array
      }
    };
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
        menu: 'navigation'
      }
    });

    this.navigation = response.data.menu.children.map(item => item.item);
  }

  /* eslint-disable indent */
  render() {
    const { navigation } = this;

    return html`
      <header class="header">

        <nav>
          <ul>
            ${navigation.map((item) => {
              return html`
                <li>
                  <a href="${item.route}" title="Click to visit the ${item.label} page">${item.label}</a>
                </li>
              `;
            })}
          </ul>
        </nav>
      </header>
    `;
    /* eslint-enable */
  }
}

customElements.define('app-header', HeaderComponent);