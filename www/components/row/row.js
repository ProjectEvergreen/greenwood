import { css, html, LitElement, unsafeCSS } from 'lit-element';
import rowCss from './row.css';

class Row extends LitElement {

  static get styles() {
    return css`
      ${unsafeCSS(rowCss)}
    `;
  }

  render() {
    return html`
      <slot></slot>
    `;
  }
}

customElements.define('app-row', Row);
