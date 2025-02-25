import { getContentByCollection } from "@greenwood/cli/src/data/client.js";

export default class Footer extends HTMLElement {
  async connectedCallback() {
    const linkItems = await getContentByCollection("footer");

    this.innerHTML = `
      <footer>
        <ul>
          ${linkItems
            .map((item) => {
              const { route, label, title } = item;

              return `
                <li><a href="${route}" title="${title}">${label}</a></li>
              `;
            })
            .join("")}
        </ul>
      </footer>
    `;
  }
}

customElements.define("x-footer", Footer);
