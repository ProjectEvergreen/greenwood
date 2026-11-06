export default class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<header>Prerendered SPA shell</header>";
  }
}
customElements.define("app-header", Header);
