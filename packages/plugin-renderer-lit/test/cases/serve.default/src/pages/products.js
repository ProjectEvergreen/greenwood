import { LitElement, html } from "lit";

export default class ProductsPage extends LitElement {
  // TODO: constructor props
  constructor() {
    super();
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

  // TODO: connectedCallback - https://github.com/lit/lit/pull/4755
  // TODO: async connectedCallback - https://github.com/lit/lit/issues/2469#issuecomment-1759583861
  // connectedCallback() {
  //   super.connectedCallback();
  //   this.products = [{
  //     id: 1,
  //     name: 'Product 1'
  //   }, {
  //     id: 2,
  //     name: 'Product 2'
  //   }]
  // }

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
