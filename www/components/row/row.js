import { html, LitElement } from 'lit-element';

class Row extends LitElement {
  render() {
    return html`
    <style>
      :host {
        margin-left: -0.25rem;
        margin-right: -0.25rem;
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-orient: horizontal;
        -webkit-box-direction: normal;
        -ms-flex-flow: row wrap;
        flex-flow: row wrap;
        -webkit-box-pack: justify;
        -ms-flex-pack: justify;
        justify-content: center;
      }
    </style>
      <slot></slot>
    `;
  }
}

customElements.define('eve-row', Row);