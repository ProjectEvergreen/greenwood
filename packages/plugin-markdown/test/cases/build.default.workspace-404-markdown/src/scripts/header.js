const template = document.createElement("template");

template.innerHTML = `
  <header>This is the header component.</header>
`;

class HeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define("app-header", HeaderComponent);
