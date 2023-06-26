const template = document.createElement('template');

template.innerHTML = `
  <p>Hello from the greeting component!</p>
`;

class GreetingComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('x-greeting', GreetingComponent);