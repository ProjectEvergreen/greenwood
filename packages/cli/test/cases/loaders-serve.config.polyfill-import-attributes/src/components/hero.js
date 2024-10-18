// intentionally break formatting to validate our AST parsing is not impacted / naive
import sheet from './hero.css' with { type: 'css' };
import theme from '../theme.css' with { type: 'css' };
import data from './hero.json' with { type: 'json' };

const template = document.createElement('template');

export default class HeroBanner extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      template.innerHTML = `
        <div class="hero">
          <h2>${data.msg}</h2>
          
          <a href="/get-started">
            <button>Get Started</button>
          </a>
          <a href="/learn-more">
            <button>Learn More &#8594</button>
          </a>

        </div>
      `;

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    this.shadowRoot.adoptedStyleSheets = [theme, sheet];
  }
}

customElements.define('app-hero', HeroBanner);