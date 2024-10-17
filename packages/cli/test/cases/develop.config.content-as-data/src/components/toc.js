import { getContent } from '@greenwood/cli/src/data/client.js';

export default class ToC extends HTMLElement {
  async connectedCallback() {
    const pages = await getContent();

    this.innerHTML = `
      <ol>
        ${
          pages.map((page) => {
            const { label, route, title } = page;
            return `
              <li>
                <a href="${route}" title="${title}">${label}</a>
              </li>
            `;
          }).join('')
        }
      </ol>
    `;
  }
}

customElements.define('x-toc', ToC);