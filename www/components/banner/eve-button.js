import { css, html, LitElement, unsafeCSS } from 'lit';
import eveButtonCss from './eve-button.css';

class Button extends LitElement {

  static get properties() {
    return {
      href: {
        type: String
      },
      onClick: {
        type: Function
      },
      size: {
        type: String
      },
      style: {
        type: String
      }
    };
  }

  get styles() {
    return css`
      ${unsafeCSS(eveButtonCss)}
    `;
  }

  updated() {
    const shadow = this.shadowRoot;
    const childNodes = Array.from(shadow.childNodes);

    childNodes.forEach(childNode => {
      if (childNode.nodeName === 'STYLE') {
        childNode.textContent += this.style;
      } else if (childNode.nodeName === 'A') {
        childNode.style = this.style;
      }
    });
  }

  /* eslint-disable indent */
  render() {
    const { size, href, onClick } = this;

    return html`
      <style>
      </style>
      ${href
        ? html`
          <a class="btn btn-${size}" href="${href}">
            <slot></slot>
          </a>
          `
        : html `
          <a class="btn btn-${size}" href="#" @click="${onClick}">
            <slot></slot>
          </a>
        `}
    `;
  }
}

customElements.define('eve-button', Button);