const template = document.createElement('template');
      
template.innerHTML = `
  <h3>Hello from the greeting component!</h3>
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