const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 80%;
      margin: 50px auto!important;
      text-align: center;
    }

    [name="title"] {
      color: green;
    }

    ::slotted(img) {
      max-width: 500px;
    }

    hr {
      border-top: 1px solid var(--color-accent);
    }
  </style>

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

export default Card;

customElements.define('wc-card', Card);