import { css, html, LitElement, unsafeCSS } from 'lit-element';
import json from '../../package.json?type=json';
import footerCss from './footer.css';

class FooterComponent extends LitElement {

  static get styles() {
    return css`
      ${unsafeCSS(footerCss)}
    `;
  }

  render() {
    const { version } = json;

    console.debug('VERSION', version);

    return html`
      <footer class="footer">
        <h4>
          <a href="/">Greenwood v${version}</a> <span class="separator">&#9672</span> <a href="https://www.netlify.com/">This site is powered by Netlify</a>
        </h4>
      </footer>
    `;
  }
}

customElements.define('app-footer', FooterComponent);