import { html, LitElement } from 'lit-element';
import client from '@greenwood/cli/data/client';
import ChildrenQuery from '@greenwood/cli/data/queries/children';
import '../components/header';

class BlogTemplate extends LitElement {

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

    this.posts = response.data.children.filter(post => {
      return post.filePath.indexOf('/blog/index') < 0;
    });
  }

  /* eslint-disable indent */
  render() {
    const { posts } = this;

    return html`

      <div class='container'>
        <app-header></app-header>

        <div class="posts">
          <entry></entry>
          
          <ul>
            ${posts.map((post) => {
              return html`
                <li>
                  <a href="${post.link}" title="Click to read my ${post.title} blog post">${post.title}</a>
                </li>
              `;
            })}
          </ul>
        </div>

      </div>
    `;
  }
  /* eslint-enable */
}

customElements.define('page-template', BlogTemplate);