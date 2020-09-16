import { html, LitElement } from 'lit-element';
// make sure version gets bumped first when building for release
// import { version } from '../../package.json';
// import footerCss from './footer.css';

class FooterComponent extends LitElement {
  render() {
    return html`
      <!-- TODO use static styles for footerCss -->
      <footer class="footer">
        <h4>
          <a href="/">Greenwood vTODO</a>
        </h4>
      </footer>
    `;
  }
}

customElements.define('app-footer', FooterComponent);