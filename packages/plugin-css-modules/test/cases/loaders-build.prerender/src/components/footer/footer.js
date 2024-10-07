import styles from './footer.module.css';

export default class Footer extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="${styles.footer}">
        <img class="${styles.logo}"/>

        <ul class="${styles.socialTray}">
          <li class="${styles.socialIcon}">
            <a href="https://github.com/ProjectEvergreen/greenwood" title="GitHub">
              GitHub
            </a>
          </li>

          <li class="${styles.socialIcon}">
            <a href="https://discord.gg/bsy9jvWh" title="Discord">
              Discord
            </a>
          </li>

          <li class="${styles.socialIcon}">
            <a href="https://twitter.com/PrjEvergreen" title="Twitter">
              Twitter
            </a>
          </li>
        </ul>
      </footer>
    `;
  }
}

customElements.define('app-footer', Footer);