import { html, LitElement } from 'lit';

class FooterComponent extends LitElement {

  render() {
    const year = '2022';

    return html`
      <footer>
        <h4>My Blog ${year}</h4>
      </footer>
    `;
  }
}

customElements.define('app-footer', FooterComponent);