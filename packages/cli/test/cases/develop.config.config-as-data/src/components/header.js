import { getContentByCollection } from '@greenwood/cli/src/data/client.js';

export default class Header extends HTMLElement {
  async connectedCallback() {
    const navItems = (await getContentByCollection('nav')).sort((a, b) =>
      a.data.order > b.data.order ? 1 : -1
    );

    this.innerHTML = `
      <header>
        <nav>
          <ul>
            ${
              navItems.map((item) => {
                const { route, label, title } = item;

                return `
                  <li><a href="${route}" title="${title}">${label}</a></li>
                `;
              }).join('')
            }
          </ul>
        </nav>
      </header>
    `;
  }
}

customElements.define('x-header', Header);