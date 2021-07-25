import { html, LitElement } from 'lit';

class AppHome extends LitElement {
  render() {
    return html`<h1>Home</h1>`;
  }
}

customElements.define('app-route-home', AppHome);