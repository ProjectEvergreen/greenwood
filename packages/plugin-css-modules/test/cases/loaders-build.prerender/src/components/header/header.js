import header from './header.module.css';
import '../logo/logo.js';

export default class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="${header.container}">
        <app-logo></app-logo>
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