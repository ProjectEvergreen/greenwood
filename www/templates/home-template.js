import { html, LitElement } from 'lit-element';
import css from '../styles/theme.css';
MDIMPORT;
METAIMPORT;
METADATA;

class HomeTemplate extends LitElement {
  render() {
    return html`
      <style>
        ${css}
      </style>
      METAELEMENT
      <div class='wrapper'>
        <div class='home-template content single-column'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', HomeTemplate);