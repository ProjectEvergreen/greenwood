import { html, LitElement } from 'lit-element';
import css from '../styles/theme.css';
import pageTheme from '../styles/page.css';
import '../components/header/header';
import '../components/footer/footer';
import '@evergreen-wc/eve-container';

MDIMPORT;
METAIMPORT;
METADATA;

class PageTemplate extends LitElement {
  render() {
    return html`
      <style>
        ${css}
        ${pageTheme}
      </style>
      METAELEMENT
      <div class='wrapper'>
        <eve-header></eve-header>
        <div class='content-wrapper'>
          <eve-container>
            <div class='page-template content two-column'>
              <entry></entry>
            </div>
          </eve-container>       
        </div>
        <eve-footer></eve-footer>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);