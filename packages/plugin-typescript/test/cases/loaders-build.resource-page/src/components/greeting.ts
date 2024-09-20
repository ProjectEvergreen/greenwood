interface User {
  name: string;
}

export default class Greeting extends HTMLElement {
  connectedCallback() {
    const user: User = {
      name: this.getAttribute('name') || 'World'
    };

    this.innerHTML = `
      <h3>Hello ${user.name}!</h3>
    `;
  }
}

customElements.define('x-greeting', Greeting);