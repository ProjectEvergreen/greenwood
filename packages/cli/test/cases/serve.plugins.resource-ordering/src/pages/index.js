export default class HomePage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<h1>Plugin Ordering</h1>`;
  }
}
