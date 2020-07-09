import { html, css, LitElement } from 'lit-element';

class AppComponent extends LitElement {

  render() {
    return html`
      MYROUTES
      <lit-route><h1>404 Not found</h1></lit-route>
    `;
  }
}

customElements.define('eve-app', AppComponent);
