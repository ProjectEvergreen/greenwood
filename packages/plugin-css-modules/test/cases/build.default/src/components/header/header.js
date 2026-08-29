import styles from "./header.module.css";
import theme from "./theme.module.css";
import "../logo/logo.js";

const containerClassName = styles.container;
const accentClassName = theme["accent"];

export default class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="${styles.container}" data-container-class="${containerClassName}">
        <app-logo></app-logo>
        <ul class="${styles.navBarMenu}">
          <li class="${styles.navBarMenuItem}">
            <a href="/about/" title="Documentation">About</a>
          </li>
          <li class="${styles.navBarMenuItem}">
            <a href="/contact/" title="Guides">Contact</a>
          </li>
        </ul>
        <p class="${theme.accent}" data-accent-class="${accentClassName}">CSS Modules</p>
      </header>
    `;
  }
}

customElements.define("app-header", Header);
