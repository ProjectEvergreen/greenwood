const template = document.createElement('template');

template.innerHTML = `
  <div class="card">
    <slot name="title">My default title</slot>
    <slot name="image"></slot>
  </div>
  <hr/>
`;

class Card extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define('app-card', Card);

export default Card;