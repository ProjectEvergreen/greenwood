import { html, LitElement } from 'lit-element';
import bannerCss from './banner.css';
import buttonCss from './button.css';
import '@evergreen-wc/eve-button';
import '@evergreen-wc/eve-container';

class Banner extends LitElement {
  render() {
    return html`
      <style>
        ${bannerCss}
      </style>
      <div class='banner'>
        <eve-container>
          <div class='content'>
            <h1>Greenwood</h1>
            <hr />
            <h3>Static Site Generator</h3>
            <eve-button size="md" href="/about" style="${buttonCss}">Get Started</eve-button>
          </div>
        </eve-container>
      </div>
      
    `;
  }
}

customElements.define('eve-banner', Banner);