import { html, LitElement } from 'lit-element';
import '../components/banner/banner';
import '../components/card/card';
import '../components/header/header';
import '../components/footer/footer';
import '../components/row/row';
import '@evergreen-wc/eve-container';
import '../styles/theme.css';
import homeCss from '../styles/home.css';

MDIMPORT;
METAIMPORT;
METADATA;

class HomeTemplate extends LitElement {
  render() {
    return html`
      <style>
        ${homeCss}
      </style>
      METAELEMENT
      <div class='wrapper'>
        <eve-header></eve-header>
        <eve-banner></eve-banner>
        <div class='content-wrapper'>
        <eve-container fluid>
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