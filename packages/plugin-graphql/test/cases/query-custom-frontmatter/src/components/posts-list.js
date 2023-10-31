import { html, LitElement } from 'lit';
import client from '@greenwood/plugin-graphql/src/core/client.js';

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
      query: `
        query {
          graph {
            route,
            title,
            data {
              author,
              date
            }
          }
        }
      `
    });

    this.posts = response.data.graph
      .filter(page => page.route.indexOf('/blog/') >= 0)
      .filter(page => page.id !== 'index');
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
                <a href="${post.route}" title="Click to read my ${post.title} blog post">${post.title}</a>
                <span class="author">Written By: ${post.data.author}</span>
                <span class="date">On: ${post.data.date}</span>
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