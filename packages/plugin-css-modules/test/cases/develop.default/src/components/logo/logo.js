import styles from './logo.module.css';

export default class Logo extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="${styles.container}">
        <img class="${styles.logo}">
      </div>
    `;
  }
}

customElements.define('app-logo', Logo);