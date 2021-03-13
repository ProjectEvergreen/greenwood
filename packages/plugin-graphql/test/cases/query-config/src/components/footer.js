import client from '@greenwood/plugin-graphql/core/client';
import ConfigQuery from '@greenwood/plugin-graphql/queries/config';

class FooterComponent extends HTMLElement {
  constructor() {
    super();
    console.debug('FooterComponent hello!!!');

    this.root = this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {    
    console.debug(client);
    console.debug(ConfigQuery);

    await client.query({
      query: ConfigQuery
    }).then((response) => {
      this.root.innerHTML = `
        <footer>${response.data.config.title}</footer>
      `;
    });
    // this.root.innerHTML = `
    //   <footer>&copy; ${response.data.config.title}</footer>
    // `;
    // });
  }
}

customElements.define('app-footer', FooterComponent);