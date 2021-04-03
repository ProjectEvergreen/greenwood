class HeaderComponent extends HTMLElement {
  constructor() {
    super();

    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.root.innerHTML = this.getTemplate();
  }

  getTemplate() {
    return `
      <header>This is the header component.</header>
    `;
  }
}

customElements.define('app-header', HeaderComponent);