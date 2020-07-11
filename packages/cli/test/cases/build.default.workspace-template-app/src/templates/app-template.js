import { html, LitElement } from 'lit-element';

class AppComponent extends LitElement {

  render() {
    return html`
      MYROUTES
      <p id="custom-app-template">My Custom App Template</p>
    `;
  }
}

customElements.define('eve-app', AppComponent);