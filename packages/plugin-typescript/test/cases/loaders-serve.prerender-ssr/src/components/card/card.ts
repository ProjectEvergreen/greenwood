export default class Card extends HTMLElement {

  selectItem() {
    alert(`selected item is => ${this.getAttribute('title')}!`);
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const thumbnail: String = this.getAttribute('thumbnail');
      const title: String = this.getAttribute('title');
      const template: any = document.createElement('template');

      template.innerHTML = `
        <div>
          <h3>${title}</h3>
          <img src="${thumbnail}" alt="${title}" loading="lazy" width="100%">
          <button onclick="this.parentNode.parentNode.host.selectItem()">View Item Details</button>
        </div>
      `;
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define('app-card', Card);