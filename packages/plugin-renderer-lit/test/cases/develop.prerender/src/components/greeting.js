import { LitElement, html } from "lit";

class Greeting extends LitElement {
  render() {
    return html`<p>Hello from prerendered Lit</p>`;
  }
}
customElements.define("lit-greeting", Greeting);
