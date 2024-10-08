import header from './header.module.css';

export default class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="${header.container}">
        <ul class="${header.navBarMenu}">
          <li class="${header.navBarMenuItem}">
            <a href="/about/" title="Documentation">About</a>
          </li>
          <li class="${header.navBarMenuItem}">
            <a href="/contact/" title="Guides">Contact</a>
          </li>
        </ul>
      </header>
    `;
  }
}

customElements.define('app-header', Header);