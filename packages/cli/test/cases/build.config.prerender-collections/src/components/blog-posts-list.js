import { getContentByRoute } from '@greenwood/cli/src/data/client.js';

export default class BlogPostsList extends HTMLElement {
  async connectedCallback() {
    const posts = (await getContentByRoute('/blog')).filter(
      (page) => page.label !== 'Index' && page.label !== 'Blog'
    );

    this.innerHTML = `
      <ol>
        ${
          posts.map((post) => {
            const { label, route } = post;
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

customElements.define('x-posts-list', BlogPostsList);