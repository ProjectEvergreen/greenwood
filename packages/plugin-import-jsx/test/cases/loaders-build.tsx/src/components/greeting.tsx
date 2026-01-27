export default class GreetingComponent extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const greeting = this.getAttribute("greeting") || "World";

    return <span> Hello, {greeting}!</span>;
  }
}

customElements.define("app-greeting", GreetingComponent);
