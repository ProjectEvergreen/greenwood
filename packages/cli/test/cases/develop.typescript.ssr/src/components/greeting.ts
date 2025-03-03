import greetingSheet from "./greeting.css" with { type: "css" };

interface User {
  name: string;
}

export default class Greeting extends HTMLElement {
  connectedCallback() {
    console.log({ greetingSheet });
    const user: User = {
      name: this.getAttribute("name") || "World",
    };

    this.innerHTML = `
      <h3>Hello ${user.name}!</h3>
    `;
  }
}

customElements.define("x-greeting", Greeting);
