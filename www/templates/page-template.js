import { html, LitElement } from 'lit-element';
import css from '../styles/theme.css';
import css2 from '../styles/page.css';

MDIMPORT;
METAIMPORT;
METADATA;

class PageTemplate extends LitElement {
  render() {
    return html`
      <style>
        ${css}
        ${css2}
      </style>
      METAELEMENT
      <div class='wrapper'>
        <div class='page-template content'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);