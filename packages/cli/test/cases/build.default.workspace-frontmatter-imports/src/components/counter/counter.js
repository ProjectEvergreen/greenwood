const template = document.createElement('template');
      
template.innerHTML = `
  <style>
    :host {
      color: blue;
    }
  </style>
  <h3>My Counter</h3>
  <button id="dec">-</button>
  <span id="count"></span>
  <button id="inc">+</button>
`;

export default class MyCounter extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
  }

  async connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }

  inc() {
    this.update(++this.count); // eslint-disable-line
  }

  dec() {
    this.update(--this.count); // eslint-disable-line
  }

  update(count) {
    this.shadowRoot.getElementById('count').innerHTML = count || this.count;
  }
}

customElements.define('x-counter', MyCounter);