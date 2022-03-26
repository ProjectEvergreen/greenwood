import { html, LitElement } from 'lit';

class HeaderComponent extends LitElement {

  render() {
    return html`
      <header>
        <h1>This is the header component.</h1>
      </header>
    `;
  }

}

customElements.define('app-header', HeaderComponent);