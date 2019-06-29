import { html, LitElement } from 'lit-element';
import themeCss from '../styles/theme.css';
import pageCss from '../styles/page.css';
import '../components/header/header';
import '../components/footer/footer';
import '@evergreen-wc/eve-container';
import '../components/shelf/shelf';
import '../components/scroll/scroll';

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
      list = require('../components/shelf/about.json');
    } else if (url.indexOf('/docs') >= 0) {
      list = require('../components/shelf/documentation-list.json');
    } else if (url.indexOf('/getting-started') >= 0) {
      list = require('../components/shelf/getting-started-list.json');
    }

    this.shelfList = list;
  }

  render() {
    return html`
      <style>
        ${themeCss}
        ${pageCss}
      </style>
      METAELEMENT
      <div class='wrapper'>
        <eve-header></eve-header>
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
        <eve-footer></eve-footer>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);