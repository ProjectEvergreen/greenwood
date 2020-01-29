import { html, LitElement } from 'lit-element';
import client from '@greenwood/cli/data/client';
import ChildrenQuery from '@greenwood/cli/data/queries/children';
import '../components/header';

MDIMPORT;
METAIMPORT;
METADATA;

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

    this.posts = response.data.children;
  }

  /* eslint-disable indent */
  render() {
    const { posts } = this;

    return html`
      METAELEMENT

      <div class='container'>
        <app-header></app-header>

        <entry></entry>

        <div class="posts">
          <h1>More Posts</h1>

          <ul>
            ${posts.map((item) => {
              return html`
                <li>
                  <a href="${item.link}/" title="Click to read my ${item.title} blog post">${item.title}</a>
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