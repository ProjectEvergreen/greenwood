import { LitElement, html } from 'lit-element';
import client from '@greenwood/cli/data/client';
import NavigationQuery from '@greenwood/cli/data/queries/navigation';

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
      query: NavigationQuery
    });

    this.navigation = response.data.navigation;
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
                  <a href="${item.link}" title="Click to visit the ${item.label} page">${item.label}</a>
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