import { html, LitElement } from 'lit-element';
import css from './row.css';

class Row extends LitElement {
  render() {
    return html`
    <style>
      ${css}
    </style>
      <slot></slot>
    `;
  }
}

customElements.define('eve-row', Row);
