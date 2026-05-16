import { LitElement, html } from "lit";

export default class ProductsPage extends LitElement {
  // TODO: async connectedCallback - https://github.com/lit/lit/issues/2469#issuecomment-1759583861
  connectedCallback() {
    this.products = [
      {
        id: 1,
        name: "Product 1",
      },
      {
        id: 2,
        name: "Product 2",
      },
    ];
  }

  render() {
    const { products } = this;

    return html`
      <h1>Products Page</h1>
      <ul>
        ${products.map((product) => {
          const { id, name } = product;

          return html`<li>${id}) ${name}</li>`;
        })}
      </ul>
    `;
  }
}
