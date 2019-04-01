import { html, LitElement } from 'lit-element';

class index extends LitElement {
  render() {
    return html`
      <h1>Greenwood</h1>
      <div>
        <h1>This is the home page built by Greenwood. Make your own pages in <i>src/pages/index.js</i>!</h1>
        
        <p><a href="/hello">Hello Page</a></p>
      </div>
    `;
  }
}

customElements.define('home-page', index);