import { html, LitElement } from 'lit-element';
import '../styles/theme.css';
import css from '../styles/style.css';

class PageTemplate extends LitElement {
  render() {
    return html`
      <style>
        ${css}
      </style>
      <div class='wrapper'>
        <div class='page-template content owen-test'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);