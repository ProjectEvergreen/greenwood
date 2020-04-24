import { html, LitElement } from 'lit-element';
import client from '@greenwood/cli/data/client';
import gql from 'graphql-tag';

MDIMPORT;

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
      query: gql`query($parent: String!) {
        children(parent: $parent) {
          id,
          title,
          link,
          filePath,
          fileName,
          template,
          data {
            date,
            author
          }
        }
      }`,
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

      <div class='container'>
      
        <entry></entry>

        <div class="posts">
          <h1>More Posts</h1>

          <ul>
            ${posts.map((post) => {
              return html`
                <li>
                  <a href="${post.link}/" title="Click to read my ${post.title} blog post">
                    ${post.title} posted: ${post.data.date}
                  </a>
                  <span>Author: ${post.data.author}</span>
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