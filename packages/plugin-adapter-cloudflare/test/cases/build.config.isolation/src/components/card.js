export default class Card extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = "<h2>Shared card</h2>";
  }
}

export function registerCard() {
  if (customElements.get("app-cloudflare-isolated")) {
    throw new Error("app-cloudflare-isolated was registered more than once");
  }

  customElements.define("app-cloudflare-isolated", Card);
}
