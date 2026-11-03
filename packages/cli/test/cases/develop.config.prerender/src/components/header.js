import { getContent } from "@greenwood/cli/src/data/client.js";
import { message } from "./message.js";

export default class Header extends HTMLElement {
  async connectedCallback() {
    const pages = await getContent();
    this.innerHTML = `<header>${message}<nav>${pages
      .map((page) => `<a href="${page.route}">${page.label}</a>`)
      .join("")}</nav></header>`;
  }
}

customElements.define("app-header", Header);
