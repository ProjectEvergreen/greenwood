import { html, LitElement } from 'lit-element';

class PageTemplate extends LitElement {
  render() {
    return html`
      <div class='gwd-wrapper'>
        <div class='gwd-page-template gwd-content'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);