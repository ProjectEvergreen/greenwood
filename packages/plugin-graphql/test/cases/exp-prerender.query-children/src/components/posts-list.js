import client from '@greenwood/plugin-graphql/src/core/client.js';
import ChildrenQuery from '@greenwood/plugin-graphql/src/queries/children.gql' with { type: 'gql' };

export default class PostsList extends HTMLElement {
  async connectedCallback() {
    const response = await client.query({
      query: ChildrenQuery,
      variables: {
        parent: '/blog'
      }
    });
    const posts = response.data.children;

    /* eslint-disable indent */
    this.innerHTML = `
      <h1>My Posts</h1>

      <div class="posts">          
        <ul>
          ${posts.map((post) => {
            return `
              <li>
                <a href="${post.route}" title="Click to read my ${post.title} blog post">${post.title} Post</a>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
    /* eslint-enable indent */
  }
}

customElements.define('posts-list', PostsList);