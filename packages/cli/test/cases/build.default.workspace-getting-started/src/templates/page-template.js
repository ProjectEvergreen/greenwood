import { html, LitElement } from 'lit-element';
import '../components/footer';
import '../components/header';
import '../styles/theme.css';

class PageTemplate extends LitElement {

  constructor() {
    super();
  }

  render() {
    return html`
      
      <style>
        section {
          margin: 0 auto;
          width: 70%;
        }
      </style>
    

      <div>
        <app-header></app-header>
        <entry></entry>
        <app-footer></app-footer>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);