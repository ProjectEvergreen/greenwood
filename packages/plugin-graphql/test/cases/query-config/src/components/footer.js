import client from '@greenwood/plugin-graphql/src/core/client.js';
import ConfigQuery from '@greenwood/plugin-graphql/src/queries/config.gql';

class FooterComponent extends HTMLElement {
  constructor() {
    super();

    this.root = this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    await client.query({
      query: ConfigQuery
    }).then((response) => {
      this.root.innerHTML = `
        <footer>${response.data.config.optimization}</footer>
      `;
    });
  }
}

customElements.define('app-footer', FooterComponent);