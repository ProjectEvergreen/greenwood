const template = document.createElement('template');

template.innerHTML = `
  <header>Welcome to my blog!</header>
`;

class HeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('x-header', HeaderComponent);