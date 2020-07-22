import client from '@greenwood/cli/data/client';
import gql from 'graphql-tag';
import { html, LitElement } from 'lit-element';
import '../components/header';

class PostTemplate extends LitElement {

  static get properties() {
    return {
      post: {
        type: Object
      }
    };
  }

  constructor() {
    super();

    this.post = {
      title: '',
      link: '',
      data: {
        date: ''
      }
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    let route = window.location.pathname;
    const response = await client.query({
      query: gql`query {
        graph {
          title,
          link,
          data {
            date
          }
        }
      }`
    });

    if (route.lastIndexOf('/') !== route.length - 1) {
      route = `${route}/`;
    }

    this.post = response.data.graph.filter((page) => {
      return page.link.lastIndexOf(route) >= 0;
    })[0];
  }

  render() {
    const { date } = this.post.data;

    return html`
      <div>
        <app-header></app-header>
        
        <entry></entry>

        <p class="date">Posted on ${date}</p>
      </div>
    `;
  }
}

customElements.define('page-template', PostTemplate);