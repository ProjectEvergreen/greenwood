import { html, LitElement } from 'lit-element';
import '../components/header/header';

class PageTemplate extends LitElement {
  render() {
    return html`
      <div class='wrapper'>
        <div class='page-template blog-content content owen-test'>
          <entry></entry>
        </div>
        <x-header></x-header>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);