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

  static get properties() {
    return {
      route: {
        type: String
      }
    };
  }

  constructor() {
    super();
    this.route = '';
  }

  updated() {
    this.route = window.location.pathname;
  }

  render() {
    const { route } = this;
    const page = route.split('/')[1];

    return html`
      <style>
        ${pageCss}
      </style>

      METAELEMENT
     
      <div class='wrapper'>
        <eve-header></eve-header>
        
        <div class='content-wrapper'>
          <div class="sidebar">
            <eve-shelf .page="${page}"></eve-shelf>
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