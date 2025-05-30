import { html, LitElement } from "lit";
import client from "@greenwood/plugin-graphql/src/core/client.js";
import GraphQuery from "@greenwood/plugin-graphql/src/queries/graph.gql";

class DebugOutputComponent extends LitElement {
  static get properties() {
    return {
      pages: Array,
    };
  }

  constructor() {
    super();
    this.pages = [];
  }

  async connectedCallback() {
    super.connectedCallback();
    const response = await client.query({
      query: GraphQuery,
    });

    this.pages = response.data.graph;
  }

  render() {
    const { pages } = this;

    return html`
      <h1>My Posts</h1>

      <div class="pages">
        <ul>
          ${pages.map((page) => {
            return html` <li>${page.label}</li> `;
          })}
        </ul>
      </div>
    `;
  }
}

customElements.define("debug-output", DebugOutputComponent);
