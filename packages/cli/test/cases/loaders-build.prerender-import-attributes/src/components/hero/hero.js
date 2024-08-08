import sheet from './hero.css' with { type: 'css' };
import data from './hero.json' with { type: 'json' };

export default class HeroBanner extends HTMLElement {
  clickButton(el) {
    console.log('clicked button =>', el.textContent);
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const template = document.createElement('template');

      template.innerHTML = `
        <div class="hero">
          <h2>${data.message}</h2>
          
          <a href="#">
            <button>Get Started</button>
          </a>
          <a href="#">
            <button>Learn More &#8594</button>
          </a>

        </div>
      `;

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    this.shadowRoot.adoptedStyleSheets = [sheet];
  }
}

customElements.define('app-hero', HeroBanner);