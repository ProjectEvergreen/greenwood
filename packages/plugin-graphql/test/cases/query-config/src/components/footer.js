import client from '@greenwood/plugin-graphql/core/client';
import ConfigQuery from '@greenwood/plugin-graphql/queries/config';

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