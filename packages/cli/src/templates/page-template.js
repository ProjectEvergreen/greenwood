import { html, LitElement } from 'lit-element';
MDIMPORT;

class PageTemplate extends LitElement {
  render() {
    return html`
      <div class='wrapper'>
        <div class='gwd-page-template gwd-content'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);