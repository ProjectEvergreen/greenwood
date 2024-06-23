import sheet from './logo.css' with { type: 'css' };

const template = document.createElement('template');

template.innerHTML = `
  <a href="https://www.greenwoodjs.dev">
    <img src="https://www.greenwoodjs.io/assets/greenwood-logo-og.png">
  </a>
`;

class Logo extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    this.shadowRoot.adoptedStyleSheets = [sheet];
  }
}

customElements.define('x-logo', Logo);