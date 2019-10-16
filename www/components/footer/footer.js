import { html, LitElement } from 'lit-element';
// make sure version gets bumped first when building for release
import { version } from '../../package.json';
import footerCss from './footer.css';

class FooterComponent extends LitElement {
  render() {
    return html`
      <style>
        ${footerCss}
      </style>
      <footer class="footer">
        <h4>
          <a href="/">Greenwood v${version}</a>
        </h4>
      </footer>
    `;
  }
}

customElements.define('eve-footer', FooterComponent);