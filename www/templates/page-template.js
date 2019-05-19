import { html, LitElement } from 'lit-element';
import css from '../styles/theme.css';
MDIMPORT;
METAIMPORT;
METADATA;

class PageTemplate extends LitElement {
  render() {
    return html`
      <style>
        ${css}
      </style>
      METAELEMENT
      <div class='wrapper'>
        <div class='page-template content two-column'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);