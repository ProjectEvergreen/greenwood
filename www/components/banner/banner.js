import { html, LitElement } from 'lit-element';
import css from './banner.css';
import button from './button.css';
import '@evergreen-wc/eve-button';

class Banner extends LitElement {
  render() {
    return html`
      <style>
        ${css}
      </style>
      <div class='banner'>
          <div class='content'>
              <h1>Greenwood</h1>
              <h3>Static Site Generator</h3>
              <eve-button size="md" href="/about" style="${button}">Documentation</eve-button>
              <eve-button size="md" href="/about" style="${button}">Guide</eve-button>
              
          </div>
      </div>
    `;
  }
}

customElements.define('eve-banner', Banner);