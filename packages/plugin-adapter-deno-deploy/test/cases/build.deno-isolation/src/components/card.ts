export default class Card extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = "<h2>Shared card</h2>";
  }
}

export function registerCard() {
  if (customElements.get("app-shared")) {
    throw new Error("app-shared was registered more than once");
  }

  customElements.define("app-shared", Card);
}
