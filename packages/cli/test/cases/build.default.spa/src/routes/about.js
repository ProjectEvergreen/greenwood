import { html, LitElement } from 'lit';

class AppAbout extends LitElement {
  render() {
    return html`<h1>About</h1>`;
  }
}

customElements.define('app-route-about', AppAbout);