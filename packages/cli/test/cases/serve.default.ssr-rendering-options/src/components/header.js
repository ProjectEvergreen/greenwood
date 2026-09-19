export default class AppHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<p>Prerendered app header</p>";
  }
}

customElements.define("app-header", AppHeader);
