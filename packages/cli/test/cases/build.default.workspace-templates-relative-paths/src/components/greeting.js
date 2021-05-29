const template = document.createElement('template');
      
template.innerHTML = `
  <footer>This is the footer component.</footer>
`;

class FooterComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('app-footer', FooterComponent);