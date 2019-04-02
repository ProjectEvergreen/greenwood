import { html, LitElement } from 'lit-element';
import css from '../styles/template.css';
import css2 from '../styles/theme.css';

MDIMPORT;

class PageTemplate extends LitElement {
  render() {
    return html`
      <style>
        ${css}
        ${css2}
      </style>
      <div class='wrapper'>
        <div class='page-template content'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);