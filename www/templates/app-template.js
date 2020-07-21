import { html, css, LitElement } from 'lit-element';
import '../components/header/header';
import '../components/footer/footer';

class AppComponent extends LitElement {

  static get styles() {
    return css`
    .gwd-content-outlet {
      min-height: 100vh
    }`;
  }

  render() {
    return html`
      <div class='gwd-wrapper'>
        <eve-header></eve-header>
        <div class="gwd-content-outlet">
          MYROUTES
        </div>
        <lit-route><h1>404 Not found</h1></lit-route>
        <eve-footer></eve-footer>
      </div>
    `;
  }
}

customElements.define('eve-app', AppComponent);
