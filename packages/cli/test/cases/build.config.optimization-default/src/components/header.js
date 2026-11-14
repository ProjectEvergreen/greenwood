import { heading } from "#/system/heading.js";

class HeaderComponent extends HTMLElement {
  constructor() {
    super();

    this.root = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.root.innerHTML = this.getTemplate();
  }

  getTemplate() {
    return `
      <header>${heading}</header>
    `;
  }
}

customElements.define("app-header", HeaderComponent);
