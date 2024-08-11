import { getContent } from '@greenwood/cli/src/data/queries.js';

export default class ToC extends HTMLElement {
  async connectedCallback() {
    const pages = await getContent();

    this.innerHTML = `
      <ol>
        ${
          pages.map((page) => {
            const { label, route } = page;
            return `
              <li>
                <a href='${route}'>${label}</a>
              </li>
            `;
          }).join('')
        }
      </ol>
    `;
  }
}

customElements.define('x-toc', ToC);