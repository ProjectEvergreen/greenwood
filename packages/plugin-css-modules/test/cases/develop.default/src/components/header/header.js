import styles from './header.module.css';
import '../logo/logo.js';

export default class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="${styles.container}">
        <ul class="${styles.navBarMenu}">
          <li class="${styles.navBarMenuItem}">
            <a href="/about/" title="Documentation">About</a>
          </li>
          <li class="${styles.navBarMenuItem}">
            <a href="/contact/" title="Guides">Contact</a>
          </li>
        </ul>
      </header>
    `;
  }
}

customElements.define('app-header', Header);