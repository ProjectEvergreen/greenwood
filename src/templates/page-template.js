import { html, LitElement } from 'lit-element';
import '../components/header/header';
import css from '../styles/template.css';
MDIMPORT;

class PageTemplate extends LitElement {
  render() {
    return html`
      <style>
        ${css}
      </style>
      <div class='wrapper'>
        <eve-header></eve-header>
        <h1>Page Template Example</h1>
        <div class='page-template content'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);