import { html, LitElement } from 'lit-element';

class AppHome extends LitElement {
  render() {
    return html`<h1>Home</h1>`;
  }
}

customElements.define('app-home', AppHome);