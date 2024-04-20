import sheet from './card.css' with { type: 'css' };
import data from './card.json' with { type: 'json' };

export default class Card extends HTMLElement {

  connectedCallback() {
    if (!this.shadowRoot) {
      const name = this.getAttribute('name') || 'World';
      const template = document.createElement('template');

      template.innerHTML = `
        <div class="card">
          <img alt="logo" href="${data.image.url}">
          <h2>Hello, ${name}!</h2>
        </div>
        <hr/>
      `;

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    this.shadowRoot.adoptedStyleSheets = [sheet];
  }
}

customElements.define('app-card', Card);