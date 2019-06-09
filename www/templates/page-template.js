import { html, LitElement } from 'lit-element';
import themeCss from '../styles/theme.css';
import pageCss from '../styles/page.css';
import '../components/header/header';
import '../components/footer/footer';
import '@evergreen-wc/eve-container';
import '../components/shelf/shelf';

MDIMPORT;
METAIMPORT;
METADATA;

class PageTemplate extends LitElement {
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
            <eve-shelf></eve-shelf>
          </div>
          <div class="content">
            <eve-container fluid>
              <entry></entry>
            </eve-container>       
          </div>
          </div>
        <eve-footer></eve-footer>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);