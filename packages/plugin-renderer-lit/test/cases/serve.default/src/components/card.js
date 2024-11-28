import { LitElement, html, css } from 'lit';

export default class Card extends LitElement {
  static styles = css`
    h3 {
      font-size: 1.85rem;
    }
    button {
      background: var(--color-accent);
      color: var(--color-white);
      padding: 1rem 2rem;
      border: 0;
      font-size: 1rem;
      border-radius: 5px;
      cursor: pointer;
    }
    img {
      max-width: 500px;
      min-width: 500px;
      width: 100%;
    }
  `;

  constructor() {
    super();

    this.title;
    this.thumbnail;
  }

  selectItem() {
    alert(`selected item is => ${this.title}!`);
  }

  render() {
    const { title = 'Foo', thumbnail = 'bar.png' } = this;

    if (!title && !thumbnail) {
      return;
    }

    return html`
      <div>
        <h3>${title}</h3>
        <img src="${thumbnail}" alt="${title}" loading="lazy" width="100%">
        <button @click="${this.selectItem}">View Item Details</button>
      </div>
    `;
  }
}

customElements.define('app-card', Card);