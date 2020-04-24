import { html, LitElement } from 'lit-element';
import '../components/header';

MDIMPORT;

class PageTemplate extends LitElement {

  constructor() {
    super();
  }

  render() {
    return html`
      <div>
        <app-header></app-header>
        
        <entry></entry>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);