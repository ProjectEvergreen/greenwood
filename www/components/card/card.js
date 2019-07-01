import { html, LitElement } from 'lit-element';
import css from './card.css';

class Card extends LitElement {

  static get properties() {
    return {
      img: {
        type: String
      },
      size: {
        type: String
      }
    };
  }

  renderImage() {
    if (this.img) {
      return html`
        <img src="${this.img}" class="card-img-top" />
      `;
    }
  }

  render() {
    return html`
    <style>
      ${css}
    </style>
      <div class="card ${this.size ? `card-${this.size}` : ''}">
        ${this.renderImage()}
        <div class="body">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('eve-card', Card);