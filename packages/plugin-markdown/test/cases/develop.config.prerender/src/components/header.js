export default class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<header>Prerendered Markdown header</header>";
  }
}
customElements.define("app-header", Header);
