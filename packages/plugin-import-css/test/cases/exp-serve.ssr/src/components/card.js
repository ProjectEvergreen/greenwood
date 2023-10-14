import styles from './card.css';

export default class Card extends HTMLElement {

  selectItem() {
    alert(`selected item is => ${this.getAttribute('title')}!`);
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const thumbnail = this.getAttribute('thumbnail');
      const title = this.getAttribute('title');
      const template = document.createElement('template');

      template.innerHTML = `
        <style>
          ${styles}
        </style>
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