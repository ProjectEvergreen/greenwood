const template = document.createElement('template');

template.innerHTML = `
  <p>I have multiple hyphens in my tag name!</p>
`;

export default class MultiHyphen extends HTMLElement {
  async connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define('multihyphen-custom-element', MultiHyphen);