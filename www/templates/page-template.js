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

let shelfList = [];

class PageTemplate extends LitElement {

  constructor() {
    super();
    this.setupShelf();
  }

  setupShelf() {
    // based on path, display selected list
    const path = window.location.pathname;

    if (path.substring(0, 5) === '/docs') {
      shelfList = require('../components/shelf/documentation-list.json');
    } else {
      shelfList = require('../components/shelf/getting-started-list.json');
    }
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
            <eve-shelf .shelfList="${shelfList}"></eve-shelf>
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