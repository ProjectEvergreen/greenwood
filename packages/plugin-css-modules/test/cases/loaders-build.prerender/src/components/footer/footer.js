import footer from './footer.module.css';

export default class Footer extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="${footer.footer}">
        <img class="${footer.logo}"/>

        <ul class="${footer.socialTray}">
          <li class="${footer.socialIcon}">
            <a href="https://github.com/ProjectEvergreen/greenwood" title="GitHub">
              GitHub
            </a>
          </li>

          <li class="${footer.socialIcon}">
            <a href="https://discord.gg/bsy9jvWh" title="Discord">
              Discord
            </a>
          </li>

          <li class="${footer.socialIcon}">
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