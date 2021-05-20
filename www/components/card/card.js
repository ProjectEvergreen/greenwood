import { css, html, LitElement, unsafeCSS } from 'lit';
import cardCss from './card.css?type=css';

class Card extends LitElement {

  static get styles() {
    return css`
      ${unsafeCSS(cardCss)}
    `;
  }

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
          <img src="${this.img}" alt="${this.title}" loading="lazy"/>
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
      ${this.renderImage()}
      ${this.renderTitle()}
      <slot name="cardcontent"></slot>
    `;
  }
}

customElements.define('app-card', Card);
