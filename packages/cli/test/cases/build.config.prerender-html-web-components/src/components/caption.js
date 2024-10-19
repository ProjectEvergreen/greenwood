export default class Caption extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="caption">
        ${this.innerHTML}
      </div>
    `;
  }
}

customElements.define('wcc-caption', Caption);