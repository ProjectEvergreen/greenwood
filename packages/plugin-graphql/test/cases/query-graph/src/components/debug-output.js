import { html, LitElement } from 'lit';
import client from '@greenwood/plugin-graphql/core/client';
import GraphQuery from '@greenwood/plugin-graphql/queries/graph';

class DebugOutputComponent extends LitElement {

  static get properties() {
    return {
      pages: Array
    };
  }

  constructor() {
    super();
    this.pages = [];
  }

  async connectedCallback() {
    super.connectedCallback();
    const response = await client.query({
      query: GraphQuery
    });

    this.pages = response.data.graph;
  }

  /* eslint-disable indent */
  render() {
    const { pages } = this;

    return html`
      <h1>My Posts</h1>

      <div class="pages">          
        <ul>
          ${pages.map((page) => {
            return html`
              <li>${page.label}</li>
            `;
          })}
        </ul>
      </div>
    `;
  }
  /* eslint-enable */
}

customElements.define('debug-output', DebugOutputComponent);