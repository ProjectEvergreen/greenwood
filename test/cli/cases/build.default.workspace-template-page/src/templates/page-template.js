import { html, LitElement } from 'lit-element';

MDIMPORT;

class PageTemplate extends LitElement {
  render() {
    return html`
      <style>
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