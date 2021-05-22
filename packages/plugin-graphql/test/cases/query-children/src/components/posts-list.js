import { html, LitElement } from 'lit';
import client from '@greenwood/plugin-graphql/core/client';
import ChildrenQuery from '@greenwood/plugin-graphql/queries/children';

class PostsListTemplate extends LitElement {

  static get properties() {
    return {
      posts: {
        type: Array
      }
    };
  }

  constructor() {
    super();
    this.posts = [];
  }

  async connectedCallback() {
    super.connectedCallback();
    const response = await client.query({
      query: ChildrenQuery,
      variables: {
        parent: 'blog'
      }
    });

    this.posts = response.data.children;
  }

  /* eslint-disable indent */
  render() {
    const { posts } = this;

    return html`
      <h1>My Posts</h1>

      <div class="posts">          
        <ul>
          ${posts.map((post) => {
            return html`
              <li>
                <a href="${post.route}" title="Click to read my ${post.title} blog post">${post.title} Post</a>
              </li>
            `;
          })}
        </ul>
      </div>
    `;
  }
  /* eslint-enable */
}

customElements.define('posts-list', PostsListTemplate);