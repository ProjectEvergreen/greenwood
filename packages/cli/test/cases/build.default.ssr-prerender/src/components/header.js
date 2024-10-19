const template = document.createElement('template');

template.innerHTML = `
  <header>
    <h1>This is the header component.</h1>
  </header>
`;

export default class HeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('app-header', HeaderComponent);