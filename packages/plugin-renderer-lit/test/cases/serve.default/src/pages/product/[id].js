import { LitElement, html } from "lit";

export default class ProductDetailsPage extends LitElement {
  #id;

  connectedCallback() {
    super.connectedCallback();
    this.#id = this.getAttribute("id");
  }

  render() {
    return html`
      <h1>Product Details Page</h1>
      <p>Product ID: ${this.#id}</p>
    `;
  }
}
