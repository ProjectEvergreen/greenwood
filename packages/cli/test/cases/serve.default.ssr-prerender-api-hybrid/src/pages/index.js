export default class HomePage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <h1>This is the home page.</h1>
    `;
  }
}