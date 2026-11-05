import { LitElement, html } from "lit";
import sheet from "./card.css" with { type: "css" };

class Card extends LitElement {
  static properties = {
    title: { type: String },
  };

  static styles = [sheet];

  render() {
    return html`<h3>${this.title}</h3>`;
  }
}

customElements.define("app-card", Card);
