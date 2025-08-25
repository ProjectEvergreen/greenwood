const template = document.createElement("template");

template.innerHTML = `
  <div class="my-logo">
    <span class="spacer"></span>

    <div>
      <p>Logo goes here</p>
    </div>
  </div>
`;

export default class Logo extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      const message = "Message from logo component";
      console.log({ message });

      this.attachShadow({ mode: "open" });
      this.shadowRoot?.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define("app-logo", Logo);
