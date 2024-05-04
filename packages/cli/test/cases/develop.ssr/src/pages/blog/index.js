export default class BlogPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <h1>Nested SSR page should work!</h1>
    `;
  }
}