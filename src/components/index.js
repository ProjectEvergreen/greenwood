import { html, LitElement } from 'lit-element';

class index extends LitElement {
  render() {
    return html`
      <h1>Greenwood</h1>
      <div>
        This22 is the home page built by Greenwood. Make your own pages in <i>src/pages/index.js</i>!
      </div>
    `;
  }
}

customElements.define('home-page', index);