import './social-links.js';

export default class FooterComponent extends HTMLElement {

  connectedCallback() {
    this.innerHTML = `
      <footer>
        <p>This is the footer component.</p>
        <app-social-links></app-social-links>
      </footer>
    `;
  }
}

customElements.define('app-footer', FooterComponent);