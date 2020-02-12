import { html, LitElement } from 'lit-element';
import Prism from 'prismjs'; // eslint-disable-line no-unused-vars
import '../components/header/header';
import '../components/footer/footer';
import '@evergreen-wc/eve-container';
import '../components/shelf/shelf';
import '../components/scroll/scroll';
import pageCss from '../styles/page.css';
import '../styles/theme.css';

MDIMPORT;
METAIMPORT;
METADATA;

class PageTemplate extends LitElement {

  constructor() {
    super();
    this.shelfList = [];
    this.setupShelf();
  }

  setupShelf() {
    // based on path, display selected list
    const url = window.location.pathname;
    let list = [];

    if (url.indexOf('/about') >= 0) {
      list = () => import(/* webpackChunkName: 'about' */ '../components/shelf/about.json').then(({default: data}) => data);
    } else if (url.indexOf('/docs') >= 0) {
      list = () => import(/* webpackChunkName: 'documentation-list' */ '../components/shelf/documentation-list.json').then(({default: data}) => data);
    } else if (url.indexOf('/getting-started') >= 0) {
      list = () => import(/* webpackChunkName: 'getting-started' */ '../components/shelf/getting-started-list.json').then(({default: data}) => data);
    } else if (url.indexOf('/plugins') >= 0) {
      list = () => import(/* webpackChunkName: 'plugins' */ '../components/shelf/plugins.json').then(({default: data}) => data);
    }

    this.shelfList = list;
  }

  render() {
    return html`
      <style>
        ${pageCss}
      </style>
      METAELEMENT
      <div class='wrapper'>
        <eve-header></eve-header>
        <div class='content-wrapper'>
          <div class="sidebar">
            <eve-shelf .list="${this.shelfList}"></eve-shelf>
          </div>
          <div class="content">
            <eve-container fluid>
              <eve-scroll>
                <entry></entry>
              </eve-scroll>
            </eve-container>
          </div>
        </div>
        <eve-footer></eve-footer>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);