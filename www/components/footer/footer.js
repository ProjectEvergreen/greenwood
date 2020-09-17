import { html, LitElement } from 'lit-element';
// make sure version gets bumped first when building for release
import json from '../../package.json';
// import footerCss from './footer.css';

class FooterComponent extends LitElement {

  render() {
    const { version } = json;

    return html`
      <!-- TODO use static styles for footerCss -->
      <footer class="footer">
        <h4>
          <a href="/">Greenwood v${version}</a>
        </h4>
      </footer>
    `;
  }
}

customElements.define('app-footer', FooterComponent);