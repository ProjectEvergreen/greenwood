import { html, LitElement } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import nav from "./nav.json" with { type: "json" };
import sheet from "./header.css" with { type: "css" };

class HeaderComponent extends LitElement {
  static styles = [sheet];

  render() {
    return html`
      <header>
        <h1>This is the header component.</h1>
        <nav>
          <ul>
            ${nav.items.map((item) => unsafeHTML(`<li>${item}</li>`))}
          </ul>
        </nav>
      </header>
    `;
  }
}

customElements.define("app-header", HeaderComponent);
