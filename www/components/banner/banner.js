import { html, LitElement } from 'lit-element';
import css from './banner.css';
import button from './button.css';
import '@evergreen-wc/eve-button';
import '@evergreen-wc/eve-container';

class Banner extends LitElement {
  render() {
    return html`
      <style>
        ${css}
      </style>
      <div class='banner'>
        <eve-container>
          <div class='content'>
            <h1>Greenwood</h1>
            <hr />
            <h3>Static Site Generator</h3>
            <eve-button size="md" href="/about" style="${button}">Get Started</eve-button>
          </div>
        </eve-container>
      </div>
      
    `;
  }
}

customElements.define('eve-banner', Banner);