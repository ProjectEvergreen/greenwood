import { html, LitElement } from 'lit-element';
import footerCss from './footer.css';

class FooterComponent extends LitElement {
  render() {
    return html`
      <style>
        ${footerCss}
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