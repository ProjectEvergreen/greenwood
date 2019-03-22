import { html, LitElement } from 'lit-element';

class index extends LitElement {
  render() {
    return html`
      <div>
        Home page
      </div>
    `;
  }
}

customElements.define('home-page', index);