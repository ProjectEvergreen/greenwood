export default class Card extends HTMLElement {

  selectArtist() {
    alert(`selected artist is => ${this.getAttribute('title')}!`);
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const thumbnail = this.getAttribute('thumbnail');
      const title = this.getAttribute('title');
      const template = document.createElement('template');

      template.innerHTML = `
        <div>
          <h2>${title}</h2>
          <button onclick="this.parentNode.parentNode.host.selectArtist()">View Artist Details</button>
          <img src="${thumbnail}" loading="lazy" width="25%">
          <hr/>
        </div>
      `;
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define('app-card', Card);