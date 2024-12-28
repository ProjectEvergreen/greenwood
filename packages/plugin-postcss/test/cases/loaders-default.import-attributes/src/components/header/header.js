import themeSheet from '../../styles/theme.css' with { type: 'css' };
import headerSheet from './header.css' with { type: 'css' };
import SpectrumTypography from '@spectrum-css/typography' with { type: 'css' };

export default class Header extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      const template = document.createElement('template');

      template.innerHTML = `
        <header>
          <span>Welcome to my site</span>
        </header>
      `;

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    this.shadowRoot.adoptedStyleSheets = [themeSheet, headerSheet, SpectrumTypography];
  }
}

customElements.define('app-header', Header);