export default class Card extends HTMLElement {
  connectedCallback() {
    const name = this.getAttribute('name');

    this.innerHTML = `
      <h1>Hello ${name}!!!</h1>
    `;
  }
}

customElements.define('x-card', Card);