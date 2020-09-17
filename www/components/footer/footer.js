import { css, html, LitElement, unsafeCSS } from 'lit-element';
import json from '../../package.json';
import footerCss from './footer.css';

class FooterComponent extends LitElement {

  static get styles() {
    return css`
      ${unsafeCSS(footerCss)}
    `;
  }

  render() {
    const { version } = json;

    return html`
      <footer class="footer">
        <h4>
          <a href="/">Greenwood v${version}</a>
        </h4>
      </footer>
    `;
  }
}

customElements.define('app-footer', FooterComponent);