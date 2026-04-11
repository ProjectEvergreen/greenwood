import { LitElement, html } from "lit";

export default class ProductDetailsPage extends LitElement {
  static get properties() {
    return {
      id: { type: Number },
    };
  }

  render() {
    const { id } = this;

    return html`
      <h1>Product Details Page</h1>
      <p>Product ID: ${id}</p>
    `;
  }
}
