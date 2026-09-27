export default class Card extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      const title = this.getAttribute("title");
      const thumbnail = this.getAttribute("thumbnail");
      const template = document.createElement("template");

      template.innerHTML = `
        <article>
          <h2>${title}</h2>
          <img src="${thumbnail}" alt="${title}" loading="lazy">
        </article>
      `;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define("app-card", Card);
