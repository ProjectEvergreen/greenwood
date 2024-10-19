export default class PictureFrame extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title');

    this.innerHTML = `
      <div class="picture-frame">
        <h6 class="heading">${title}</h6>
        ${this.innerHTML}
      </div>
    `;
  }
}

customElements.define('app-picture-frame', PictureFrame);