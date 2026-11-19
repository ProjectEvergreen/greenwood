import { getContentByCollection } from "@greenwood/cli/src/data/client.js";

export default class Header extends HTMLElement {
  async connectedCallback() {
    const pages = await getContentByCollection("nav");

    this.innerHTML = `<nav>${pages
      .map((page) => `<a href="${page.route}">${page.title}</a>`)
      .join("")}</nav>`;
  }
}

customElements.define("app-header", Header);
