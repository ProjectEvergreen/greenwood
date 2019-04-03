import { html, LitElement } from 'lit-element';
import css from './header.css';

class HeaderComponent extends LitElement {
  render() {
    return html`
      <style>
        ${css}
      </style>
      <header class="header">
        <h4>
          <a href="/">PROJECT EVERGREEN</a>
        </h4>
      </header>
    `;
  }
}

customElements.define('eve-header', HeaderComponent);