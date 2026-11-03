export default class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<header>Page prerendering</header>";
  }
}
customElements.define("app-header", Header);
