import { html, LitElement } from 'lit-element';
import '../styles/my-brand.css';
MDIMPORT;

class PageTemplate extends LitElement {
  render() {
    return html`
      <div class='wrapper'>
        <div class='page-template content owen-test'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);