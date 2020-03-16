import { html, LitElement } from 'lit-element';
import '@evergreen-wc/eve-container';
import '../components/shelf/shelf';
import '../components/scroll/scroll';
import pageCss from '../styles/page.css';
import '../styles/theme.css';

MDIMPORT;
METAIMPORT;
METADATA;

class PageTemplate extends LitElement {

  static get properties() {
    return {
      shelfList: {
        type: Array
      }
    };
  }

  constructor() {
    super();
    this.shelfList = [];
    this.setupShelf();
  }

  async setupShelf() {
    // based on path, display selected list
    const url = window.location.pathname;
    let list = [];
    
    if (url.indexOf('/about') >= 0) {
      list = await import(/* webpackChunkName: 'about' */ '../components/shelf/about.json').then(({ default: data }) => data);
    } else if (url.indexOf('/docs') >= 0) {
      list = await import(/* webpackChunkName: 'documentation-list' */ '../components/shelf/documentation-list.json').then(({ default: data }) => data);
    } else if (url.indexOf('/getting-started') >= 0) {
      list = await import(/* webpackChunkName: 'getting-started' */ '../components/shelf/getting-started-list.json').then(({ default: data }) => data);
    } else if (url.indexOf('/plugins') >= 0) {
      list = await import(/* webpackChunkName: 'plugins' */ '../components/shelf/plugins.json').then(({ default: data }) => data);
    }

    this.shelfList = list;
  }

  render() {
    return html`
      <style>
        ${pageCss}
      </style>
      METAELEMENT
        <div class='content-wrapper'>
          <div class="sidebar">
            <eve-shelf .shelfList="${this.shelfList}"></eve-shelf>
          </div>
          <div class="content">
            <eve-container fluid>
              <eve-scroll>
                <entry></entry>
              </eve-scroll>
            </eve-container>
          </div>
        </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);