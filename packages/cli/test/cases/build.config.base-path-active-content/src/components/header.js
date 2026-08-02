import { getContent } from "@greenwood/cli/src/data/client.js";

export default class Header extends HTMLElement {
  async connectedCallback() {
    const pages = await getContent();

    this.innerHTML = `
      <header>
        <nav>
          <ul>
            ${pages
              .map((page) => {
                const { route, label, title } = page;

                return `
                  <li><a href="${route}" title="${title}">${label}</a></li>
                `;
              })
              .join("")}
          </ul>
        </nav>
      </header>
    `;
  }
}

customElements.define("x-header", Header);
