import { html, LitElement } from 'lit-element';
import css from './footer.css';

class FooterComponent extends LitElement {
  render() {
    return html`
      <style>
        ${css}
      </style>
      <footer class="footer">
        <h4>
          <a href="/">PROJECT EVERGREEN</a>
        </h4>
      </footer>
    `;
  }
}

customElements.define('eve-footer', FooterComponent);