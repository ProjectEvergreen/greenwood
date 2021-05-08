import { html, LitElement } from 'lit-element';

class AppAbout extends LitElement {
  render() {
    return html`<h1>About</h1>`;
  }
}

customElements.define('app-about', AppAbout);