import { html, LitElement } from 'lit-element';
import '../components/banner/banner';
import '../components/header/header';
import '../components/footer/footer';
import '@evergreen-wc/eve-container';
import css from '../styles/theme.css';
import homeTheme from '../styles/home.css';

MDIMPORT;
METAIMPORT;
METADATA;

class HomeTemplate extends LitElement {
  render() {
    return html`
      <style>
        ${css}
        ${homeTheme}
      </style>
      METAELEMENT
      <div class='wrapper'>
        <eve-header></eve-header>
        <eve-banner></eve-banner>
        <div class='content-wrapper'>
        <eve-container>
          <div class='page-template content single-column'>
            <entry></entry>
          </div>
        </eve-container>
        </div>
        <eve-footer></eve-footer>
      </div>
    `;
  }
}

customElements.define('page-template', HomeTemplate);