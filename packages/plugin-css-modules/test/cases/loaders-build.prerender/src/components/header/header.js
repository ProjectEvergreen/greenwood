import styles from './header.module.css';

export default class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="${styles.container}">
        <div class="${styles.navBar}">
          <nav role="navigation" aria-label="Main">
            <ul class="${styles.navBarMenu}">
              <li class="${styles.navBarMenuItem}">
                <a href="/docs/" title="Documentation">Docs</a>
              </li>
              <li class="${styles.navBarMenuItem}">
                <a href="/guides/" title="Guides">Guides</a>
              </li>
              <li class="${styles.navBarMenuItem}">
                <a href="/blog/" title="Blog">Blog</a>
              </li>
            </ul>
          </nav>

          <nav role="navigation" aria-label="Social">
            <ul class="${styles.socialTray}">
              <li class="${styles.socialIcon}">
                <a href="https://github.com/ProjectEvergreen/greenwood" title="GitHub">
                  <i></i>
                </a>
              </li>

              <li class="${styles.socialIcon}">
                <a href="https://discord.gg/bsy9jvWh" title="Discord">
                  <i></i>
                </a>
              </li>

              <li class="${styles.socialIcon}">
                <a href="https://twitter.com/PrjEvergreen" title="Twitter">
                  <i></i>
                </a>
              </li>
            </ul>
          </nav>

          <button class="${styles.mobileMenuIcon}" popovertarget="mobile-menu" aria-label="Mobile Menu Icon Button">
            <i></i>
          </button>
        </div>

        <div id="mobile-menu" popover="manual">
          <div class="${styles.mobileMenuBackdrop}">

            <button class="${styles.mobileMenuCloseButton}" popovertarget="mobile-menu" popovertargetaction="hide" aria-label="Mobile Menu Close Button">
              &times;
            </button>
            
            <nav role="navigation" aria-label="Mobile">
              <ul class="${styles.mobileMenuList}">
                <li class="${styles.mobileMenuListItem}">
                  <a href="/docs/" title="Documentation">Docs</a>
                </li>
                <li class="${styles.mobileMenuListItem}">
                  <a href="/guides/" title="Guides">Guides</a>
                </li>
                <li class="${styles.mobileMenuListItem}">
                  <a href="/blog/" title="Blog">Blog</a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
    `;
  }
}

customElements.define('app-header', Header);