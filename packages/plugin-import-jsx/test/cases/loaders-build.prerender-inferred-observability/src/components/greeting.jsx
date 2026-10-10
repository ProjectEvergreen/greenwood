export default class Greeting extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.render();
    }
  }

  render() {
    return <p>Hello from SSR</p>;
  }
}

customElements.define("wcc-greeting", Greeting);
