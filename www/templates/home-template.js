import { html, LitElement } from 'lit-element';
import '../components/banner/banner';
import css from '../styles/theme.css';
import css2 from '../styles/home.css';

MDIMPORT;
METAIMPORT;
METADATA;

class HomeTemplate extends LitElement {
  render() {
    return html`
      <style>
        ${css}
        ${css2}
      </style>
      METAELEMENT
      <eve-banner></eve-banner>
      <div class='wrapper'>
        <div class='page-template content'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', HomeTemplate);