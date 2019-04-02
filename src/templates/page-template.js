import { html, LitElement } from 'lit-element';
import '../components/header';
MDIMPORT;

class PageTemplate extends LitElement {
  render() {
    return html`
      <div class='wrapper'>
        <eve-header></eve-header>
        <div class='page-template content'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);