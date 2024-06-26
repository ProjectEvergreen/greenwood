export default class BlogFirstPostPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <h1>Nested SSR First Post page should work!</h1>
    `;
  }
}