import { html, LitElement } from 'lit-element';
import '../components/footer';
import '../components/header';

MDIMPORT;
METAIMPORT;
METADATA;

class BlogTemplate extends LitElement {

  constructor() {
    super();
  }

  render() {
    return html`
      <style>

      </style>
      
      METAELEMENT

      <div class='container'>
        <app-header></app-header>
        <entry></entry>
        <app-footer></app-footer>
      </div>
    `;
  }
}

customElements.define('page-template', BlogTemplate);