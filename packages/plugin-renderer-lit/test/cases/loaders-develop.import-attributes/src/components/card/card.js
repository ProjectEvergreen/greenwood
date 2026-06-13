import { LitElement, html } from "lit";
import sheet from "./card.css" with { type: "css" };

export default class Card extends LitElement {
  static properties = {
    title: { type: String },
    thumbnail: { type: String },
  };

  static styles = [sheet];

  constructor() {
    super();

    this.title;
    this.thumbnail;
  }

  selectItem() {
    alert(`selected item is => ${this.title}!`);
  }

  render() {
    const { title = "Foo", thumbnail = "bar.png" } = this;

    if (!title && !thumbnail) {
      return;
    }

    return html`
      <div>
        <h3>${title}</h3>
        <img src="${thumbnail}" alt="${title}" loading="lazy" width="100%" />
        <button @click="${this.selectItem}">View Item Details</button>
      </div>
    `;
  }
}

customElements.define("app-card", Card);
