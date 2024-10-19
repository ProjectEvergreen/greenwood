import './caption.js';

export default class PictureFrame extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title');

    this.innerHTML = `
      <div class="picture-frame">
        ${this.innerHTML}
        <wcc-caption>
          <h6 class="heading">${title}</h6>
          <span>&copy; 2024</span>
        </wcc-caption>
      </div>
    `;
  }
}

customElements.define('wcc-picture-frame', PictureFrame);