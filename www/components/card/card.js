import { html, LitElement } from 'lit-element';
import css from './card.css';

class Card extends LitElement {

  static get properties() {
    return {
      img: {
        type: String
      },
      title: {
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
        <div class="card-img-top">
          <img src="${this.img}"/>
        </div>
      `;
    }
  }

  renderTitle() {
    if (this.title) {
      return html`
        <h3>${this.title}</h3>
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
        ${this.renderTitle()}
        <div class="body">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('eve-card', Card);