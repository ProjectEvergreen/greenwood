import { html, LitElement } from 'lit-element';
// import css from '../templates/theme.css';
MDIMPORT

class PageTemplate extends LitElement {
  render() {
    return html`
      <div class='wrapper'>
        <div class='page-template content'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);

// <!-- <style>
// ${css}
// </style> -->