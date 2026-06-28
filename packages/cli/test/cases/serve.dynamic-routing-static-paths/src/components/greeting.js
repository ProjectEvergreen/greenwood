export default class Greeting extends HTMLElement {
  connectedCallback() {
    const user = {
      name: this.getAttribute("name") || "World",
    };

    this.innerHTML = `
      <h3>Hello ${user.name}!</h3>
    `;
  }
}

customElements.define("x-greeting", Greeting);
