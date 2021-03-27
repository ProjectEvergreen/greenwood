class HeaderComponent extends HTMLElement {
  constructor() {
    super();

    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = `
      <header>This is the header component.</header>
    `;
  }
}

customElements.define('app-header', HeaderComponent);