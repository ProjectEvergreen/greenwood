export default class Header extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      const template = document.createElement("template");

      template.innerHTML = `
        <header>
          <span>Welcome to my site</span>
        </header>
      `;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define("x-header", Header);
