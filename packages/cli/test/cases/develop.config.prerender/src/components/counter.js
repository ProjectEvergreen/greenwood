export default class Counter extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" }).innerHTML = "<button>Count: 0</button>";
    }
  }
}

customElements.define("app-counter", Counter);
